"""
Rotas para relatórios na interface web do Sistema Áquila.

- Lista relatórios salvos (SavedReport)
- Permite abrir/baixar relatório gerado (HTML/PNG/etc) se o arquivo existir
- Permite excluir relatório (opcional)
"""

import os
import logging
from flask import Blueprint, render_template, current_app, send_from_directory, abort, flash, redirect, url_for, request
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from models import db, SavedReport, AuditLog

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("aquila.web_interface.routes.reports")

reports_bp = Blueprint("reports", __name__, url_prefix="/reports")


@reports_bp.route("/")
@login_required
def index():
    """
    Lista relatórios do usuário atual (ou todos se admin).
    """
    q = SavedReport.query.order_by(SavedReport.created_at.desc())

    if hasattr(current_user, "is_admin") and current_user.is_admin():
        reports = q.limit(200).all()
    else:
        reports = q.filter_by(user_id=current_user.id).limit(200).all()

    # Se você ainda não tem template, dá para trocar por um retorno simples,
    # mas deixo render_template para manter padrão.
    return render_template("reports/index.html", reports=reports)


@reports_bp.route("/download/<int:report_id>")
@login_required
def download(report_id: int):
    """
    Baixa/abre o arquivo do relatório (serve via send_from_directory).
    """
    report = SavedReport.query.get_or_404(report_id)

    # autorização: admin ou dono
    if not (hasattr(current_user, "is_admin") and current_user.is_admin()) and report.user_id != current_user.id:
        abort(403)

    # file_path no seu model pode estar como "/reports/arquivo.html"
    # Vamos extrair só o nome do arquivo e servir a partir do REPORTS_FOLDER.
    filename = os.path.basename(report.file_path or "")
    filename = secure_filename(filename)
    if not filename:
        abort(404)

    reports_dir = current_app.config.get("REPORTS_FOLDER")
    if not reports_dir:
        abort(500)

    full_path = os.path.join(reports_dir, filename)
    if not os.path.isfile(full_path):
        abort(404)

    # Auditoria
    log = AuditLog(
        user_id=current_user.id,
        action="report_downloaded",
        entity_type="report",
        entity_id=str(report.id),
        ip_address=request.remote_addr,
        details=f"Download/abertura do relatório: {report.report_name} ({filename})",
    )
    db.session.add(log)
    db.session.commit()

    # as_attachment=False permite abrir HTML no navegador; se quiser forçar download, troque para True
    return send_from_directory(reports_dir, filename, as_attachment=False)


@reports_bp.route("/delete/<int:report_id>", methods=["POST"])
@login_required
def delete(report_id: int):
    """
    Exclui um registro SavedReport e (opcionalmente) o arquivo físico.
    """
    report = SavedReport.query.get_or_404(report_id)

    if not (hasattr(current_user, "is_admin") and current_user.is_admin()) and report.user_id != current_user.id:
        abort(403)

    filename = secure_filename(os.path.basename(report.file_path or "")) if report.file_path else ""
    reports_dir = current_app.config.get("REPORTS_FOLDER")

    # Auditoria
    log = AuditLog(
        user_id=current_user.id,
        action="report_deleted",
        entity_type="report",
        entity_id=str(report.id),
        ip_address=request.remote_addr,
        details=f"Relatório removido: {report.report_name} ({filename})",
    )
    db.session.add(log)

    # Remove registro
    db.session.delete(report)
    db.session.commit()

    # Opcional: remover arquivo físico
    if filename and reports_dir:
        try:
            full_path = os.path.join(reports_dir, filename)
            if os.path.isfile(full_path):
                os.remove(full_path)
        except Exception:
            logger.exception("Falha ao remover arquivo físico do relatório: %s", filename)

    flash("Relatório removido.", "success")
    return redirect(url_for("reports.index"))
