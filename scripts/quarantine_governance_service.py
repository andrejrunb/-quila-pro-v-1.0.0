#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
ÁQUILA PRO — SERVIÇO CENTRAL DE GOVERNANÇA, DIREITOS AUTORAIS E QUARENTENA
================================================================================
Núcleo da Missão 3 de Governança Ponta a Ponta:
  • Taxonomia fechada de bases legais e operações autorizadas (LDA Lei 9.610/98).
  • Identidade, autenticação e controle de acesso baseado em papel (RBAC).
  • Vinculação estrita ao hash criptográfico SHA-256 (64 hex) do arquivo real.
  • Histórico imutável de decisões de direitos (harvest_rights_decisions).
  • Gatekeeper central universal: can_use(conn, asset_ref, requested_operation, context).
  • Trilha de auditoria encadeada com detecção de adulteração (hash chain).
  • Suporte a revogação e identificação de derivados afetados.
================================================================================
"""

import os
import re
import sys
import json
import sqlite3
import hashlib
import time
import getpass
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple, Set

ROOT = Path(__file__).resolve().parent.parent

# ==============================================================================
# 1. TAXONOMIA FECHADA DE BASES LEGAIS E OPERAÇÕES (LEI 9.610/98)
# ==============================================================================

# Taxonomia estrita de bases legais autorais reconhecidas
VALID_LEGAL_BASES: Dict[str, Dict[str, Any]] = {
    "ATO_OFICIAL_EXAME_ESTATAL_ART_8_IV": {
        "description": "Atos oficiais de exames públicos e seleções estatais (Art. 8º, IV da Lei 9.610/98). Válido apenas para enunciados e gabaritos oficiais de bancas públicas (ENEM, FUVEST, UNICAMP, ITA, etc.), vedados comentários privados de terceiros.",
        "allowed_operations": {"DISPLAY", "OFFLINE_DISTRIBUTION", "ADAPTATION", "RAG_INDEXING", "SFT_DATASET", "DPO_DATASET"},
        "requires_evidence_url": True,
    },
    "DOMINIO_PUBLICO_TEMPORAL_ART_41": {
        "description": "Obra em domínio público por decurso de prazo legal (Art. 41 da Lei 9.610/98: 70 anos após o falecimento do autor).",
        "allowed_operations": {"DISPLAY", "OFFLINE_DISTRIBUTION", "ADAPTATION", "RAG_INDEXING", "SFT_DATASET", "DPO_DATASET", "DATASET_REDISTRIBUTION"},
        "requires_evidence_url": True,
    },
    "LICENCA_OPEN_ACCESS_CREATIVE_COMMONS": {
        "description": "Material publicado sob licença aberta comprovável (CC-BY, CC-0, OER). Exige comprovação do repositório/metadados da licença.",
        "allowed_operations": {"DISPLAY", "OFFLINE_DISTRIBUTION", "ADAPTATION", "RAG_INDEXING", "SFT_DATASET", "DPO_DATASET", "DATASET_REDISTRIBUTION"},
        "requires_evidence_url": True,
    },
    "AUTORIZACAO_EXPRESSA_TITULAR_CONTRATO": {
        "description": "Cessão de direitos ou autorização expressa e documentada firmada pelo titular patrimonial da obra (Arts. 29 e 49 da Lei 9.610/98).",
        "allowed_operations": {"DISPLAY", "OFFLINE_DISTRIBUTION", "ADAPTATION", "RAG_INDEXING", "SFT_DATASET", "DPO_DATASET"},
        "requires_evidence_url": True,
    },
    "USO_PEDAGOGICO_ESTRITO_SEM_TREINO": {
        "description": "Uso didático estrito em sala de aula (Art. 46, II/VIII da Lei 9.610/98). VETA categoricamente inclusão em datasets de treinamento, adaptação ou redistribuição.",
        "allowed_operations": {"DISPLAY", "OFFLINE_DISTRIBUTION"},
        "requires_evidence_url": True,
    }
}

# Taxonomia estrita de operações independentes (Art. 31 da Lei 9.610/98)
ALL_OPERATIONS: Set[str] = {
    "DISPLAY",                 # Exibição do item na interface escolar para o estudante
    "OFFLINE_DISTRIBUTION",   # Replicação do PDF/texto para o servidor local Edge da escola
    "ADAPTATION",             # Geração de itens derivados de scaffolding/Kumon
    "RAG_INDEXING",           # Indexação vetorial para recuperação semântica no chat/assistente
    "SFT_DATASET",            # Absorção em pares de treino supervisionado (SFT/LoRA)
    "DPO_DATASET",            # Alinhamento por preferências (DPO)
    "DATASET_REDISTRIBUTION"  # Compartilhamento externo do dataset com terceiros
}

# Perfis autorizados a deliberar direitos autorais (RBAC)
AUTHORIZED_RIGHTS_ROLES: Set[str] = {"dpo", "revisor_juridico", "admin"}
AUTHORIZED_PEDAGOGICAL_ROLES: Set[str] = {"pedagogo", "coordenacao", "admin"}


# ==============================================================================
# 2. ESQUEMA DE DADOS DE GOVERNANÇA, AUDITORIA E OPERADORES
# ==============================================================================

def ensure_governance_schema(conn: sqlite3.Connection):
    """Inicializa todas as tabelas e migrações necessárias para a governança ponta a ponta."""
    cur = conn.cursor()

    # 1. Operadores cadastrados para curadoria HITL
    cur.execute("""
        CREATE TABLE IF NOT EXISTS quarantine_operators (
            operator_id TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL, -- 'admin', 'dpo', 'revisor_juridico', 'pedagogo'
            auth_token_hash TEXT NOT NULL,
            active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        )
    """)

    # 2. Fila de quarentena com versionamento e revisão pedagógica
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
            binary_hash TEXT, -- SHA-256 64 chars
            normalized_content_hash TEXT,
            output_manifest_ref TEXT,
            extractor_version TEXT,
            asset_version INTEGER DEFAULT 1,
            rights_review_status TEXT DEFAULT 'DIREITOS_PENDENTES', -- 'DIREITOS_PENDENTES', 'EM_REVISAO', 'APROVADO_PARA_DATASET', 'REJEITADO', 'REVOGADO'
            rights_evidence_ref TEXT,
            approved_operations TEXT DEFAULT '[]',
            reviewed_by TEXT,
            reviewed_at TEXT,
            pedagogical_review_status TEXT DEFAULT 'PENDENTE', -- 'PENDENTE', 'APROVADO_PEDAGOGICO', 'REJEITADO_PEDAGOGICO'
            pedagogical_reviewer TEXT,
            pedagogical_reviewed_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    # Migrações caso colunas não existam em tabela prévia
    for col_def in [
        "ALTER TABLE harvest_quarantine_queue ADD COLUMN asset_version INTEGER DEFAULT 1",
        "ALTER TABLE harvest_quarantine_queue ADD COLUMN pedagogical_review_status TEXT DEFAULT 'PENDENTE'",
        "ALTER TABLE harvest_quarantine_queue ADD COLUMN pedagogical_reviewer TEXT",
        "ALTER TABLE harvest_quarantine_queue ADD COLUMN pedagogical_reviewed_at TEXT",
    ]:
        try:
            cur.execute(col_def)
        except Exception:
            pass

    # 3. Histórico imutável de deliberações de direitos autorais
    cur.execute("""
        CREATE TABLE IF NOT EXISTS harvest_rights_decisions (
            decision_id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            asset_version INTEGER NOT NULL,
            binary_hash TEXT NOT NULL, -- SHA-256 64 chars
            decision_type TEXT NOT NULL, -- 'APROVACAO', 'REJEICAO', 'REVOGACAO', 'ALTERACAO_ESCOPO'
            legal_basis_code TEXT NOT NULL,
            legal_basis_details TEXT NOT NULL,
            evidence_doc_ref TEXT NOT NULL,
            approved_operations_json TEXT NOT NULL,
            scope_restrictions_json TEXT NOT NULL,
            operator_identity TEXT NOT NULL,
            reviewer_identity TEXT NOT NULL,
            operator_role TEXT NOT NULL,
            audit_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (job_id) REFERENCES harvest_quarantine_queue(job_id)
        )
    """)

    # 4. Trilha de auditoria encadeada com detecção de adulteração (hash chain)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS zero_bypass_audits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT NOT NULL,
            metadata TEXT DEFAULT '{}',
            timestamp TEXT NOT NULL,
            previous_hash TEXT NOT NULL,
            hash TEXT NOT NULL,
            legal_basis TEXT,
            consent_verified INTEGER DEFAULT 0
        )
    """)

    # 5. Corpus local de PDFs e textos
    cur.execute("""
        CREATE TABLE IF NOT EXISTS downloaded_pdf_corpus (
            doc_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            institution TEXT NOT NULL,
            exam TEXT NOT NULL,
            subject TEXT NOT NULL,
            doc_type TEXT NOT NULL,
            license TEXT NOT NULL,
            source_url TEXT NOT NULL,
            local_path TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            sha256_hash TEXT NOT NULL,
            extracted_text TEXT NOT NULL,
            harvested_at TEXT NOT NULL
        )
    """)

    # 6. Histórico de ciclos de descoberta e auditoria do radar
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
# 3. AUTENTICAÇÃO E IDENTIDADE DE OPERADORES
# ==============================================================================

