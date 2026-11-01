#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
ÁQUILA PRO — CLI DE CURADORIA E GOVERNANÇA JURÍDICA DA QUARENTENA (HITL v2.0)
================================================================================
Interface de Governança Human-in-the-Loop (HITL) auditável e autenticada:
  • Permite a revisores autorizados (DPO, Pedagogo, Jurídico) deliberar sobre
    materiais mantidos em quarentena com autenticação RBAC estrita.
  • Vinculação rigorosa ao hash SHA-256 binário de 64 caracteres do arquivo real.
  • Base legal fechada e taxonomia de operações independentes (Lei 9.610/98).
  • Trilha encadeada com detecção de adulteração (zero_bypass_audits).
  • Gatekeeper central universal: can_use().
================================================================================
"""

import os
import sys
import json
import sqlite3
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from quarantine_governance_service import (
    ensure_governance_schema,
    resolve_and_authenticate_operator,
    seed_test_operator,
    validate_sha256_format,
    verify_file_binary_integrity,
    verify_audit_chain_tamper_evidence,
    can_use,
    QuarantineGovernanceService,
    VALID_LEGAL_BASES,
    ALL_OPERATIONS,
    OperatorIdentityError
)

DEFAULT_DB_PATH = ROOT / "apps" / "electron" / "src" / "database" / "pedagogical_scaffolding.db"
APPROVED_DATASET_FILE = ROOT / "swarm" / "dataset" / "aquila_finetune_dataset.jsonl"


def get_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    target = Path(db_path) if db_path else DEFAULT_DB_PATH
    target.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(target))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    ensure_governance_schema(conn)
    return conn


def cmd_status(conn: sqlite3.Connection) -> Dict[str, Any]:
    cur = conn.cursor()
    total_queue = cur.execute("SELECT COUNT(*) FROM harvest_quarantine_queue").fetchone()[0]

    states = {}
    for st, cnt in cur.execute("SELECT state, COUNT(*) FROM harvest_quarantine_queue GROUP BY state").fetchall():
        states[st] = cnt

    rights = {}
    for r_st, cnt in cur.execute("SELECT rights_review_status, COUNT(*) FROM harvest_quarantine_queue GROUP BY rights_review_status").fetchall():
        rights[r_st] = cnt

    pedagogical = {}
    for p_st, cnt in cur.execute("SELECT pedagogical_review_status, COUNT(*) FROM harvest_quarantine_queue GROUP BY pedagogical_review_status").fetchall():
        pedagogical[p_st] = cnt

    corpus_count = 0
    try:
        corpus_count = cur.execute("SELECT COUNT(*) FROM downloaded_pdf_corpus").fetchone()[0]
    except Exception:
        pass

    sft_lines = 0
    if APPROVED_DATASET_FILE.exists():
        with open(APPROVED_DATASET_FILE, "r", encoding="utf-8") as f:
            sft_lines = sum(1 for line in f if line.strip())

    # Verificação de integridade da trilha de auditoria
    chain_valid, chain_err, block_count = verify_audit_chain_tamper_evidence(conn)

    summary = {
        "total_quarantine_jobs": total_queue,
        "operational_states": states,
        "rights_review_states": rights,
        "pedagogical_review_states": pedagogical,
        "downloaded_pdf_corpus_count": corpus_count,
        "approved_sft_dataset_lines": sft_lines,
        "audit_chain_blocks": block_count,
        "audit_chain_integrity": "INTACT" if chain_valid else f"TAMPERED ({chain_err})"
    }

    print("\n" + "=" * 80)
    print("🦅 ÁQUILA PRO — INVENTÁRIO DO PAINEL DE QUARENTENA E AUDITORIA (HITL v2.0)")
    print("=" * 80)
    print(f"📦 Total de Tarefas na Quarentena: {total_queue}")
    print("\n📊 Estados Operacionais:")
    for st in ("DESCOBERTO", "BAIXANDO", "BAIXADO", "EXTRAIDO", "FALHOU", "REJEITADO"):
        print(f"   • {st:12}: {states.get(st, 0)}")
    print("\n⚖️ Status de Direitos e Governança:")
    for r_st in ("DIREITOS_PENDENTES", "EM_REVISAO", "APROVADO_PARA_DATASET", "REJEITADO", "REVOGADO"):
        print(f"   • {r_st:22}: {rights.get(r_st, 0)}")
    print("\n🎓 Status de Revisão Pedagógica/Qualidade:")
    for p_st in ("PENDENTE", "APROVADO_PEDAGOGICO", "REJEITADO_PEDAGOGICO"):
        print(f"   • {p_st:22}: {pedagogical.get(p_st, 0)}")
    print("\n📚 Corpus Local e Dataset:")
    print(f"   • Textos no Corpus de Pesquisa: {corpus_count}")
    print(f"   • Pares SFT Atuais em Disco:     {sft_lines}")
    print(f"   • Trilha de Auditoria (Blocos): {block_count} [{summary['audit_chain_integrity']}]")
    print("=" * 80 + "\n")
    return summary


def cmd_list(conn: sqlite3.Connection, status_filter: Optional[str] = None,
             exam_filter: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    cur = conn.cursor()
    query = """
        SELECT job_id, exame, ano, disciplina, titulo, state, rights_review_status,
               pedagogical_review_status, binary_hash
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

    print("\n" + "=" * 125)
    print(f"{'JOB ID':<18} | {'EXAME':<8} | {'ANO':<5} | {'ESTADO':<9} | {'DIREITOS':<18} | {'PEDAGOGIA':<16} | {'TÍTULO':<35}")
    print("-" * 125)
    for r in rows:
        job_id, exame, ano, disc, tit, st, r_st, p_st, b_hash = r
        tit_short = (tit[:32] + "...") if len(tit) > 35 else tit
        print(f"{job_id:<18} | {str(exame):<8} | {str(ano or '-'):<5} | {st:<9} | {r_st:<18} | {p_st:<16} | {tit_short:<35}")
        results.append({
            "job_id": job_id, "exame": exame, "ano": ano, "disciplina": disc,
            "titulo": tit, "state": st, "rights_review_status": r_st,
            "pedagogical_review_status": p_st, "binary_hash": b_hash
        })
    print("=" * 125)
    print(f"Total listados: {len(results)}\n")
    return results


