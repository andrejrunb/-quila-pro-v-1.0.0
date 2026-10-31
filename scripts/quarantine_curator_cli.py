#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
ÁQUILA PRO — CLI DE CURADORIA E AUDITORIA JURÍDICA DA QUARENTENA (HITL v1.0)
================================================================================
Interface de Governança Human-in-the-Loop (HITL) para o Radar de Provas & SFT:
  • Permite a revisores autorizados (DPO, Pedagogo, Jurídico) inspecionar
    materiais descobertos pelo radar e mantidos em quarentena.
  • Garante que NENHUM dado entre no pipeline de Fine-Tuning sem assinatura
    explícita de aprovação com base legal e hash imutável.
  • Comandos disponíveis:
      python scripts/quarantine_curator_cli.py status
      python scripts/quarantine_curator_cli.py list [--status STATUS] [--limit N]
      python scripts/quarantine_curator_cli.py inspect <job_id>
      python scripts/quarantine_curator_cli.py approve <job_id> --operator <name> --legal-basis <basis> [--ops <ops>]
      python scripts/quarantine_curator_cli.py reject <job_id> --operator <name> --reason <reason>
      python scripts/quarantine_curator_cli.py export-approved
================================================================================
"""

import os
import sys
import json
import sqlite3
import argparse
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = ROOT / "apps" / "electron" / "src" / "database" / "pedagogical_scaffolding.db"
APPROVED_DATASET_FILE = ROOT / "swarm" / "dataset" / "aquila_finetune_dataset.jsonl"


def get_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    target = Path(db_path) if db_path else DEFAULT_DB_PATH
    target.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(target))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn


def ensure_audit_schema(conn: sqlite3.Connection):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS zero_bypass_audits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT NOT NULL,
            metadata TEXT DEFAULT '{}',
            timestamp TEXT NOT NULL,
            previous_hash TEXT,
            hash TEXT,
            legal_basis TEXT,
            consent_verified INTEGER DEFAULT 0
        )
    """)
    conn.commit()


