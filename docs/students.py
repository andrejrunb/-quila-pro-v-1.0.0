"""
Rotas para gerenciamento de alunos na interface web do Sistema Áquila.
(versão estável para estrutura "flat" em C:\\aquila)
"""

import logging
from datetime import datetime

from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user

from models import db, AuditLog, SavedReport

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("aquila.web_interface.routes.students")

students_bp = Blueprint("students", __name__, url_prefix="/students")


# Dados fictícios (protótipo). Depois você troca por DB.
_FAKE_STUDENTS = {
    "ALUNO_001": {"id": "ALUNO_001", "name": "Ana Silva", "class": "Turma 1A"},
    "ALUNO_002": {"id": "ALUNO_002", "name": "Bruno Oliveira", "class": "Turma 1A"},
    "ALUNO_003": {"id": "ALUNO_003", "name": "Carla Souza", "class": "Turma 2B"},
}


@students_bp.route("/")
@login_required
def index():
    students = list(_FAKE_STUDENTS.values())
    return render_template("students/index.html", students=students)


@students_bp.route("/<student_id>")
@login_required
def view(student_id):
    student = _FAKE_STUDENTS.get(student_id)
    if not student:
        flash("Aluno não encontrado.", "danger")
        return redirect(url_for("students.index"))

    log = AuditLog(
        user_id=current_user.id,
        action="student_viewed",
        entity_type="student",
        entity_id=student_id,
        ip_address=request.remote_addr,
        details=f"Visualização do aluno {student_id}",
    )
    db.session.add(log)
    db.session.commit()

    return render_template("students/view.html", student=student)


@students_bp.route("/<student_id>/report", methods=["GET", "POST"])
@login_required
def report(student_id):
    student = _FAKE_STUDENTS.get(student_id)
    if not student:
        flash("Aluno não encontrado.", "danger")
        return redirect(url_for("students.index"))

    if request.method == "POST":
        report_type = request.form.get("report_type") or "frequencia"

        report_name = (
            f"Relatório de {report_type.capitalize()} - {student['name']} - "
            f"{datetime.now().strftime('%d/%m/%Y')}"
        )
        # arquivo físico não está sendo gerado aqui (protótipo)
        # mas mantemos um caminho consistente para o SavedReport
        report_path = f"/reports/student_{student_id}_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"

        saved_report = SavedReport(
            user_id=current_user.id,
            report_type=report_type,
            report_name=report_name,
            file_path=report_path,
            entity_id=student_id,
        )

        log = AuditLog(
            user_id=current_user.id,
            action="student_report_generated",
            entity_type="student",
            entity_id=student_id,
            ip_address=request.remote_addr,
            details=f"Relatório gerado: {report_type} para aluno {student_id}",
        )

        db.session.add(saved_report)
        db.session.add(log)
        db.session.commit()

        flash("Relatório registrado com sucesso!", "success")
        return redirect(url_for("reports.index"))

    return render_template("students/report.html", student=student)