def cmd_inspect(conn: sqlite3.Connection, job_id: str) -> Optional[Dict[str, Any]]:
    cur = conn.cursor()
    row = cur.execute("""
        SELECT job_id, url, source_category, fonte, exame, instituicao, ano, disciplina,
               titulo, state, attempt_count, last_error_code, binary_hash, normalized_content_hash,
               output_manifest_ref, extractor_version, rights_review_status, rights_evidence_ref,
               approved_operations, reviewed_by, reviewed_at, pedagogical_review_status,
               pedagogical_reviewer, pedagogical_reviewed_at, asset_version
        FROM harvest_quarantine_queue
        WHERE job_id = ?
    """, (job_id,)).fetchone()

    if not row:
        print(f"\n❌ Erro: Job '{job_id}' não encontrado na fila de quarentena.\n")
        return None

    (j_id, url, src_cat, fonte, exame, inst, ano, disc, tit, state,
     attempts, last_err, bin_hash, norm_hash, manifest_ref, ext_ver,
     r_status, r_evid, app_ops, rev_by, rev_at, p_status, p_rev, p_rev_at, asset_ver) = row

    # Decisões registradas no histórico
    history = cur.execute("""
        SELECT decision_id, decision_type, legal_basis_code, operator_identity, reviewer_identity,
               approved_operations_json, audit_hash, created_at
        FROM harvest_rights_decisions
        WHERE job_id = ?
        ORDER BY created_at ASC
    """, (job_id,)).fetchall()

    # Checagem de integridade física se houver arquivo
    integrity_status = "NÃO_BAIXADO"
    if manifest_ref and bin_hash:
        is_intact, msg = verify_file_binary_integrity(manifest_ref, bin_hash)
        integrity_status = "ÍNTEGRO (SHA-256 verificado)" if is_intact else f"CORROMPIDO ({msg})"

    text_snippet = "(Nenhum texto extraído)"
    if bin_hash:
        corpus_row = cur.execute(
            "SELECT extracted_text FROM downloaded_pdf_corpus WHERE sha256_hash = ?", (bin_hash,)
        ).fetchone()
        if corpus_row and corpus_row[0]:
            text_snippet = corpus_row[0][:500].strip() + ("..." if len(corpus_row[0]) > 500 else "")

    item = {
        "job_id": j_id,
        "asset_version": asset_ver,
        "url": url,
        "source_category": src_cat,
        "fonte": fonte,
        "exame": exame,
        "instituicao": inst,
        "ano": ano,
        "disciplina": disc,
        "titulo": tit,
        "state": state,
        "binary_hash": bin_hash,
        "normalized_content_hash": norm_hash,
        "output_manifest_ref": manifest_ref,
        "physical_integrity": integrity_status,
        "rights_review_status": r_status,
        "rights_evidence_ref": r_evid,
        "approved_operations": json.loads(app_ops or "[]"),
        "reviewed_by": rev_by,
        "reviewed_at": rev_at,
        "pedagogical_review_status": p_status,
        "pedagogical_reviewer": p_rev,
        "pedagogical_reviewed_at": p_rev_at,
        "decisions_history": history,
        "text_snippet_preview": text_snippet
    }

    print("\n" + "=" * 85)
    print(f"🔍 DOSSIÊ DE AUDITORIA COMPLETO: JOB {j_id} (Versão {asset_ver})")
    print("=" * 85)
    print(f"• Título:                {tit}")
    print(f"• Exame / Ano:           {exame} ({ano or 'Não informado'}) — {disc or 'Geral'}")
    print(f"• Instituição:           {inst} (Fonte: {fonte})")
    print(f"• URL Oficial:           {url}")
    print(f"• Categoria:             {src_cat}")
    print("-" * 85)
    print(f"• Estado Operacional:    {state} (Tentativas: {attempts})")
    print(f"• SHA-256 Binário:       {bin_hash or 'Pendente'}")
    print(f"• Arquivo Físico Local:  {manifest_ref or 'Pendente'}")
    print(f"• Integridade Física:    {integrity_status}")
    print("-" * 85)
    print(f"• Status de Direitos:    {r_status}")
    print(f"• Base Legal / Evidência:{r_evid or 'Pendente'}")
    print(f"• Operações Aprovadas:   {app_ops or '[]'}")
    print(f"• Revisor de Direitos:   {rev_by or 'Pendente'}")
    print("-" * 85)
    print(f"• Revisão Pedagógica:    {p_status} (Revisor: {p_rev or 'Pendente'})")
    print("-" * 85)
    print(f"📜 Histórico de Deliberações ({len(history)} registros):")
    for h in history:
        print(f"   [{h[7][:19]}] {h[1]:<10} | {h[2]:<30} | Revisor: {h[4]} | AuditHash: {h[6][:16]}...")
    print("-" * 85)
    print("📄 Prévia do Texto Extraído:")
    print(f"\"{text_snippet}\"")
    print("=" * 85 + "\n")
    return item