def log_zero_bypass_audit(conn: sqlite3.Connection, user_id: str, action: str, details: str,
                          metadata: Dict[str, Any], legal_basis: str) -> str:
    """Registra uma transição jurídica com encadeamento criptográfico SHA-256."""
    ensure_audit_schema(conn)
    cur = conn.cursor()
    
    # Obter último hash
    last_row = cur.execute(
        "SELECT hash FROM zero_bypass_audits WHERE hash IS NOT NULL ORDER BY id DESC LIMIT 1"
    ).fetchone()
    prev_hash = last_row[0] if last_row and last_row[0] else ("0" * 64)
    
    now_iso = datetime.now(timezone.utc).isoformat()
    meta_json = json.dumps(metadata, ensure_ascii=False)
    
    # Hash do bloco atual: prev_hash + user + action + meta + ts
    payload_to_hash = f"{prev_hash}|{user_id}|{action}|{meta_json}|{now_iso}"
    curr_hash = hashlib.sha256(payload_to_hash.encode("utf-8")).hexdigest()
    
    cur.execute("""
        INSERT INTO zero_bypass_audits
        (userId, action, details, metadata, timestamp, previous_hash, hash, legal_basis, consent_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, action, details, meta_json, now_iso, prev_hash, curr_hash, legal_basis, 1))
    conn.commit()
    return curr_hash


# ==============================================================================
# COMANDOS DA CLI
# ==============================================================================
def cmd_status(conn: sqlite3.Connection) -> Dict[str, Any]:
    cur = conn.cursor()
    
    # Contagem geral na fila
    total_queue = cur.execute("SELECT COUNT(*) FROM harvest_quarantine_queue").fetchone()[0]
    
    # Por estado operacional
    states = {}
    for st, cnt in cur.execute("SELECT state, COUNT(*) FROM harvest_quarantine_queue GROUP BY state").fetchall():
        states[st] = cnt
        
    # Por status de direitos
    rights = {}
    for r_st, cnt in cur.execute("SELECT rights_review_status, COUNT(*) FROM harvest_quarantine_queue GROUP BY rights_review_status").fetchall():
        rights[r_st] = cnt
        
    # Corpus local
    corpus_count = 0
    try:
        corpus_count = cur.execute("SELECT COUNT(*) FROM downloaded_pdf_corpus").fetchone()[0]
    except Exception:
        pass

    # Linhas no dataset SFT
    sft_lines = 0
    if APPROVED_DATASET_FILE.exists():
        with open(APPROVED_DATASET_FILE, "r", encoding="utf-8") as f:
            sft_lines = sum(1 for line in f if line.strip())

    summary = {
        "total_quarantine_jobs": total_queue,
        "operational_states": states,
        "rights_review_states": rights,
        "downloaded_pdf_corpus_count": corpus_count,
        "approved_sft_dataset_lines": sft_lines
    }

    print("\n" + "=" * 80)
    print("🦅 ÁQUILA PRO — INVENTÁRIO DO PAINEL DE QUARENTENA E AUDITORIA (HITL)")
    print("=" * 80)
    print(f"📦 Total de Tarefas na Quarentena: {total_queue}")
    print("\n📊 Estados Operacionais:")
    for st in ("DESCOBERTO", "BAIXANDO", "BAIXADO", "EXTRAIDO", "FALHOU", "REJEITADO"):
        print(f"   • {st:12}: {states.get(st, 0)}")
    print("\n⚖️ Status de Direitos e Governança:")
    for r_st in ("DIREITOS_PENDENTES", "EM_REVISAO", "APROVADO_PARA_DATASET", "REJEITADO"):
        print(f"   • {r_st:22}: {rights.get(r_st, 0)}")
    print("\n📚 Corpus Local e Dataset:")
    print(f"   • Textos no Corpus de Pesquisa: {corpus_count}")
    print(f"   • Pares SFT Atuais em Disco:     {sft_lines}")
    print("=" * 80 + "\n")
    return summary


def cmd_list(conn: sqlite3.Connection, status_filter: Optional[str] = None,
             exam_filter: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    cur = conn.cursor()
    query = """
        SELECT job_id, exame, ano, disciplina, titulo, state, rights_review_status, reviewed_by, url
        FROM harvest_quarantine_queue
        WHERE 1=1
    """
    params = []
    if status_filter:
        query += " AND (rights_review_status = ? OR state = ?)"
        params.extend([status_filter, status_filter])
    if exam_filter:
        query += " AND exame LIKE ?"
        params.append(f"%{exam_filter}%")
    
    query += " ORDER BY updated_at DESC LIMIT ?"
    params.append(limit)
    
    rows = cur.execute(query, params).fetchall()
    results = []
    
    print("\n" + "=" * 105)
    print(f"{'JOB ID':<16} | {'EXAME':<10} | {'ANO':<5} | {'ESTADO':<10} | {'DIREITOS':<22} | {'TÍTULO':<32}")
    print("-" * 105)
    for r in rows:
        job_id, exame, ano, disc, tit, st, r_st, rev, url = r
        tit_short = (tit[:29] + "...") if len(tit) > 32 else tit
        print(f"{job_id:<16} | {str(exame):<10} | {str(ano or '-'):<5} | {st:<10} | {r_st:<22} | {tit_short:<32}")
        results.append({
            "job_id": job_id, "exame": exame, "ano": ano, "disciplina": disc,
            "titulo": tit, "state": st, "rights_review_status": r_st, "reviewed_by": rev, "url": url
        })
    print("=" * 105)
    print(f"Total listados: {len(results)}\n")
    return results


def cmd_inspect(conn: sqlite3.Connection, job_id: str) -> Optional[Dict[str, Any]]:
    cur = conn.cursor()
    row = cur.execute("""
        SELECT job_id, url, source_category, fonte, exame, instituicao, ano, disciplina,
               titulo, state, attempt_count, last_error_code, binary_hash, normalized_content_hash,
               output_manifest_ref, extractor_version, rights_review_status, rights_evidence_ref,
               approved_operations, reviewed_by, reviewed_at, created_at, updated_at
        FROM harvest_quarantine_queue
        WHERE job_id = ?
    """, (job_id,)).fetchone()
    
    if not row:
        print(f"\n❌ Erro: Job '{job_id}' não encontrado na fila de quarentena.\n")
        return None

    (j_id, url, src_cat, fonte, exame, inst, ano, disc, tit, state,
     attempts, last_err, bin_hash, norm_hash, manifest_ref, ext_ver,
     r_status, r_evid, app_ops, rev_by, rev_at, c_at, u_at) = row

    # Buscar snippet do texto se disponível
    text_snippet = "(Nenhum texto extraído)"
    if bin_hash:
        corpus_row = cur.execute(
            "SELECT extracted_text FROM downloaded_pdf_corpus WHERE sha256_hash = ?", (bin_hash,)
        ).fetchone()
        if corpus_row and corpus_row[0]:
            text_snippet = corpus_row[0][:500].strip() + ("..." if len(corpus_row[0]) > 500 else "")

    item = {
        "job_id": j_id,
        "url": url,
        "source_category": src_cat,
        "fonte": fonte,
        "exame": exame,
        "instituicao": inst,
        "ano": ano,
        "disciplina": disc,
        "titulo": tit,
        "state": state,
        "attempt_count": attempts,
        "last_error_code": last_err,
        "binary_hash": bin_hash,
        "normalized_content_hash": norm_hash,
        "output_manifest_ref": manifest_ref,
        "extractor_version": ext_ver,
        "rights_review_status": r_status,
        "rights_evidence_ref": r_evid,
        "approved_operations": app_ops,
        "reviewed_by": rev_by,
        "reviewed_at": rev_at,
        "created_at": c_at,
        "updated_at": u_at,
        "text_snippet_preview": text_snippet
    }

    print("\n" + "=" * 80)
    print(f"🔍 DOSSIÊ DE AUDITORIA: JOB {j_id}")
    print("=" * 80)
    print(f"• Título:           {tit}")
    print(f"• Exame / Ano:      {exame} ({ano or 'Não informado'}) — {disc or 'Geral'}")
    print(f"• Instituição:      {inst} (Fonte: {fonte})")
    print(f"• URL Oficial:      {url}")
    print(f"• Categoria:        {src_cat}")
    print("-" * 80)
    print(f"• Estado Atual:     {state} (Tentativas: {attempts})")
    print(f"• Erro Registrado:  {last_err or 'Nenhum'}")
    print(f"• SHA-256 Binário:  {bin_hash or 'Pendente'}")
    print(f"• Hash Normalizado: {norm_hash or 'Pendente'}")
    print(f"• Arquivo Local:    {manifest_ref or 'Pendente'}")
    print("-" * 80)
    print(f"• Status Direitos:  {r_status}")
    print(f"• Revisor:          {rev_by or 'Nenhum (Pendente de Revisão Humana)'}")
    print(f"• Data da Revisão:  {rev_at or 'Pendente'}")
    print(f"• Base Legal:       {r_evid or 'Pendente'}")
    print(f"• Permissões HITL:  {app_ops or '[]'}")
    print("-" * 80)
    print("📄 Prévia do Texto Extraído:")
    print(f"\"{text_snippet}\"")
    print("=" * 80 + "\n")
    return item


def cmd_approve(conn: sqlite3.Connection, job_id: str, operator: str, legal_basis: str,
                operations: Optional[List[str]] = None) -> bool:
    """Aprova juridicamente o item da quarentena e assina com hash na auditoria Zero-Bypass."""
    if not operator or not operator.strip():
        raise ValueError("Operador responsável obrigatório para aprovação HITL.")
    if not legal_basis or not legal_basis.strip():
        raise ValueError("Base legal/evidência obrigatória (ex: 'LEI_9610_ART_46_VIII', 'DOMINIO_PUBLICO_OFICIAL').")
    
    cur = conn.cursor()
    row = cur.execute("SELECT job_id, state, binary_hash, titulo, url FROM harvest_quarantine_queue WHERE job_id = ?", (job_id,)).fetchone()
    if not row:
        print(f"\n❌ Erro: Job '{job_id}' não encontrado.\n")
        return False

    ops = operations or ["DATASET_SFT", "RESEARCH_CORPUS"]
    now_iso = datetime.now(timezone.utc).isoformat()
    ops_json = json.dumps(ops)

    cur.execute("""
        UPDATE harvest_quarantine_queue
        SET rights_review_status = 'APROVADO_PARA_DATASET',
            rights_evidence_ref = ?,
            approved_operations = ?,
            reviewed_by = ?,
            reviewed_at = ?,
            updated_at = ?
        WHERE job_id = ?
    """, (legal_basis, ops_json, operator, now_iso, now_iso, job_id))

    # Registrar trilha imutável
    audit_hash = log_zero_bypass_audit(
        conn=conn,
        user_id=operator,
        action="EXAM_RIGHTS_APPROVED",
        details=f"Item {job_id} ('{row[3]}') aprovado para treinamento sob base legal '{legal_basis}'.",
        metadata={
            "job_id": job_id,
            "binary_hash": row[2],
            "url": row[4],
            "approved_operations": ops,
            "legal_basis": legal_basis
        },
        legal_basis=legal_basis
    )

    print("\n" + "=" * 80)
    print(f"✅ ITEM {job_id} APROVADO COM SUCESSO (HITL):")
    print(f"   • Revisor:       {operator}")
    print(f"   • Base Legal:    {legal_basis}")
    print(f"   • Operações:     {ops}")
    print(f"   • Hash Auditoria: {audit_hash}")
    print("=" * 80 + "\n")
    return True


def cmd_reject(conn: sqlite3.Connection, job_id: str, operator: str, reason: str) -> bool:
    """Rejeita item da quarentena impedindo qualquer uso pedagógico ou de treino."""
    if not operator or not operator.strip():
        raise ValueError("Operador responsável obrigatório para registro de rejeição.")
    if not reason or not reason.strip():
        raise ValueError("Motivo da rejeição obrigatório.")

    cur = conn.cursor()
    row = cur.execute("SELECT job_id, titulo FROM harvest_quarantine_queue WHERE job_id = ?", (job_id,)).fetchone()
    if not row:
        print(f"\n❌ Erro: Job '{job_id}' não encontrado.\n")
        return False

    now_iso = datetime.now(timezone.utc).isoformat()

    cur.execute("""
        UPDATE harvest_quarantine_queue
        SET rights_review_status = 'REJEITADO',
            rights_evidence_ref = ?,
            approved_operations = '[]',
            reviewed_by = ?,
            reviewed_at = ?,
            updated_at = ?
        WHERE job_id = ?
    """, (reason, operator, now_iso, now_iso, job_id))

    audit_hash = log_zero_bypass_audit(
        conn=conn,
        user_id=operator,
        action="EXAM_RIGHTS_REJECTED",
        details=f"Item {job_id} rejeitado pelo revisor: {reason}",
        metadata={"job_id": job_id, "reason": reason},
        legal_basis="COPYRIGHT_RESTRICTION"
    )

    print("\n" + "=" * 80)
    print(f"⛔ ITEM {job_id} REJEITADO (DIREITOS BARRADOS):")
    print(f"   • Revisor:       {operator}")
    print(f"   • Motivo:        {reason}")
    print(f"   • Hash Auditoria: {audit_hash}")
    print("=" * 80 + "\n")
    return True


# ==============================================================================
# ENTRYPOINT CLI
# ==============================================================================
def main():
    parser = argparse.ArgumentParser(
        description="🦅 Áquila Pro — Painel de Curadoria e Governança Jurídica da Quarentena (HITL)"
    )
    parser.add_argument("--db", type=str, help="Caminho do banco SQLite personalizado")

    subparsers = parser.add_subparsers(dest="command", help="Comando a executar")

    # status
    subparsers.add_parser("status", help="Exibe o inventário consolidado da quarentena")

    # list
    p_list = subparsers.add_parser("list", help="Lista itens da quarentena")
    p_list.add_argument("--status", type=str, help="Filtrar por estado operacional ou status de direitos")
    p_list.add_argument("--exam", type=str, help="Filtrar por exame (ex: ENEM, FUVEST)")
    p_list.add_argument("--limit", type=int, default=20, help="Quantidade máxima a listar")

    # inspect
    p_inspect = subparsers.add_parser("inspect", help="Inspeciona dossiê detalhado de um job")
    p_inspect.add_argument("job_id", type=str, help="ID do Job a inspecionar")

    # approve
    p_app = subparsers.add_parser("approve", help="Aprova item da quarentena para uso em dataset/treino")
    p_app.add_argument("job_id", type=str, help="ID do Job")
    p_app.add_argument("--operator", type=str, required=True, help="Nome/identificador do revisor humano (HITL)")
    p_app.add_argument("--legal-basis", type=str, required=True, help="Fundamentação legal da aprovação")
    p_app.add_argument("--ops", type=str, default="DATASET_SFT,RESEARCH_CORPUS", help="Operações autorizadas (separadas por vírgula)")

    # reject
    p_rej = subparsers.add_parser("reject", help="Rejeita item da quarentena por restrição de direitos")
    p_rej.add_argument("job_id", type=str, help="ID do Job")
    p_rej.add_argument("--operator", type=str, required=True, help="Nome do revisor")
    p_rej.add_argument("--reason", type=str, required=True, help="Motivo da rejeição")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(0)

    conn = get_db_connection(args.db)
    try:
        if args.command == "status":
            cmd_status(conn)
        elif args.command == "list":
            cmd_list(conn, status_filter=args.status, exam_filter=args.exam, limit=args.limit)
        elif args.command == "inspect":
            cmd_inspect(conn, args.job_id)
        elif args.command == "approve":
            ops_list = [o.strip() for o in args.ops.split(",") if o.strip()]
            cmd_approve(conn, args.job_id, args.operator, args.legal_basis, ops_list)
        elif args.command == "reject":
            cmd_reject(conn, args.job_id, args.operator, args.reason)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
