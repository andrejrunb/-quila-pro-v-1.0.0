"""
Rotas de configurações do sistema (SystemSettings) para a interface web do Sistema Áquila.
"""

import logging
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, abort
from flask_login import login_required, current_user

from models import db, SystemSettings, AuditLog

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("aquila.web_interface.routes.settings")

settings_bp = Blueprint("settings", __name__, url_prefix="/settings")


def _require_admin():
    if not (hasattr(current_user, "is_admin") and current_user.is_admin()):
        abort(403)


@settings_bp.route("/")
@login_required
def index():
    settings = SystemSettings.query.order_by(SystemSettings.key.asc()).all()
    can_edit = bool(hasattr(current_user, "is_admin") and current_user.is_admin())
    return render_template("settings/index.html", settings=settings, can_edit=can_edit)


@settings_bp.route("/update", methods=["POST"])
@login_required
def update():
    _require_admin()

    key = (request.form.get("key") or "").strip()
    value = request.form.get("value")

    if not key:
        flash("Chave inválida.", "danger")
        return redirect(url_for("settings.index"))

    setting = SystemSettings.query.filter_by(key=key).first()
    if not setting:
        flash("Configuração não encontrada.", "danger")
        return redirect(url_for("settings.index"))

    old_value = setting.value
    setting.value = value
    setting.updated_by = current_user.id

    log = AuditLog(
        user_id=current_user.id,
        action="system_setting_updated",
        entity_type="system_setting",
        entity_id=key,
        ip_address=request.remote_addr,
        details=f"Setting '{key}' alterada de '{old_value}' para '{value}'",
    )
    db.session.add(log)
    db.session.commit()

    flash("Configuração atualizada com sucesso.", "success")
    return redirect(url_for("settings.index"))


@settings_bp.route("/api")
@login_required
def api_settings():
    settings = SystemSettings.query.order_by(SystemSettings.key.asc()).all()
    return jsonify({s.key: s.value for s in settings})