def cmd_approve(conn: sqlite3.Connection,
                job_id: str,
                operator_id: str,
                legal_basis: str,
                details: str,
                evidence_ref: str,
                operations: List[str],
                auth_token: Optional[str] = None,
                reviewer_identity: Optional[str] = None) -> bool:
    gov = QuarantineGovernanceService(conn)
    res = gov.approve_rights(
        job_id=job_id,
        legal_basis_code=legal_basis,
        legal_basis_details=details,
        evidence_doc_ref=evidence_ref,
        approved_operations=operations,
        declared_operator_id=operator_id,
        auth_token=auth_token,
        reviewer_identity=reviewer_identity
    )
    print("\n" + "=" * 80)
    print(f"✅ DELIBERAÇÃO REGISTRADA COM SUCESSO (HITL):")
    print(f"   • Job ID:           {res['job_id']}")
    print(f"   • Decisão ID:       {res['decision_id']}")
    print(f"   • Status:           {res['status']}")
    print(f"   • Base Legal:       {res['legal_basis_code']}")
    print(f"   • Operações:        {res['approved_operations']}")
    print(f"   • Revisor:          {res['reviewer']}")
    print(f"   • Hash Auditoria:   {res['audit_hash']}")
    print("=" * 80 + "\n")
    return True


def cmd_approve_pedagogy(conn: sqlite3.Connection,
                         job_id: str,
                         operator_id: str,
                         auth_token: Optional[str] = None,
                         notes: str = "") -> bool:
    gov = QuarantineGovernanceService(conn)
    res = gov.approve_pedagogical_review(
        job_id=job_id,
        declared_operator_id=operator_id,
        auth_token=auth_token,
        quality_notes=notes
    )
    print("\n" + "=" * 80)
    print(f"🎓 REVISÃO PEDAGÓGICA REGISTRADA COM SUCESSO:")
    print(f"   • Job ID:         {res['job_id']}")
    print(f"   • Status:         {res['pedagogical_status']}")
    print(f"   • Revisor:        {res['reviewer']}")
    print(f"   • Hash Auditoria: {res['audit_hash']}")
    print("=" * 80 + "\n")
    return True


