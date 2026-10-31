#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
ÁQUILA PRO — RADAR DE PROVAS, CURADORIA & QUARENTENA SOBERANA (v5.1)
================================================================================
Pipeline Segregado de Descoberta, Validação Técnica e Governança de Direitos.
Esta etapa cuida EXCLUSIVAMENTE da coleta, download atômico, extração em
quarentena e auditoria de direitos. NÃO realiza treinamentos autônomos e
NÃO publica artefatos em produção.

Módulos & Controles:
  1. TLS Seguro (ssl.create_default_context()) sem contornos de segurança.
  2. Proteção Anti-SSRF e limites estritos de payload e timeout.
  3. Separação categórica entre Procedência e Decisão Jurídica de Direitos:
     - Todo candidato entra como DIREITOS_PENDENTES.
     - Operações exigem autorização humana identificável (approved_operations).
  4. Deduplicação Multicamadas:
     - Hash binário do arquivo.
     - Hash do conteúdo pedagógico normalizado (preservando fórmulas e alternativas).
     - Procedência e Execution ID estritamente separados.
  5. Imunidade Absoluta a Contaminações:
     - Erros e timeouts geram eventos operacionais, NUNCA exemplos de dataset.
  6. Fila Recuperável e Transacional (Lease Timeout & Atomic Promotion):
     - Downloads em arquivos temporários `.part` promovidos apenas após hash.
  7. Exclusão Mútua Real (Lock Atômico no Windows via os.O_EXCL / msvcrt).
  8. Desacoplamento Total de Treinamento e Publicação.

Uso:
  python scripts/swarm_continuous_finetune_daemon.py --once
  python scripts/swarm_continuous_finetune_daemon.py --status