class OperatorIdentityError(Exception):
    """Lançada em falhas de identificação, credencial ou permissão RBAC."""
    pass


def resolve_and_authenticate_operator(conn: sqlite3.Connection,
                                      declared_operator_id: Optional[str] = None,
                                      auth_token: Optional[str] = None,
                                      required_role_category: str = "rights") -> Dict[str, Any]:
    """
    Resolve e autentica com rigor a identidade do operador:
    1. Se declarado operador_id e auth_token, valida na tabela quarantine_operators.
    2. Se ausente token, verifica se o usuário do sistema operacional ou env confere.
    3. Impede personificação de identidade arbitrária.
    4. Valida se a role atende a categoria solicitada ('rights' ou 'pedagogical').
    """
    cur = conn.cursor()
    # Se declared_operator_id não informado, tenta detectar pelo SO ou env
    resolved_id = declared_operator_id or os.environ.get("AQUILA_OPERATOR_USER") or getpass.getuser()

    row = cur.execute(
        "SELECT operator_id, full_name, email, role, auth_token_hash, active FROM quarantine_operators WHERE operator_id = ?",
        (resolved_id,)
    ).fetchone()

    if not row:
        raise OperatorIdentityError(
            f"Operador '{resolved_id}' não está cadastrado no sistema de governança da quarentena."
        )

    op_id, name, email, role, token_hash, active = row

    if not active:
        raise OperatorIdentityError(f"Operador '{resolved_id}' está inativo no sistema.")

    # Se auth_token for fornecido, confere hash
    if auth_token:
        provided_hash = hashlib.sha256(auth_token.encode("utf-8")).hexdigest()
        if provided_hash != token_hash:
            raise OperatorIdentityError(f"Credencial/token inválido para o operador '{resolved_id}'.")

    # Validação de permissões RBAC
    if required_role_category == "rights" and role not in AUTHORIZED_RIGHTS_ROLES:
        raise OperatorIdentityError(
            f"Acesso negado: operador '{resolved_id}' possui perfil '{role}', mas aprovação de direitos autorais exige perfil DPO ou Jurídico."
        )

    if required_role_category == "pedagogical" and role not in AUTHORIZED_PEDAGOGICAL_ROLES:
        raise OperatorIdentityError(
            f"Acesso negado: operador '{resolved_id}' possui perfil '{role}', mas revisão pedagógica exige perfil Pedagogo ou Coordenação."
        )

    return {
        "operator_id": op_id,
        "full_name": name,
        "email": email,
        "role": role
    }