def cmd_revoke(conn: sqlite3.Connection,
               job_id: str,
               operator_id: str,
               reason: str,
               auth_token: Optional[str] = None) -> bool:
    gov = QuarantineGovernanceService(conn)
    res = gov.revoke_rights(
        job_id=job_id,
        revocation_reason=reason,
        declared_operator_id=operator_id,
        auth_token=auth_token
    )
    print("\n" + "=" * 80)
    print(f"⛔ ATIVO REVOGADO (BLOQUEIO JURÍDICO APLICADO):")
    print(f"   • Job ID:              {res['job_id']}")
    print(f"   • Status:              {res['status']}")
    print(f"   • Motivo da Revogação: {res['revocation_reason']}")
    print(f"   • Derivados Afetados:  {len(res['affected_derivatives'])}")
    for d in res['affected_derivatives']:
        print(f"     - [{d['type']}] {d['ref']} ({d['title']})")
    print(f"   • Hash Auditoria:      {res['audit_hash']}")
    print("=" * 80 + "\n")
    return True


def cmd_check_access(conn: sqlite3.Connection, job_id: str, operation: str) -> bool:
    permitted, reason = can_use(conn, job_id, operation)
    print("\n" + "=" * 80)
    print(f"🛡️ GATEKEEPER DE GOVERNANÇA: CONSULTA DE PERMISSÃO")
    print("=" * 80)
    print(f"• Ativo:     {job_id}")
    print(f"• Operação:  {operation}")
    print(f"• Veredito:  {'✅ PERMITIDO' if permitted else '⛔ NEGADO'}")
    print(f"• Motivo:    {reason}")
    print("=" * 80 + "\n")
    return permitted


def cmd_verify_chain(conn: sqlite3.Connection) -> bool:
    valid, err, count = verify_audit_chain_tamper_evidence(conn)
    print("\n" + "=" * 80)
    print(f"⛓️ VERIFICAÇÃO CONTÍNUA DA TRILHA DE AUDITORIA (SHA-256 CHAIN)")
    print("=" * 80)
    print(f"• Total de Blocos Verificados: {count}")
    if valid:
        print("• Status: ✅ ÍNTEGRO (Nenhuma adulteração de encadeamento detectada)")
    else:
        print(f"• Status: ❌ QUEBRA DE INTEGRIDADE DETECTADA: {err}")
    print("=" * 80 + "\n")
    return valid