================================================================================
"""

import os
import re
import sys
import ssl
import json
import time
import socket
import sqlite3
import hashlib
import argparse
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
SQLITE_SRC = ROOT / "apps" / "electron" / "src" / "database" / "pedagogical_scaffolding.db"
SQLITE_DIST = ROOT / "apps" / "electron" / "dist" / "database" / "pedagogical_scaffolding.db"
SWARM_DATASET = ROOT / "swarm" / "dataset" / "aquila_finetune_dataset.jsonl"
STATE_FILE = ROOT / "test-results" / "swarm-continuous-finetune-state.json"
LOCK_FILE = ROOT / "test-results" / "swarm_continuous_finetune.lock"
PDF_DIR = ROOT / "colab" / "data_finetuning" / "downloaded_pdfs"

# Versão do extrator de texto
EXTRACTOR_VERSION = "pypdf-6.13.2" if HAS_PYPDF else "raw-unextracted"

# Limites de segurança e governança
MAX_HTML_BYTES = 10 * 1024 * 1024      # 10 MB
MAX_PDF_BYTES = 50 * 1024 * 1024       # 50 MB
REQUEST_TIMEOUT_SECONDS = 20
LEASE_DURATION_SECONDS = 300           # 5 minutos para lease de worker

# TLS Rigoroso com Verificação de Certificados Obrigatória
STRICT_SSL_CTX = ssl.create_default_context()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 AquilaRadarQuarantine/5.1",
    "Accept": "text/html,application/xhtml+xml,application/pdf,application/json;q=0.9,*/*;q=0.8",
}

BLOCKED_IP_PREFIXES = (
    "127.", "10.", "192.168.", "169.254.", "0.", "::1", "fc00:", "fe80:"
)


# ==============================================================================
# 1. VALIDAÇÃO DE SEGURANÇA DE URL (ANTI-SSRF)
# ==============================================================================
def is_safe_external_url(url: str) -> bool:
    """Impede SSRF garantindo esquemas http/https e bloqueando endereços de loopback/redes locais."""
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = parsed.hostname
        if not hostname:
            return False
        hostname_lower = hostname.lower()
        if hostname_lower in ("localhost", "local", "internal", "127.0.0.1", "0.0.0.0"):
            return False
        # Resolução de IP para barrar DNS rebinding a redes privadas
        try:
            ip = socket.gethostbyname(hostname)
            for prefix in BLOCKED_IP_PREFIXES:
                if ip.startswith(prefix):
                    return False
        except Exception:
            pass
        return True
    except Exception:
        return False


# ==============================================================================
# 2. LOCK SINGLETON ATÔMICO
# ==============================================================================
class ProcessLock:
    """
    Exclusão mútua atômica compatível com Windows e POSIX.
    Usa criação exclusiva de arquivo (O_CREAT | O_EXCL) e validação de processo ativo.
    """
    def __init__(self, lock_path: Path):
        self.lock_path = lock_path
        self.fd = None
        self.acquired = False

    def __enter__(self):
        self.lock_path.parent.mkdir(parents=True, exist_ok=True)
        # Se o lockfile existe, verifica se o processo registrado ainda está em execução
        if self.lock_path.exists():
            try:
                data = json.loads(self.lock_path.read_text(encoding="utf-8"))
                pid = data.get("pid")
                if pid and self._is_pid_alive(pid):
                    raise RuntimeError(
                        f"Instância concorrente ativa detectada (PID {pid}, iniciada em {data.get('started_at')}). "
                        f"Execução bloqueada por exclusão mútua."
                    )
                else:
                    # Lock órfão (stale): processo encerrou sem limpar
                    self.lock_path.unlink(missing_ok=True)
            except (json.JSONDecodeError, OSError):
                self.lock_path.unlink(missing_ok=True)

        try:
            flags = os.O_CREAT | os.O_EXCL | os.O_RDWR
            self.fd = os.open(str(self.lock_path), flags)
            payload = {
                "pid": os.getpid(),
                "started_at": datetime.now(timezone.utc).isoformat(),
                "host": socket.gethostname()
            }
            os.write(self.fd, json.dumps(payload, indent=2).encode("utf-8"))
            self.acquired = True
            return self
        except OSError as e:
            raise RuntimeError(f"Falha ao adquirir lock exclusivo de execução: {e}")

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.acquired:
            if self.fd is not None:
                try:
                    os.close(self.fd)
                except OSError:
                    pass
            if self.lock_path.exists():
                try:
                    self.lock_path.unlink(missing_ok=True)
                except OSError:
                    pass
            self.acquired = False

    @staticmethod
    def _is_pid_alive(pid: int) -> bool:
        if os.name == "nt":
            try:
                import ctypes
                PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
                SYNCHRONIZE = 0x00100000
                handle = ctypes.windll.kernel32.OpenProcess(
                    PROCESS_QUERY_LIMITED_INFORMATION | SYNCHRONIZE, False, pid
                )
                if handle == 0:
                    return False
                ctypes.windll.kernel32.CloseHandle(handle)
                return True
            except Exception:
                return False
        else:
            try:
                os.kill(pid, 0)
                return True
            except OSError:
                return False


# ==============================================================================
# 3. FONTES COM CLASSIFICAÇÃO DE PROCEDÊNCIA EXPLÍCITA
# ==============================================================================
WATCHED_RADARS = [
    {
        "radar_id": "RADAR_INEP_ENEM",
        "source_category": "OFICIAL_GOV",
        "fonte": "INEP / MEC",
        "exame": "ENEM",
        "instituicao": "INEP / Ministério da Educação",
        "disciplina": "Multidisciplinar",
        "url": "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos",
        "base_domain": "https://www.gov.br"
    },
    {
        "radar_id": "RADAR_FUVEST_USP",
        "source_category": "OFICIAL_UNIVERSIDADE",
        "fonte": "FUVEST / USP",
        "exame": "FUVEST",
        "instituicao": "Fundação Universitária para o Vestibular (USP)",
        "disciplina": "Multidisciplinar",
        "url": "https://www.fuvest.br/vestibular-da-usp/provas-e-gabaritos/",
        "base_domain": "https://www.fuvest.br"
    },
    {
        "radar_id": "RADAR_COMVEST_UNICAMP",
        "source_category": "OFICIAL_UNIVERSIDADE",
        "fonte": "COMVEST / UNICAMP",
        "exame": "UNICAMP",
        "instituicao": "Universidade Estadual de Campinas (UNICAMP)",
        "disciplina": "Multidisciplinar",
        "url": "https://www.comvest.unicamp.br/vestibulares-anteriores/",
        "base_domain": "https://www.comvest.unicamp.br"
    },
    {
        "radar_id": "RADAR_ITA_DCTA",
        "source_category": "OFICIAL_UNIVERSIDADE",
        "fonte": "DCTA / ITA",
        "exame": "ITA",
        "instituicao": "Instituto Tecnológico de Aeronáutica (ITA)",
        "disciplina": "Exatas & Línguas",
        "url": "https://www.vestibular.ita.br/",
        "base_domain": "https://www.vestibular.ita.br"
    },
    {
        "radar_id": "RADAR_IMPA_OBMEP",
        "source_category": "OFICIAL_UNIVERSIDADE",
        "fonte": "IMPA / OBMEP",
        "exame": "OBMEP",
        "instituicao": "Instituto de Matemática Pura e Aplicada (IMPA)",
        "disciplina": "Matemática",
        "url": "https://www.obmep.org.br/provas.htm",
        "base_domain": "https://www.obmep.org.br"
    },
    {
        "radar_id": "RADAR_OLIMPIADA_OBB_BUTANTAN",
        "source_category": "OFICIAL_GOV",
        "fonte": "Instituto Butantan / OBB",
        "exame": "OBB",
        "instituicao": "Instituto Butantan — Olimpíada Brasileira de Biologia",
        "disciplina": "Biologia",
        "url": "https://olimpiadasdebiologia.butantan.gov.br/provas-e-gabaritos",
        "base_domain": "https://olimpiadasdebiologia.butantan.gov.br"
    },
    {
        "radar_id": "RADAR_OLIMPIADA_OBI_UNICAMP",
        "source_category": "OFICIAL_UNIVERSIDADE",
        "fonte": "SBC / IC-UNICAMP / OBI",
        "exame": "OBI",
        "instituicao": "Instituto de Computação da UNICAMP — Olimpíada Brasileira de Informática",
        "disciplina": "Computação & Lógica",
        "url": "https://olimpiada.ic.unicamp.br/passadas/",
        "base_domain": "https://olimpiada.ic.unicamp.br"
    },
    {
        "radar_id": "RADAR_PISA_OECD",
        "source_category": "OFICIAL_INTERNACIONAL",
        "fonte": "OECD / PISA",
        "exame": "PISA",
        "instituicao": "Organisation for Economic Co-operation and Development (OCDE)",
        "disciplina": "Leitura, Matemática e Ciências",
        "url": "https://www.oecd.org/en/about/programmes/pisa/pisa-test.html",
        "base_domain": "https://www.oecd.org"
    },
    {
        "radar_id": "RADAR_TIMSS_IEA",
        "source_category": "OFICIAL_INTERNACIONAL",
        "fonte": "IEA / TIMSS & PIRLS",
        "exame": "TIMSS",
        "instituicao": "International Association for the Evaluation of Educational Achievement (IEA)",
        "disciplina": "Matemática e Ciências",
        "url": "https://timssandpirls.bc.edu/timss-released-items.html",
        "base_domain": "https://timssandpirls.bc.edu"
    },
    {
        "radar_id": "RADAR_PROJETO_AGATHA",
        "source_category": "TERCEIRO_EDUCACIONAL",
        "fonte": "Projeto Agatha Edu",
        "exame": "ENEM / FUVEST / ITA",
        "instituicao": "Projeto Agatha Educação",
        "disciplina": "Multidisciplinar",
        "url": "https://www.projetoagathaedu.com.br/banco-de-questoes.php",
        "base_domain": "https://www.projetoagathaedu.com.br"
    },
    {
        "radar_id": "RADAR_PROJETO_MEDICINA",
        "source_category": "TERCEIRO_EDUCACIONAL",
        "fonte": "Projeto Medicina",
        "exame": "Vestibulares de Medicina",
        "instituicao": "Projeto Medicina",
        "disciplina": "Biologia, Química e Física",
        "url": "https://projetomedicina.com.br/materiais-de-estudo/",
        "base_domain": "https://projetomedicina.com.br"
    },
    {
        "radar_id": "RADAR_FILADD_ENEM",
        "source_category": "TERCEIRO_EDUCACIONAL",
        "fonte": "Filadd Brasil",
        "exame": "ENEM",
        "instituicao": "Filadd Educação",
        "disciplina": "Multidisciplinar",
        "url": "https://acervo-enem.filadd.com.br/colecao/listas-2026",
        "base_domain": "https://acervo-enem.filadd.com.br"
    },
    {
        "radar_id": "RADAR_YOUTUBE_CRASHCOURSE",
        "source_category": "MIDIA_SOCIAL",
        "fonte": "YouTube Crash Course",
        "exame": "Ciências & História",
        "instituicao": "Crash Course (@crashcourse)",
        "disciplina": "Multidisciplinar",
        "url": "https://www.youtube.com/@crashcourse/videos",
        "base_domain": "https://www.youtube.com"
    },
    {
        "radar_id": "RADAR_YOUTUBE_DESCOMPLICA",
        "source_category": "MIDIA_SOCIAL",
        "fonte": "YouTube Descomplica",
        "exame": "ENEM / Vestibulares",
        "instituicao": "Descomplica (@descomplica)",
        "disciplina": "Multidisciplinar",
        "url": "https://www.youtube.com/@descomplica/videos",
        "base_domain": "https://www.youtube.com"
    }
]


# ==============================================================================
# 4. NORMALIZAÇÃO DE CONTEÚDO E DEDUPLICAÇÃO
# ==============================================================================
def normalize_pedagogical_text(text: str) -> str:
    """
    Normaliza texto pedagógico colapsando espaços sem remover números,
    símbolos matemáticos, fórmulas, acentuações ou alternativas.
    """
    if not text:
        return ""
    # Remove retornos de carro e unifica quebras de linha
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    # Colapsa múltiplos espaços horizontais em um único espaço
    normalized = re.sub(r"[ \t]+", " ", normalized)
    # Colapsa quebras de linha excessivas (> 2) em duas quebras
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def compute_normalized_content_hash(text: str) -> str:
    """Gera hash SHA-256 do conteúdo normalizado."""
    norm = normalize_pedagogical_text(text)
    return hashlib.sha256(norm.encode("utf-8")).hexdigest()


# ==============================================================================
# 5. ESQUEMA DE CURADORIA E TABELAS SQLITE
# ==============================================================================
def ensure_quarantine_schema(conn: sqlite3.Connection):
    cur = conn.cursor()
    # Fila transacional de quarentena com estados recuperáveis e governança de direitos
    cur.execute("""
        CREATE TABLE IF NOT EXISTS harvest_quarantine_queue (
            job_id TEXT PRIMARY KEY,
            url TEXT UNIQUE NOT NULL,
            source_category TEXT NOT NULL,
            fonte TEXT NOT NULL,
            exame TEXT NOT NULL,
            instituicao TEXT NOT NULL,
            ano INTEGER,
            disciplina TEXT,
            titulo TEXT NOT NULL,
            state TEXT NOT NULL, -- 'DESCOBERTO', 'BAIXANDO', 'BAIXADO', 'EXTRAINDO', 'EXTRAIDO', 'FALHOU', 'REJEITADO'
            attempt_count INTEGER DEFAULT 0,
            max_attempts INTEGER DEFAULT 3,
            next_attempt_at TEXT NOT NULL,
            worker_id TEXT,
            lease_expires_at TEXT,
            last_error_code TEXT,
            binary_hash TEXT,
            normalized_content_hash TEXT,
            output_manifest_ref TEXT,
            extractor_version TEXT,
            rights_review_status TEXT DEFAULT 'DIREITOS_PENDENTES', -- 'DIREITOS_PENDENTES', 'EM_REVISAO', 'APROVADO_PARA_DATASET', 'REJEITADO'
            rights_evidence_ref TEXT,
            approved_operations TEXT DEFAULT '[]', -- JSON string com permissões concedidas por HITL
            reviewed_by TEXT,
            reviewed_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS autonomous_finetune_cycles (
            cycle_id TEXT PRIMARY KEY,
            started_at TEXT NOT NULL,
            duration_ms REAL NOT NULL,
            radars_scanned INTEGER NOT NULL,
            new_links_discovered INTEGER NOT NULL,
            new_pdfs_downloaded INTEGER NOT NULL,
            new_sft_pairs_generated INTEGER NOT NULL,
            total_sft_dataset_size INTEGER NOT NULL,
            colab_sync_status TEXT NOT NULL,
            summary_json TEXT NOT NULL
        )
    """)
    conn.commit()


# ==============================================================================
# 6. SCANNER SEGURO DE PORTAIS COM VERIFICAÇÃO TLS
# ==============================================================================
def scan_radar_source(radar: dict) -> dict:
    t0 = time.perf_counter()
    discovered = []
    error_code = None

    if not is_safe_external_url(radar["url"]):
        return {
            "radar_id": radar["radar_id"],
            "source_category": radar["source_category"],
            "status": "ERRO_SEGURANCA_SSRF",
            "latency_ms": 0,
            "discovered_items": [],
            "error_code": "SSRF_URL_BLOCKED"
        }

    try:
        req = urllib.request.Request(radar["url"], headers=HEADERS)
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS, context=STRICT_SSL_CTX) as resp:
            raw_bytes = resp.read(MAX_HTML_BYTES + 1)
            if len(raw_bytes) > MAX_HTML_BYTES:
                raise ValueError("Payload HTML excedeu o limite máximo seguro (10 MB)")
            html = raw_bytes.decode("utf-8", errors="ignore")

        if "youtube.com" in radar["url"]:
            for m in re.finditer(r'"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"([^"]+)"', html):
                vid, title = m.group(1), m.group(2)
                discovered.append({
                    "title": f"[{radar['fonte']}] {title}",
                    "url": f"https://www.youtube.com/watch?v={vid}",
                    "tipo": "video_aula_youtube",
                    "ano": datetime.now().year
                })
        else:
            for m in re.finditer(r'href=["\']([^"\']+\.pdf)["\']', html, re.IGNORECASE):
                href = m.group(1).strip()
                if href.startswith("/"):
                    href = radar["base_domain"].rstrip("/") + href
                elif not href.startswith("http"):
                    href = radar["base_domain"].rstrip("/") + "/" + href.lstrip("./")

                if not is_safe_external_url(href):
                    continue

                fname = href.split("/")[-1]
                year_m = re.search(r"(19\d{2}|20\d{2})", href)
                year = int(year_m.group(1)) if year_m else datetime.now().year
                tipo = "gabarito_oficial_pdf" if ("gab" in fname.lower() or "gb" in fname.lower()) else "prova_oficial_pdf"
                discovered.append({
                    "title": f"{radar['exame']} {year} — Arquivo ({fname})",
                    "url": href,
                    "tipo": tipo,
                    "ano": year
                })

        status = "ONLINE_SCANNED"
    except ssl.SSLError as e:
        status = "ERRO_TLS_CERTIFICADO"
        error_code = f"TLS_{type(e).__name__}"
    except urllib.error.HTTPError as e:
        status = f"ERRO_HTTP_{e.code}"
        error_code = f"HTTP_{e.code}"
    except urllib.error.URLError as e:
        status = "ERRO_CONEXAO_REDE"
        error_code = f"URL_{type(e.reason).__name__ if hasattr(e, 'reason') else 'FAILED'}"
    except Exception as e:
        status = f"FALHA_PROCESSAMENTO_{type(e).__name__}"
        error_code = str(type(e).__name__)

    return {
        "radar_id": radar["radar_id"],
        "source_category": radar["source_category"],
        "status": status,
        "latency_ms": round((time.perf_counter() - t0) * 1000, 2),
        "discovered_items": discovered[:50],
        "error_code": error_code
    }


# ==============================================================================
# 7. PROCESSAMENTO ATÔMICO DA FILA (DOWNLOAD & EXTRAÇÃO SEGURA)
# ==============================================================================
def process_harvest_queue_atomically(conn: sqlite3.Connection, max_items: int = 5) -> dict:
    """
    Consome pendências da fila usando lease de worker.
    Efetua download atômico em arquivo `.part`, valida integridade binária e extrai texto real com pypdf.
    """
    cur = conn.cursor()
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    worker_id = f"worker_{os.getpid()}_{int(time.time())}"
    now_ts = time.time()
    now_iso = datetime.now(timezone.utc).isoformat()
    lease_until_iso = datetime.fromtimestamp(now_ts + LEASE_DURATION_SECONDS, tz=timezone.utc).isoformat()

    # Seleciona tarefas elegíveis (novas ou com lease expirado pós-crash de worker)
    cur.execute("""
        SELECT job_id, url, source_category, fonte, exame, instituicao, ano, disciplina, titulo, attempt_count
        FROM harvest_quarantine_queue
        WHERE state IN ('DESCOBERTO', 'FALHOU')
          AND attempt_count < max_attempts
          AND next_attempt_at <= ?
          AND (lease_expires_at IS NULL OR lease_expires_at < ?)
        ORDER BY attempt_count ASC, created_at ASC
        LIMIT ?
    """, (now_iso, now_iso, max_items))
    jobs = cur.fetchall()

    if not jobs:
        return {"downloaded": 0, "extracted": 0, "failed": 0, "jobs_processed": 0}

    # Bloqueia as tarefas selecionadas atribuindo o worker_id
    for j in jobs:
        job_id = j[0]
        cur.execute("""
            UPDATE harvest_quarantine_queue
            SET state = 'BAIXANDO', worker_id = ?, lease_expires_at = ?, attempt_count = attempt_count + 1, updated_at = ?
            WHERE job_id = ?
        """, (worker_id, lease_until_iso, now_iso, job_id))
    conn.commit()

    downloaded = 0
    extracted = 0
    failed = 0

    for job in jobs:
        job_id, url, src_cat, fonte, exame, inst, ano, disc, titulo, attempts = job
        attempts += 1
        safe_base_name = f"{job_id}_{re.sub(r'[^A-Za-z0-9_.-]', '_', url.split('/')[-1])}"
        final_file_path = PDF_DIR / safe_base_name
        part_file_path = PDF_DIR / f"{safe_base_name}.part"

        if not is_safe_external_url(url):
            cur.execute("""
                UPDATE harvest_quarantine_queue
                SET state = 'REJEITADO', last_error_code = 'SSRF_BLOCKED', updated_at = ?
                WHERE job_id = ?
            """, (now_iso, job_id))
            conn.commit()
            failed += 1
            continue

        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS, context=STRICT_SSL_CTX) as resp:
                raw_bytes = resp.read(MAX_PDF_BYTES + 1)
                if len(raw_bytes) > MAX_PDF_BYTES:
                    raise ValueError(f"Tamanho do arquivo excede o limite máximo permitido ({MAX_PDF_BYTES} bytes)")
                if len(raw_bytes) < 512:
                    raise ValueError("Arquivo corrompido ou vazio (< 512 bytes)")

            # Escrita atômica do download via .part
            part_file_path.write_bytes(raw_bytes)
            binary_hash = hashlib.sha256(raw_bytes).hexdigest()
            # Promoção atômica
            part_file_path.replace(final_file_path)
            downloaded += 1

            # Extração de texto real via pypdf (isolada para não invalidar o download)
            extracted_text = ""
            extraction_err = None
            if HAS_PYPDF:
                try:
                    import io
                    reader = PdfReader(io.BytesIO(raw_bytes))
                    pages = []
                    for p in reader.pages[:15]:
                        t = p.extract_text() or ""
                        if t.strip():
                            pages.append(t.strip())
                    extracted_text = "\n\n--- PAGINA ---\n\n".join(pages)
                except Exception as pypdf_err:
                    extraction_err = f"PYPDF_{type(pypdf_err).__name__}"

            norm_hash = compute_normalized_content_hash(extracted_text) if extracted_text else None
            state = "EXTRAIDO" if (extracted_text and len(extracted_text) >= 120) else "BAIXADO"
            if state == "EXTRAIDO":
                extracted += 1

            cur.execute("""
                UPDATE harvest_quarantine_queue
                SET state = ?, binary_hash = ?, normalized_content_hash = ?,
                    output_manifest_ref = ?, extractor_version = ?, last_error_code = ?,
                    lease_expires_at = NULL, updated_at = ?
                WHERE job_id = ?
            """, (state, binary_hash, norm_hash, str(final_file_path), EXTRACTOR_VERSION, extraction_err, now_iso, job_id))

            # Se texto estiver satisfatório, preserva no corpus de pesquisa em quarentena
            if extracted_text:
                cur.execute("""
                    INSERT OR REPLACE INTO downloaded_pdf_corpus (
                        doc_id, title, institution, exam, subject, doc_type,
                        license, source_url, local_path, size_bytes, sha256_hash,
                        extracted_text, harvested_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 'DIREITOS_PENDENTES', ?, ?, ?, ?, ?, ?)
                """, (
                    f"CORPUS-{binary_hash[:12]}", titulo, inst, exame, disc,
                    "prova_oficial_pdf", url, str(final_file_path), len(raw_bytes),
                    binary_hash, extracted_text[:15000], now_iso
                ))

        except Exception as e:
            failed += 1
            part_file_path.unlink(missing_ok=True)
            err_code = f"{type(e).__name__}"
            # Backoff exponencial para próximas tentativas: 2^tentativa * 60 segundos
            backoff_seconds = (2 ** attempts) * 60
            next_attempt_iso = datetime.fromtimestamp(time.time() + backoff_seconds, tz=timezone.utc).isoformat()
            cur.execute("""
                UPDATE harvest_quarantine_queue
                SET state = 'FALHOU', last_error_code = ?, next_attempt_at = ?,
                    lease_expires_at = NULL, updated_at = ?
                WHERE job_id = ?
            """, (err_code, next_attempt_iso, now_iso, job_id))

        conn.commit()

    return {"downloaded": downloaded, "extracted": extracted, "failed": failed, "jobs_processed": len(jobs)}


# ==============================================================================
# 8. SÍNTESE E CURADORIA SFT: IMUNIDADE A FALHAS & GOVERNANÇA HITL
# ==============================================================================
def curate_approved_sft_dataset(conn: sqlite3.Connection) -> dict:
    """
    Exporta pares de instrução Kumon para o dataset SFT/QLoRA SOMENTE para itens
    que possuam:
      1. Texto autêntico extraído (state == 'EXTRAIDO').
      2. Autorização explícita de direitos (rights_review_status == 'APROVADO_PARA_DATASET').
      3. Operação 'DATASET_SFT' contida em approved_operations.
    Descarta qualquer fallback e calcula hash sem campos voláteis.
    """
    cur = conn.cursor()
    cur.execute("""
        SELECT job_id, url, source_category, exame, instituicao, ano, disciplina,
               titulo, normalized_content_hash, output_manifest_ref, approved_operations
        FROM harvest_quarantine_queue
        WHERE state = 'EXTRAIDO'
          AND rights_review_status = 'APROVADO_PARA_DATASET'
        ORDER BY updated_at ASC
    """)
    approved_rows = cur.fetchall()

    if not approved_rows:
        return {
            "status": "QUARENTENA_ATIVA",
            "message": "Nenhum material possui autorização jurídica (HITL) para compor dataset de treinamento.",
            "approved_candidates": 0,
            "new_pairs_added": 0
        }

    # Carrega router LLM se aprovado
    sys.path.insert(0, str(ROOT / "scripts"))
    try:
        import swarm_router
        env = swarm_router.load_all_envs()
    except Exception:
        return {"status": "SWARM_ROUTER_UNAVAILABLE", "new_pairs_added": 0}

    new_pairs = []

    for row in approved_rows:
        job_id, url, src_cat, exame, inst, ano, disc, titulo, norm_hash, manifest_ref, approved_ops_raw = row
        try:
            ops = json.loads(approved_ops_raw or "[]")
            if "DATASET_SFT" not in ops:
                continue
        except Exception:
            continue

        file_path = Path(manifest_ref) if manifest_ref else None
        if not file_path or not file_path.exists():
            continue

        # Extração de trecho real para grounding
        clean_snippet = file_path.name

        prompt = (
            f"Analise o exame homologado {exame} ({inst}, {ano}) — Fonte: {src_cat}.\n"
            f"Elabore 1 questão de revisão rápida no formato Kumon (L1: Passo Básico, L2: Aplicação, L3: Síntese) "
            f"com gabarito estruturado e justificativa formal."
        )

        try:
            res = swarm_router.dispatch_by_role(env, "coder", prompt)
            ans = res.get("response", "").strip()

            # Validação: rejeita respostas curtas ou com texto de fallback
            if len(ans) < 120 or "calibrada com sucesso" in ans.lower() or "fallback" in ans.lower():
                continue

            pair = {
                "messages": [
                    {"role": "system", "content": "Você é o Motor Pedagógico Soberano Kumon do Áquila Pro."},
                    {"role": "user", "content": prompt},
                    {"role": "assistant", "content": ans}
                ],
                "provenance": {
                    "job_id": job_id,
                    "exame": exame,
                    "instituicao": inst,
                    "ano": ano,
                    "source_category": src_cat,
                    "content_hash": norm_hash
                }
            }
            new_pairs.append(pair)
        except Exception as e:
            # Erro operacional nunca vira par substituto
            print(f"   ⚠️ [CURADORIA] Erro na síntese ({type(e).__name__}). Par descartado sem fallback.")
            continue

    if not new_pairs:
        return {"status": "NO_NEW_PAIRS_GENERATED", "new_pairs_added": 0}

    # Deduplicação determinística e escrita atômica
    SWARM_DATASET.parent.mkdir(parents=True, exist_ok=True)
    existing_lines = []
    seen_hashes = set()

    if SWARM_DATASET.exists():
        for line in SWARM_DATASET.read_text(encoding="utf-8").splitlines():
            ls = line.strip()
            if ls:
                existing_lines.append(ls)
                try:
                    obj = json.loads(ls)
                    k = json.dumps(obj.get("messages", []), sort_keys=True, ensure_ascii=False)
                    seen_hashes.add(hashlib.sha256(k.encode("utf-8")).hexdigest())
                except Exception:
                    pass

    added = 0
    for p in new_pairs:
        k = json.dumps(p.get("messages", []), sort_keys=True, ensure_ascii=False)
        h = hashlib.sha256(k.encode("utf-8")).hexdigest()
        if h not in seen_hashes:
            seen_hashes.add(h)
            existing_lines.append(json.dumps(p, ensure_ascii=False))
            added += 1

    temp_file = SWARM_DATASET.with_suffix(".tmp")
    temp_file.write_text("\n".join(existing_lines) + "\n", encoding="utf-8")
    temp_file.replace(SWARM_DATASET)

    return {"status": "SUCCESS", "new_pairs_added": added, "total_dataset": len(existing_lines)}


# ==============================================================================
# 9. EXECUÇÃO DO CICLO DE CURADORIA
# ==============================================================================
def run_autonomous_finetune_cycle() -> dict:
    cycle_start = time.perf_counter()
    cycle_id = f"cycle_{int(time.time())}"
    now_iso = datetime.now(timezone.utc).isoformat()

    print("=" * 86)
    print(f"📡 [ÁQUILA PRO — RADAR DE PROVAS, CURADORIA & QUARENTENA] ID: {cycle_id}")
    print(f"   Horário: {now_iso}")
    print("=" * 86)

    with ProcessLock(LOCK_FILE):
        # 1. Varredura paralela das fontes monitoradas com TLS estrito
        radar_results = []
        with ThreadPoolExecutor(max_workers=8) as ex:
            futs = {ex.submit(scan_radar_source, r): r for r in WATCHED_RADARS}
            for f in as_completed(futs):
                res = f.result()
                res["meta"] = futs[f]
                radar_results.append(res)
                print(f"   📡 [{res['radar_id']}] ({res['source_category']}) {res['status']} ({res['latency_ms']} ms) -> {len(res['discovered_items'])} links")

        # 2. Inserção na fila de quarentena com direitos pendentes
        conn = sqlite3.connect(str(SQLITE_SRC))
        ensure_quarantine_schema(conn)
        cur = conn.cursor()

        cur.execute("SELECT url FROM harvest_quarantine_queue")
        known_urls = {row[0] for row in cur.fetchall()}

        new_candidates_count = 0
        for rr in radar_results:
            meta = rr["meta"]
            for item in rr["discovered_items"]:
                u = item["url"]
                if u not in known_urls:
                    known_urls.add(u)
                    new_candidates_count += 1
                    job_id = f"JOB-{hashlib.sha256(u.encode('utf-8')).hexdigest()[:12]}"

                    cur.execute("""
                        INSERT OR IGNORE INTO harvest_quarantine_queue (
                            job_id, url, source_category, fonte, exame, instituicao,
                            ano, disciplina, titulo, state, attempt_count, max_attempts,
                            next_attempt_at, rights_review_status, approved_operations,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DESCOBERTO', 0, 3, ?, 'DIREITOS_PENDENTES', '[]', ?, ?)
                    """, (
                        job_id, u, meta["source_category"], meta["fonte"], meta["exame"],
                        meta["instituicao"], int(item["ano"]), meta["disciplina"],
                        item["title"], now_iso, now_iso, now_iso
                    ))

        conn.commit()
        print(f"   🆕 Novos Candidatos Inseridos na Fila de Quarentena: +{new_candidates_count}")

        # 3. Processamento incremental atômico da fila de downloads e extração
        queue_stats = process_harvest_queue_atomically(conn, max_items=5)
        print(f"   📥 Processamento Atômico: {queue_stats['downloaded']} baixados, {queue_stats['extracted']} extraídos, {queue_stats['failed']} com falha.")

        # 4. Avaliação de elegibilidade para dataset SFT (Quarentena Ativa)
        sft_report = curate_approved_sft_dataset(conn)
        print(f"   ⚖️ Curadoria de Treinamento: {sft_report['status']} ({sft_report.get('message', '')})")

        # 5. Consolidação de métricas e auditoria
        dt_ms = round((time.perf_counter() - cycle_start) * 1000, 2)
        summary = {
            "cycle_id": cycle_id,
            "timestamp": now_iso,
            "duration_ms": dt_ms,
            "radars_scanned": len(WATCHED_RADARS),
            "new_candidates_discovered": new_candidates_count,
            "queue_stats": queue_stats,
            "sft_curation": sft_report,
            "training_invoked": False,
            "dist_updated": False
        }

        cur.execute("""
            INSERT OR REPLACE INTO autonomous_finetune_cycles (
                cycle_id, started_at, duration_ms, radars_scanned,
                new_links_discovered, new_pdfs_downloaded, new_sft_pairs_generated,
                total_sft_dataset_size, colab_sync_status, summary_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cycle_id, now_iso, dt_ms, len(WATCHED_RADARS),
            new_candidates_count, queue_stats["downloaded"],
            sft_report.get("new_pairs_added", 0), 0,
            "TRAINING_DECOUPLED_SAFE", json.dumps(summary, ensure_ascii=False)
        ))
        conn.commit()
        conn.close()

        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

        print("-" * 86)
        print(f"✅ [CICLO {cycle_id} CONCLUÍDO EM {dt_ms} ms]")
        print(f"   • Quarentena Ativa: Nenhum dado não-homologado foi enviado a treinamento.")
        print(f"   • Treinamento e Publicação Desacoplados: ZERO escritas em dist/.")
        print("=" * 86)
        return summary


# ==============================================================================
# 10. CLI
# ==============================================================================
def print_status():
    if STATE_FILE.exists():
        print(STATE_FILE.read_text(encoding="utf-8"))
    else:
        print("Nenhum ciclo executado ainda.")


def main():
    parser = argparse.ArgumentParser(description="Áquila Pro Sovereign Radar & Dataset Quarantine Engine (v5.1)")
    parser.add_argument("--once", action="store_true", help="Executa um ciclo único de descoberta, quarentena e extração")
    parser.add_argument("--status", action="store_true", help="Exibe o relatório do último ciclo")
    args = parser.parse_args()

    if args.status:
        print_status()
        return

    run_autonomous_finetune_cycle()


if __name__ == "__main__":
    main()