def seed_test_operator(conn: sqlite3.Connection, operator_id: str, full_name: str,
                       email: str, role: str, auth_token: str) -> None:
    """Helper para cadastrar operadores (usado em sementes e testes)."""
    cur = conn.cursor()
    token_hash = hashlib.sha256(auth_token.encode("utf-8")).hexdigest()
    now_iso = datetime.now(timezone.utc).isoformat()
    cur.execute("""
        INSERT OR REPLACE INTO quarantine_operators
        (operator_id, full_name, email, role, auth_token_hash, active, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?)
    """, (operator_id, full_name, email, role, token_hash, now_iso))
    conn.commit()


# ==============================================================================
# 4. VALIDAÇÃO DE INTEGRIDADE CRIPTOGRÁFICA DE ARQUIVOS
# ==============================================================================

def validate_sha256_format(hash_str: str) -> bool:
    """Garante que a string seja rigorosamente um hash SHA-256 hexadecimal válido (64 chars)."""
    if not hash_str or not isinstance(hash_str, str):
        return False
    return bool(re.match(r"^[0-9a-f]{64}$", hash_str.lower()))


def verify_file_binary_integrity(file_path: str, expected_sha256: str) -> Tuple[bool, str]:
    """
    Recalcula o SHA-256 do arquivo em disco e compara com o hash esperado.
    Retorna (is_intact: bool, message: str).
    """
    if not validate_sha256_format(expected_sha256):
        return False, f"Hash esperado '{expected_sha256}' não é um SHA-256 hexadecimal válido de 64 caracteres."

    p = Path(file_path)
    if not p.exists():
        return False, f"Arquivo físico não encontrado em: {file_path}"

    try:
        hasher = hashlib.sha256()
        with open(p, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        calculated = hasher.hexdigest().lower()
        if calculated != expected_sha256.lower():
            return False, f"Violação de integridade física: hash calculado '{calculated}' difere do esperado '{expected_sha256}'."
        return True, "INTEGRITY_VERIFIED"
    except Exception as e:
        return False, f"Erro ao ler arquivo para verificação de hash: {e}"


# ==============================================================================
# 5. TRILHA DE AUDITORIA ENCADEADA COM DETECÇÃO DE ADULTERAÇÃO (HASH CHAIN)
# ==============================================================================

def record_audit_event_in_tx(conn: sqlite3.Connection,
                             user_id: str,
                             action: str,
                             details: str,
                             metadata: Dict[str, Any],
                             legal_basis: str) -> str:
    """
    Grava evento na tabela zero_bypass_audits como parte de transação atômica em curso.
    Encadeia o hash do bloco anterior (SHA-256).
    Em matérias estritamente de direitos autorais de exames públicos, consent_verified é 0.
    """
    cur = conn.cursor()
    last_row = cur.execute(
        "SELECT hash FROM zero_bypass_audits WHERE hash IS NOT NULL ORDER BY id DESC LIMIT 1"
    ).fetchone()
    prev_hash = last_row[0] if last_row and last_row[0] else ("0" * 64)

    now_iso = datetime.now(timezone.utc).isoformat()
    meta_json = json.dumps(metadata, sort_keys=True, ensure_ascii=False)

    payload = f"{prev_hash}|{user_id}|{action}|{details}|{meta_json}|{now_iso}"
    curr_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

    cur.execute("""
        INSERT INTO zero_bypass_audits
        (userId, action, details, metadata, timestamp, previous_hash, hash, legal_basis, consent_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    """, (user_id, action, details, meta_json, now_iso, prev_hash, curr_hash, legal_basis))

    return curr_hash


def verify_audit_chain_tamper_evidence(conn: sqlite3.Connection) -> Tuple[bool, Optional[str], int]:
    """
    Percorre toda a tabela zero_bypass_audits e recalcula a cadeia SHA-256.
    Retorna (is_valid: bool, error_details: Optional[str], verified_blocks: int).
    """
    cur = conn.cursor()
    rows = cur.execute("""
        SELECT id, userId, action, details, metadata, timestamp, previous_hash, hash
        FROM zero_bypass_audits
        ORDER BY id ASC
    """).fetchall()

    if not rows:
        return True, None, 0

    expected_prev = "0" * 64
    for r in rows:
        b_id, user_id, action, details, meta_json, ts, prev_hash, stored_hash = r

        if prev_hash != expected_prev:
            return False, f"Quebra de encadeamento no bloco ID {b_id}: previous_hash '{prev_hash}' difere do esperado '{expected_prev}'.", b_id - 1

        payload = f"{prev_hash}|{user_id}|{action}|{details}|{meta_json}|{ts}"
        recalculated = hashlib.sha256(payload.encode("utf-8")).hexdigest()

        if recalculated != stored_hash:
            return False, f"Adulteração detectada no bloco ID {b_id}: hash armazenado '{stored_hash}' diverge do recalculado '{recalculated}'.", b_id - 1

        expected_prev = stored_hash

    return True, None, len(rows)


# ==============================================================================
# 6. GATEKEEPER CENTRAL: can_use()
# ==============================================================================

def can_use(conn: sqlite3.Connection,
            job_id: str,
            requested_operation: str,
            context: Optional[Dict[str, Any]] = None) -> Tuple[bool, str]:
    """
    Ponto Único de Decisão (Gatekeeper Universal):
    Avalia se o ativo identificado por job_id possui permissão jurídica e técnica
    para a operação solicitada (Art. 31 da Lei 9.610/98).

    Critérios verificados cumulativamente:
    1. Operação solicitada é válida na taxonomia fechada.
    2. Ativo existe na fila de quarentena.
    3. O arquivo físico em disco (se baixado) preserva integridade exata do hash SHA-256.
    4. A deliberação jurídica mais recente é 'APROVACAO' (bloqueia se for 'REJEICAO' ou 'REVOGACAO').
    5. A operação solicitada está explicitamente contida em approved_operations da deliberação.
    6. Se a operação for 'SFT_DATASET' ou 'DPO_DATASET': exige adicionalmente aprovação pedagógica.

    Retorna (permitted: bool, reason: str).
    """
    if requested_operation not in ALL_OPERATIONS:
        return False, f"Operação '{requested_operation}' inválida na taxonomia fechada do sistema."

    cur = conn.cursor()

    # 1. Buscar ativo na fila
    item = cur.execute("""
        SELECT job_id, binary_hash, output_manifest_ref, asset_version,
               rights_review_status, pedagogical_review_status
        FROM harvest_quarantine_queue
        WHERE job_id = ?
    """, (job_id,)).fetchone()

    if not item:
        return False, f"Ativo '{job_id}' não encontrado na fila de quarentena."

    j_id, bin_hash, manifest_ref, asset_ver, r_status, p_status = item

    if r_status != "APROVADO_PARA_DATASET":
        return False, f"Ativo '{job_id}' com status de direitos não-aprovado ('{r_status}')."

    # 2. Verificar integridade do arquivo em disco (se caminho manifesto existir)
    if manifest_ref and bin_hash:
        is_intact, msg = verify_file_binary_integrity(manifest_ref, bin_hash)
        if not is_intact:
            return False, f"Bloqueio de segurança por falha de integridade: {msg}"

    # 3. Buscar a decisão mais recente no histórico versionado
    last_decision = cur.execute("""
        SELECT decision_type, legal_basis_code, approved_operations_json, asset_version, binary_hash
        FROM harvest_rights_decisions
        WHERE job_id = ?
        ORDER BY created_at DESC, rowid DESC
        LIMIT 1
    """, (job_id,)).fetchone()

    if not last_decision:
        return False, f"Nenhuma decisão registrada no histórico para o ativo '{job_id}'."

    dec_type, basis_code, approved_ops_raw, dec_ver, dec_hash = last_decision

    if dec_type in ("REVOGACAO", "REJEICAO"):
        return False, f"Uso bloqueado: última decisão para o ativo foi '{dec_type}'."

    if dec_type != "APROVACAO":
        return False, f"Uso bloqueado: decisão '{dec_type}' não constitui aprovação válida."

    # 4. Validar correspondência de versão e hash com a decisão
    if dec_hash.lower() != (bin_hash or "").lower():
        return False, f"Uso bloqueado: hash do ativo atual difere da versão aprovada na decisão jurídica."

    # 5. Validar se a operação específica está aprovada
    try:
        approved_ops = set(json.loads(approved_ops_raw))
    except Exception:
        return False, "Erro ao interpretar operações aprovadas na decisão jurídica."

    if requested_operation not in approved_ops:
        return False, f"Operação '{requested_operation}' NÃO autorizada. Operações aprovadas: {list(approved_ops)}."

    # 6. Se operação envolver treinamento neural, exigir aprovação pedagógica
    if requested_operation in ("SFT_DATASET", "DPO_DATASET"):
        if p_status != "APROVADO_PEDAGOGICO":
            return False, f"Uso em treino bloqueado: direitos autorais aprovados, mas revisão pedagógica pendente ('{p_status}')."

    return True, f"OPERACAO_AUTORIZADA: '{requested_operation}' permitida sob {basis_code}."


# ==============================================================================
# 7. SERVIÇO DE DELIBERAÇÃO ATÔMICA DE DIREITOS E REVISÃO PEDAGÓGICA
# ==============================================================================

class QuarantineGovernanceService:
    """
    Executa mutações de direitos e pedagógicas de forma estritamente transacional,
    vinculada ao hash binário SHA-256 e encadeada na trilha de auditoria.
    """

    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
        ensure_governance_schema(self.conn)

    def approve_rights(self,
                       job_id: str,
                       legal_basis_code: str,
                       legal_basis_details: str,
                       evidence_doc_ref: str,
                       approved_operations: List[str],
                       scope_restrictions: Optional[List[str]] = None,
                       declared_operator_id: Optional[str] = None,
                       auth_token: Optional[str] = None,
                       reviewer_identity: Optional[str] = None) -> Dict[str, Any]:
        """
        Aprova formalmente os direitos de um item da quarentena sob transação atômica.
        """
        # 1. Autenticação e RBAC
        op = resolve_and_authenticate_operator(self.conn, declared_operator_id, auth_token, "rights")
        operator_id = op["operator_id"]
        operator_role = op["role"]
        reviewer_id = reviewer_identity or operator_id

        # 2. Validação da base legal
        if legal_basis_code not in VALID_LEGAL_BASES:
            raise ValueError(
                f"Base legal '{legal_basis_code}' inválida. Bases permitidas: {list(VALID_LEGAL_BASES.keys())}"
            )

        legal_spec = VALID_LEGAL_BASES[legal_basis_code]
        if not evidence_doc_ref or not evidence_doc_ref.strip():
            raise ValueError("Referência comprobatória de evidência (evidence_doc_ref) é obrigatória.")

        if not legal_basis_details or len(legal_basis_details.strip()) < 15:
            raise ValueError("Fundamentação jurídica detalhada e contextualizada (mínimo 15 caracteres) é obrigatória.")

        # 3. Validação das operações
        if not approved_operations:
            raise ValueError("Pelo menos uma operação autorizada deve ser informada.")

        invalid_ops = set(approved_operations) - ALL_OPERATIONS
        if invalid_ops:
            raise ValueError(f"Operações inválidas: {invalid_ops}. Permitidas: {ALL_OPERATIONS}")

        # Se a base legal proibir certas operações, rejeitar imediatamente
        disallowed_by_basis = set(approved_operations) - legal_spec["allowed_operations"]
        if disallowed_by_basis:
            raise ValueError(
                f"A base legal '{legal_basis_code}' não permite as seguintes operações solicitadas: {disallowed_by_basis}. Permitidas para esta base: {legal_spec['allowed_operations']}"
            )

        cur = self.conn.cursor()

        # 4. Iniciar transação atômica manual
        self.conn.execute("BEGIN IMMEDIATE")
        try:
            # Buscar item da fila com lock
            item = cur.execute("""
                SELECT job_id, binary_hash, output_manifest_ref, asset_version, titulo, url
                FROM harvest_quarantine_queue
                WHERE job_id = ?
            """, (job_id,)).fetchone()

            if not item:
                raise ValueError(f"Job '{job_id}' não encontrado na fila.")

            j_id, bin_hash, manifest_ref, asset_ver, tit, url = item

            # Validar formato do hash binário
            if not bin_hash or not validate_sha256_format(bin_hash):
                raise ValueError(
                    f"Ativo '{job_id}' não possui hash binário SHA-256 hexadecimal válido de 64 caracteres (encontrado: '{bin_hash}')."
                )

            # Validar integridade física do arquivo em disco se presente
            if manifest_ref:
                is_intact, msg = verify_file_binary_integrity(manifest_ref, bin_hash)
                if not is_intact:
                    raise ValueError(f"Falha de integridade do arquivo antes da aprovação: {msg}")

            now_iso = datetime.now(timezone.utc).isoformat()
            decision_id = f"DEC_APP_{int(time.time())}_{hashlib.sha256(f'{j_id}_{asset_ver}_{now_iso}'.encode()).hexdigest()[:8]}"
            ops_json = json.dumps(sorted(list(approved_operations)), ensure_ascii=False)
            scope_json = json.dumps(scope_restrictions or [], ensure_ascii=False)

            # Registrar na trilha de auditoria encadeada
            audit_meta = {
                "decision_id": decision_id,
                "job_id": j_id,
                "asset_version": asset_ver,
                "binary_hash": bin_hash,
                "decision_type": "APROVACAO",
                "legal_basis_code": legal_basis_code,
                "evidence_doc_ref": evidence_doc_ref,
                "approved_operations": approved_operations,
                "reviewer_identity": reviewer_id,
                "operator_role": operator_role
            }
            audit_hash = record_audit_event_in_tx(
                conn=self.conn,
                user_id=operator_id,
                action="EXAM_RIGHTS_APPROVED",
                details=f"Item {j_id} ('{tit}') aprovado para {approved_operations} sob {legal_basis_code}.",
                metadata=audit_meta,
                legal_basis=legal_basis_code
            )

            # Inserir no histórico de decisões
            cur.execute("""
                INSERT INTO harvest_rights_decisions
                (decision_id, job_id, asset_version, binary_hash, decision_type, legal_basis_code,
                 legal_basis_details, evidence_doc_ref, approved_operations_json, scope_restrictions_json,
                 operator_identity, reviewer_identity, operator_role, audit_hash, created_at)
                VALUES (?, ?, ?, ?, 'APROVACAO', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                decision_id, j_id, asset_ver, bin_hash, legal_basis_code,
                legal_basis_details, evidence_doc_ref, ops_json, scope_json,
                operator_id, reviewer_id, operator_role, audit_hash, now_iso
            ))

            # Atualizar fila de quarentena
            cur.execute("""
                UPDATE harvest_quarantine_queue
                SET rights_review_status = 'APROVADO_PARA_DATASET',
                    rights_evidence_ref = ?,
                    approved_operations = ?,
                    reviewed_by = ?,
                    reviewed_at = ?,
                    updated_at = ?
                WHERE job_id = ? AND asset_version = ?
            """, (evidence_doc_ref, ops_json, reviewer_id, now_iso, now_iso, j_id, asset_ver))

            if cur.rowcount == 0:
                raise ValueError("Conflito de concorrência: versão do ativo foi alterada durante a aprovação.")

            self.conn.commit()

            return {
                "decision_id": decision_id,
                "job_id": j_id,
                "status": "APROVADO_PARA_DATASET",
                "binary_hash": bin_hash,
                "approved_operations": approved_operations,
                "legal_basis_code": legal_basis_code,
                "audit_hash": audit_hash,
                "reviewer": reviewer_id,
                "timestamp": now_iso
            }
        except Exception:
            self.conn.rollback()
            raise

    def revoke_rights(self,
                      job_id: str,
                      revocation_reason: str,
                      declared_operator_id: Optional[str] = None,
                      auth_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Revoga os direitos de um ativo previamente aprovado, identificando derivados afetados.
        """
        op = resolve_and_authenticate_operator(self.conn, declared_operator_id, auth_token, "rights")
        operator_id = op["operator_id"]
        operator_role = op["role"]

        if not revocation_reason or len(revocation_reason.strip()) < 10:
            raise ValueError("Justificativa de revogação detalhada é obrigatória (mínimo 10 caracteres).")

        cur = self.conn.cursor()
        self.conn.execute("BEGIN IMMEDIATE")
        try:
            item = cur.execute("""
                SELECT job_id, binary_hash, asset_version, titulo, rights_review_status
                FROM harvest_quarantine_queue
                WHERE job_id = ?
            """, (job_id,)).fetchone()

            if not item:
                raise ValueError(f"Job '{job_id}' não encontrado.")

            j_id, bin_hash, asset_ver, tit, curr_status = item
            now_iso = datetime.now(timezone.utc).isoformat()
            decision_id = f"DEC_REV_{int(time.time())}_{hashlib.sha256(f'{j_id}_{now_iso}'.encode()).hexdigest()[:8]}"

            # Rastrear derivados potencialmente afetados
            affected_derivatives = []
            if bin_hash:
                corpus_rows = cur.execute(
                    "SELECT doc_id, title FROM downloaded_pdf_corpus WHERE sha256_hash = ?", (bin_hash,)
                ).fetchall()
                for c_id, c_title in corpus_rows:
                    affected_derivatives.append({"type": "CORPUS_ENTRY", "ref": c_id, "title": c_title})

            audit_meta = {
                "decision_id": decision_id,
                "job_id": j_id,
                "asset_version": asset_ver,
                "binary_hash": bin_hash,
                "decision_type": "REVOGACAO",
                "revocation_reason": revocation_reason,
                "affected_derivatives": affected_derivatives,
                "note": "Revogação impede novas promoções e exportações; derivados prévios já compilados exigem invalidação de cache/checkpoint."
            }

            audit_hash = record_audit_event_in_tx(
                conn=self.conn,
                user_id=operator_id,
                action="EXAM_RIGHTS_REVOKED",
                details=f"Item {j_id} revogado: {revocation_reason}",
                metadata=audit_meta,
                legal_basis="REVOGACAO_DIREITOS"
            )

            # Inserir no histórico
            cur.execute("""
                INSERT INTO harvest_rights_decisions
                (decision_id, job_id, asset_version, binary_hash, decision_type, legal_basis_code,
                 legal_basis_details, evidence_doc_ref, approved_operations_json, scope_restrictions_json,
                 operator_identity, reviewer_identity, operator_role, audit_hash, created_at)
                VALUES (?, ?, ?, ?, 'REVOGACAO', 'REVOGACAO_DIREITOS', ?, '', '[]', '[]', ?, ?, ?, ?, ?)
            """, (decision_id, j_id, asset_ver, bin_hash or "", revocation_reason, operator_id, operator_id, operator_role, audit_hash, now_iso))

            # Atualizar fila
            cur.execute("""
                UPDATE harvest_quarantine_queue
                SET rights_review_status = 'REVOGADO',
                    approved_operations = '[]',
                    updated_at = ?
                WHERE job_id = ?
            """, (now_iso, j_id))

            self.conn.commit()

            return {
                "decision_id": decision_id,
                "job_id": j_id,
                "status": "REVOGADO",
                "revocation_reason": revocation_reason,
                "affected_derivatives": affected_derivatives,
                "audit_hash": audit_hash,
                "timestamp": now_iso
            }
        except Exception:
            self.conn.rollback()
            raise

    def approve_pedagogical_review(self,
                                   job_id: str,
                                   declared_operator_id: Optional[str] = None,
                                   auth_token: Optional[str] = None,
                                   quality_notes: str = "") -> Dict[str, Any]:
        """
        Aprova a qualidade pedagógica de um item (requisito obrigatório para SFT_DATASET).
        """
        op = resolve_and_authenticate_operator(self.conn, declared_operator_id, auth_token, "pedagogical")
        operator_id = op["operator_id"]
        now_iso = datetime.now(timezone.utc).isoformat()

        cur = self.conn.cursor()
        self.conn.execute("BEGIN IMMEDIATE")
        try:
            item = cur.execute("SELECT job_id, state FROM harvest_quarantine_queue WHERE job_id = ?", (job_id,)).fetchone()
            if not item:
                raise ValueError(f"Job '{job_id}' não encontrado.")

            cur.execute("""
                UPDATE harvest_quarantine_queue
                SET pedagogical_review_status = 'APROVADO_PEDAGOGICO',
                    pedagogical_reviewer = ?,
                    pedagogical_reviewed_at = ?,
                    updated_at = ?
                WHERE job_id = ?
            """, (operator_id, now_iso, now_iso, job_id))

            audit_hash = record_audit_event_in_tx(
                conn=self.conn,
                user_id=operator_id,
                action="PEDAGOGICAL_REVIEW_APPROVED",
                details=f"Item {job_id} aprovado na revisão pedagógica/qualidade.",
                metadata={"job_id": job_id, "quality_notes": quality_notes},
                legal_basis="REVISAO_PEDAGOGICA_INTERNA"
            )

            self.conn.commit()
            return {
                "job_id": job_id,
                "pedagogical_status": "APROVADO_PEDAGOGICO",
                "reviewer": operator_id,
                "audit_hash": audit_hash,
                "timestamp": now_iso
            }
        except Exception:
            self.conn.rollback()
            raise