def main():
    parser = argparse.ArgumentParser(
        description="🦅 Áquila Pro — Painel de Curadoria e Governança Jurídica da Quarentena (HITL v2.0)"
    )
    parser.add_argument("--db", type=str, help="Caminho do banco SQLite personalizado")

    subparsers = parser.add_subparsers(dest="command", help="Comando a executar")

    subparsers.add_parser("status", help="Exibe o inventário consolidado da quarentena")

    p_list = subparsers.add_parser("list", help="Lista itens da quarentena")
    p_list.add_argument("--status", type=str, help="Filtrar por estado operacional ou status de direitos")
    p_list.add_argument("--exam", type=str, help="Filtrar por exame (ex: ENEM, FUVEST)")
    p_list.add_argument("--limit", type=int, default=20, help="Quantidade máxima a listar")

    p_inspect = subparsers.add_parser("inspect", help="Inspeciona dossiê detalhado de um job")
    p_inspect.add_argument("job_id", type=str, help="ID do Job a inspecionar")

    p_app = subparsers.add_parser("approve", help="Aprova direitos autorais sob fundamentação e operações estritas")
    p_app.add_argument("job_id", type=str, help="ID do Job")
    p_app.add_argument("--operator", type=str, required=True, help="Identificador do operador cadastrado")
    p_app.add_argument("--token", type=str, help="Token/credencial de autenticação do operador")
    p_app.add_argument("--basis", type=str, required=True, choices=list(VALID_LEGAL_BASES.keys()), help="Código da base legal fechada")
    p_app.add_argument("--details", type=str, required=True, help="Fundamentação contextualizada da decisão")
    p_app.add_argument("--evidence", type=str, required=True, help="Referência/link do documento comprobatório de licença ou edital")
    p_app.add_argument("--ops", type=str, required=True, help="Operações autorizadas separadas por vírgula (ex: DISPLAY,RAG_INDEXING,SFT_DATASET)")

    p_ped = subparsers.add_parser("approve-pedagogy", help="Aprova qualidade pedagógica do item (requisito para SFT_DATASET)")
    p_ped.add_argument("job_id", type=str, help="ID do Job")
    p_ped.add_argument("--operator", type=str, required=True, help="Operador com perfil pedagógico")
    p_ped.add_argument("--token", type=str, help="Token do operador")
    p_ped.add_argument("--notes", type=str, default="", help="Parecer pedagógico de qualidade")

    p_rev = subparsers.add_parser("revoke", help="Revoga direitos de um ativo previamente aprovado")
    p_rev.add_argument("job_id", type=str, help="ID do Job")
    p_rev.add_argument("--operator", type=str, required=True, help="Operador cadastrado com perfil DPO/Jurídico")
    p_rev.add_argument("--token", type=str, help="Token do operador")
    p_rev.add_argument("--reason", type=str, required=True, help="Justificativa da revogação")

    p_chk = subparsers.add_parser("check-access", help="Consulta o gatekeeper can_use() para uma operação")
    p_chk.add_argument("job_id", type=str, help="ID do Job")
    p_chk.add_argument("--op", type=str, required=True, choices=list(ALL_OPERATIONS), help="Operação a consultar")

    subparsers.add_parser("verify-chain", help="Verifica a integridade criptográfica da trilha de auditoria")

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
            cmd_approve(conn, args.job_id, args.operator, args.basis, args.details, args.evidence, ops_list, args.token)
        elif args.command == "approve-pedagogy":
            cmd_approve_pedagogy(conn, args.job_id, args.operator, args.token, args.notes)
        elif args.command == "revoke":
            cmd_revoke(conn, args.job_id, args.operator, args.reason, args.token)
        elif args.command == "check-access":
            cmd_check_access(conn, args.job_id, args.op)
        elif args.command == "verify-chain":
            cmd_verify_chain(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
