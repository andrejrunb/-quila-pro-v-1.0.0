#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Missão PP — Item 9: Suite de 10 Fixtures do Coletor de Documentos e Proteção SSRF
Executa testes determinísticos e sintéticos sem tocar bancos reais.
"""

import io
import sys
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from swarm_continuous_finetune_daemon import (
    is_safe_external_url,
    is_safe_ip_address,
    SafeRedirectHandler,
    validate_candidate_document_bytes,
)


def build_valid_pdf_with_text(text: str = "PROVA OFICIAL DE FISICA ENEM 2025 QUESTAO 1 LEIS DE NEWTON") -> bytes:
    """Gera um PDF 1.4 sintético válido em memória com stream de texto extraível pelo pypdf."""
    from pypdf import PdfWriter
    from pypdf.generic import (
        DecodedStreamObject,
        DictionaryObject,
        NameObject,
    )

    writer = PdfWriter()
    page = writer.add_blank_page(width=612, height=792)

    font_dict = DictionaryObject({
        NameObject("/Type"): NameObject("/Font"),
        NameObject("/Subtype"): NameObject("/Type1"),
        NameObject("/BaseFont"): NameObject("/Helvetica"),
    })
    font_ref = writer._add_object(font_dict)
    resources = DictionaryObject({
        NameObject("/Font"): DictionaryObject({NameObject("/F1"): font_ref})
    })
    page[NameObject("/Resources")] = resources

    content_stream = DecodedStreamObject()
    content_stream.set_data(f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET".encode("latin1"))
    content_ref = writer._add_object(content_stream)
    page[NameObject("/Contents")] = content_ref

    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def build_scanned_pdf_without_text() -> bytes:
    """Gera um PDF 1.4 válido com página em branco (simulando PDF escaneado sem camada de texto)."""
    from pypdf import PdfWriter

    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def run_tests():
    results = []

    def record(name: str, passed: bool, details: str):
        results.append({"fixture": name, "passed": passed, "details": details})
        if not passed:
            raise AssertionError(f"Fixture failed: {name} -> {details}")

    # 1. PDF válido com texto extraível
    pdf_with_text = build_valid_pdf_with_text()
    res1 = validate_candidate_document_bytes(
        pdf_with_text,
        content_type="application/pdf",
        orig_url="https://download.inep.gov.br/enem/provas/2025_caderno1.pdf",
        final_url="https://download.inep.gov.br/enem/provas/2025_caderno1.pdf",
        http_status=200,
    )
    record(
        "1_valid_pdf_with_text",
        res1["valid"] is True and res1["status"] == "EXTRAIDO" and "NEWTON" in res1["extracted_text"],
        f"status={res1['status']}, len_text={len(res1['extracted_text'])}",
    )

    # 2. PDF escaneado sem camada de texto
    pdf_scanned = build_scanned_pdf_without_text()
    res2 = validate_candidate_document_bytes(
        pdf_scanned,
        content_type="application/pdf",
        orig_url="https://acervo.fuvest.br/provas/1998_f1.pdf",
        final_url="https://acervo.fuvest.br/provas/1998_f1.pdf",
        http_status=200,
    )
    record(
        "2_scanned_pdf_without_text",
        res2["valid"] is True and res2["status"] == "BAIXADO" and res2["extracted_text"] == "",
        f"status={res2['status']}, reason={res2['reason']}",
    )

    # 3. HTML completo com 200 OK
    html_full = b"<!DOCTYPE html><html><head><title>Portal</title></head><body>" + (b"<p>Conteudo</p>" * 60) + b"</body></html>"
    res3 = validate_candidate_document_bytes(
        html_full,
        content_type="text/html; charset=utf-8",
        orig_url="https://portal.exemplo.edu.br/prova.pdf",
        final_url="https://portal.exemplo.edu.br/prova.pdf",
        http_status=200,
    )
    record(
        "3_full_html_200_ok",
        res3["valid"] is False and res3["status"] == "REJECTED_INVALID_DOCUMENT" and "HTML_NOT_PDF" in res3["reason"],
        res3["reason"],
    )

    # 4. HTML parcial
    html_partial = b"<html><body><h1>Erro 502 Bad Gateway - CloudFront"
    res4 = validate_candidate_document_bytes(
        html_partial,
        content_type="application/octet-stream",
        orig_url="https://portal.exemplo.edu.br/prova_parcial.pdf",
        final_url="https://portal.exemplo.edu.br/prova_parcial.pdf",
        http_status=200,
    )
    record(
        "4_partial_html",
        res4["valid"] is False and res4["status"] == "REJECTED_INVALID_DOCUMENT" and "HTML_NOT_PDF" in res4["reason"],
        res4["reason"],
    )

    # 5. JSON de erro
    json_error = json.dumps({"error": "FileNotFound", "code": 404, "message": "Artifact expired"}).encode("utf-8")
    res5 = validate_candidate_document_bytes(
        json_error,
        content_type="application/json",
        orig_url="https://api.exemplo.edu.br/v1/provas/999.pdf",
        final_url="https://api.exemplo.edu.br/v1/provas/999.pdf",
        http_status=200,
    )
    record(
        "5_json_error_payload",
        res5["valid"] is False and res5["status"] == "REJECTED_INVALID_DOCUMENT" and "JSON_OR_TEXT_ERROR" in res5["reason"],
        res5["reason"],
    )

    # 6. Texto simples
    plain_text = b"Error: Resource temporarily unavailable. Please try again later."
    res6 = validate_candidate_document_bytes(
        plain_text,
        content_type="text/plain",
        orig_url="https://cdn.exemplo.edu.br/prova.pdf",
        final_url="https://cdn.exemplo.edu.br/prova.pdf",
        http_status=200,
    )
    record(
        "6_plain_text_payload",
        res6["valid"] is False and res6["status"] == "REJECTED_INVALID_DOCUMENT" and "JSON_OR_TEXT_ERROR" in res6["reason"],
        res6["reason"],
    )

    # 7. Binário truncado
    truncated_bin = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00"
    res7 = validate_candidate_document_bytes(
        truncated_bin,
        content_type="application/octet-stream",
        orig_url="https://cdn.exemplo.edu.br/truncado.pdf",
        final_url="https://cdn.exemplo.edu.br/truncado.pdf",
        http_status=200,
    )
    record(
        "7_truncated_binary",
        res7["valid"] is False and res7["status"] == "REJECTED_INVALID_DOCUMENT",
        res7["reason"],
    )

    # 8. Arquivo com %PDF- sem %%EOF
    pdf_no_eof = b"%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n" + (b"0" * 600)
    res8 = validate_candidate_document_bytes(
        pdf_no_eof,
        content_type="application/pdf",
        orig_url="https://cdn.exemplo.edu.br/incompleto.pdf",
        final_url="https://cdn.exemplo.edu.br/incompleto.pdf",
        http_status=200,
    )
    record(
        "8_pdf_header_without_eof",
        res8["valid"] is False and res8["status"] == "REJECTED_INVALID_DOCUMENT" and "MISSING_PDF_EOF" in res8["reason"],
        res8["reason"],
    )

    # 9. Redirecionamento para página de login
    login_redirect_bytes = b"<!DOCTYPE html><html><body><form action='/login'>Login</form></body></html>"
    res9 = validate_candidate_document_bytes(
        login_redirect_bytes,
        content_type="text/html",
        orig_url="https://acervo.exemplo.edu.br/restrito/prova2025.pdf",
        final_url="https://acervo.exemplo.edu.br/auth/login?next=/restrito/prova2025.pdf",
        http_status=200,
    )
    record(
        "9_redirect_to_login_page",
        res9["valid"] is False and res9["status"] == "REJECTED_INVALID_DOCUMENT" and "HTML_LOGIN_REDIRECT" in res9["reason"],
        res9["reason"],
    )

    # 10. Redirecionamento para IP privado / loopback / link-local (SSRF Guard)
    redirect_handler = SafeRedirectHandler()
    orig_req = urllib.request.Request("https://download.inep.gov.br/prova.pdf")
    blocked_targets = [
        "http://127.0.0.1:8080/admin",
        "http://localhost:9000/internal",
        "http://10.0.0.15/secret.pdf",
        "http://172.16.5.4/internal.pdf",
        "http://192.168.1.1/router.pdf",
        "http://169.254.169.254/latest/meta-data/",
        "http://[::1]:8000/secret",
    ]
    blocked_count = 0
    for target in blocked_targets:
        assert is_safe_external_url(target) is False, f"Target should be blocked by is_safe_external_url: {target}"
        try:
            redirect_handler.redirect_request(orig_req, None, 302, "Found", {}, target)
        except ValueError as err:
            if "SSRF_REDIRECT_BLOCKED" in str(err):
                blocked_count += 1

    record(
        "10_redirect_to_private_ip_ssrf_blocked",
        blocked_count == len(blocked_targets) and is_safe_ip_address("8.8.8.8") is True,
        f"blocked={blocked_count}/{len(blocked_targets)} targets",
    )

    report_path = ROOT / "test-results" / "collector_10_fixtures_report.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps({"total": len(results), "passed": len(results), "results": results}, indent=2), encoding="utf-8")
    print(f"OK: {len(results)}/10 collector fixtures passed -> {report_path}")


if __name__ == "__main__":
    run_tests()
