"""
Rotas para gerenciamento de turmas na interface web do Sistema Áquila

Este módulo contém as rotas relacionadas ao gerenciamento de turmas,
incluindo visualização, cadastro, edição e análise de desempenho.
"""

import logging
import os
from datetime import datetime, timedelta
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from models import db, AuditLog, SavedReport

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.web_interface.routes.classes')

# Criar blueprint
classes_bp = Blueprint('classes', __name__, url_prefix='/classes')

@classes_bp.route('/')
@login_required
def index():
    """Rota para listagem de turmas."""
    # Obter parâmetros de filtro
    grade_filter = request.args.get('grade', '')
    search = request.args.get('search', '')
    
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    classes = [
        {
            'id': 'TURMA_1A',
            'name': 'Turma 1A',
            'grade': '9º Ano',
            'students_count': 25,
            'present_count': 23,
            'absent_count': 2,
            'attendance_rate': 92,
            'avg_engagement': 85
        },
        {
            'id': 'TURMA_1B',
            'name': 'Turma 1B',
            'grade': '9º Ano',
            'students_count': 28,
            'present_count': 25,
            'absent_count': 3,
            'attendance_rate': 89,
            'avg_engagement': 82
        },
        {
            'id': 'TURMA_2A',
            'name': 'Turma 2A',
            'grade': '8º Ano',
            'students_count': 26,
            'present_count': 24,
            'absent_count': 2,
            'attendance_rate': 92,
            'avg_engagement': 84
        },
        {
            'id': 'TURMA_2B',
            'name': 'Turma 2B',
            'grade': '8º Ano',
            'students_count': 27,
            'present_count': 25,
            'absent_count': 2,
            'attendance_rate': 93,
            'avg_engagement': 86
        },
        {
            'id': 'TURMA_3A',
            'name': 'Turma 3A',
            'grade': '7º Ano',
            'students_count': 24,
            'present_count': 22,
            'absent_count': 2,
            'attendance_rate': 92,
            'avg_engagement': 83
        }
    ]
    
    # Aplicar filtros
    filtered_classes = classes
    
    if grade_filter:
        filtered_classes = [c for c in filtered_classes if c['grade'] == grade_filter]
        
    if search:
        filtered_classes = [c for c in filtered_classes if search.lower() in c['name'].lower() or search in c['id']]
    
    # Lista de séries para o filtro
    grades = ['7º Ano', '8º Ano', '9º Ano']
    
    return render_template('classes/index.html', 
                          classes=filtered_classes,
                          grades=grades,
                          grade_filter=grade_filter,
                          search=search)

@classes_bp.route('/<class_id>')
@login_required
def view(class_id):
    """Rota para visualização detalhada de uma turma."""
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    if class_id == 'TURMA_1A':
        class_data = {
            'id': 'TURMA_1A',
            'name': 'Turma 1A',
            'grade': '9º Ano',
            'students_count': 25,
            'present_count': 23,
            'absent_count': 2,
            'attendance_rate': 92,
            'avg_engagement': 85,
            'details': {
                'classroom': 'Sala 101',
                'schedule': 'Manhã (07:30 - 12:00)',
                'teacher': 'Prof. Carlos Oliveira'
            },
            'attendance': {
                'present_rate': 92,
                'absent_rate': 8,
                'history': [
                    {'date': '01/04/2025', 'present': 23, 'absent': 2, 'rate': 92},
                    {'date': '31/03/2025', 'present': 24, 'absent': 1, 'rate': 96},
                    {'date': '30/03/2025', 'present': 22, 'absent': 3, 'rate': 88},
                    {'date': '29/03/2025', 'present': 25, 'absent': 0, 'rate': 100},
                    {'date': '28/03/2025', 'present': 21, 'absent': 4, 'rate': 84}
                ]
            },
            'performance': {
                'high_engagement': 10,
                'medium_engagement': 12,
                'low_engagement': 3,
                'classroom_time': 85,
                'exit_rate': 1.2,
                'bathroom_visits': 1.5,
                'history': [
                    {'week': 'Semana 1', 'score': 82},
                    {'week': 'Semana 2', 'score': 84},
                    {'week': 'Semana 3', 'score': 85},
                    {'week': 'Semana 4', 'score': 86},
                    {'week': 'Semana 5', 'score': 85}
                ]
            },
            'students': [
                {
                    'id': 'ALUNO_001',
                    'name': 'Ana Silva',
                    'status': 'present',
                    'attendance_rate': 95,
                    'engagement_score': 88,
                    'last_seen': 'Sala 101 - 10:15'
                },
                {
                    'id': 'ALUNO_002',
                    'name': 'Bruno Oliveira',
                    'status': 'present',
                    'attendance_rate': 92,
                    'engagement_score': 85,
                    'last_seen': 'Sala 101 - 10:15'
                },
                {
                    'id': 'ALUNO_006',
                    'name': 'Fernanda Costa',
                    'status': 'present',
                    'attendance_rate': 90,
                    'engagement_score': 82,
                    'last_seen': 'Sala 101 - 10:15'
                },
                {
                    'id': 'ALUNO_007',
                    'name': 'Gabriel Souza',
                    'status': 'absent',
                    'attendance_rate': 85,
                    'engagement_score': 78,
                    'last_seen': 'N/A'
                },
                {
                    'id': 'ALUNO_008',
                    'name': 'Helena Pereira',
                    'status': 'present',
                    'attendance_rate': 93,
                    'engagement_score': 86,
                    'last_seen': 'Sala 101 - 10:15'
                }
            ]
        }
    else:
        # Turma genérica para outros IDs
        class_data = {
            'id': class_id,
            'name': f'Turma {class_id}',
            'grade': '9º Ano',
            'students_count': 25,
            'present_count': 23,
            'absent_count': 2,
            'attendance_rate': 92,
            'avg_engagement': 85,
            'details': {
                'classroom': 'Sala 101',
                'schedule': 'Manhã (07:30 - 12:00)',
                'teacher': 'Prof. Carlos Oliveira'
            },
            'attendance': {
                'present_rate': 92,
                'absent_rate': 8,
                'history': [
                    {'date': '01/04/2025', 'present': 23, 'absent': 2, 'rate': 92},
                    {'date': '31/03/2025', 'present': 24, 'absent': 1, 'rate': 96},
                    {'date': '30/03/2025', 'present': 22, 'absent': 3, 'rate': 88},
                    {'date': '29/03/2025', 'present': 25, 'absent': 0, 'rate': 100},
                    {'date': '28/03/2025', 'present': 21, 'absent': 4, 'rate': 84}
                ]
            },
            'performance': {
                'high_engagement': 10,
                'medium_engagement': 12,
                'low_engagement': 3,
                'classroom_time': 85,
                'exit_rate': 1.2,
                'bathroom_visits': 1.5,
                'history': [
                    {'week': 'Semana 1', 'score': 82},
                    {'week': 'Semana 2', 'score': 84},
                    {'week': 'Semana 3', 'score': 85},
                    {'week': 'Semana 4', 'score': 86},
                    {'week': 'Semana 5', 'score': 85}
                ]
            },
            'students': [
                {
                    'id': 'ALUNO_001',
                    'name': 'Ana Silva',
                    'status': 'present',
                    'attendance_rate': 95,
                    'engagement_score': 88,
                    'last_seen': 'Sala 101 - 10:15'
                },
                {
                    'id': 'ALUNO_002',
                    'name': 'Bruno Oliveira',
                    'status': 'present',
                    'attendance_rate': 92,
                    'engagement_score': 85,
                    'last_seen': 'Sala 101 - 10:15'
                },
                {
                    'id': 'ALUNO_006',
                    'name': 'Fernanda Costa',
                    'status': 'present',
                    'attendance_rate': 90,
                    'engagement_score': 82,
                    'last_seen': 'Sala 101 - 10:15'
                },
                {
                    'id': 'ALUNO_007',
                    'name': 'Gabriel Souza',
                    'status': 'absent',
                    'attendance_rate': 85,
                    'engagement_score': 78,
                    'last_seen': 'N/A'
                },
                {
                    'id': 'ALUNO_008',
                    'name': 'Helena Pereira',
                    'status': 'present',
                    'attendance_rate': 93,
                    'engagement_score': 86,
                    'last_seen': 'Sala 101 - 10:15'
                }
            ]
        }
    
    # Registrar visualização
    log = AuditLog(
        user_id=current_user.id,
        action='class_viewed',
        entity_type='class',
        entity_id=class_id,
        ip_address=request.remote_addr,
        details=f"Visualização da turma: {class_id}"
    )
    db.session.add(log)
    db.session.commit()
    
    return render_template('classes/view.html', class_data=class_data)

@classes_bp.route('/new', methods=['GET', 'POST'])
@login_required
def new():
    """Rota para cadastro de nova turma."""
    if request.method == 'POST':
        # Obter dados do formulário
        class_id = request.form.get('class_id')
        name = request.form.get('name')
        grade = request.form.get('grade')
        classroom = request.form.get('classroom')
        schedule = request.form.get('schedule')
        teacher = request.form.get('teacher')
        
        # Validar campos obrigatórios
        if not class_id or not name or not grade:
            flash('Por favor, preencha todos os campos obrigatórios.', 'danger')
            return render_template('classes/new.html')
        
        # Em um sistema real, salvaríamos no banco de dados
        # Para este protótipo, apenas simulamos o cadastro
        
        # Registrar ação
        log = AuditLog(
            user_id=current_user.id,
            action='class_created',
            entity_type='class',
            entity_id=class_id,
            ip_address=request.remote_addr,
            details=f"Nova turma cadastrada: {name} ({class_id})"
        )
        db.session.add(log)
        db.session.commit()
        
        flash(f'Turma {name} cadastrada com sucesso!', 'success')
        return redirect(url_for('classes.view', class_id=class_id))
    
    # Lista de séries para o formulário
    grades = ['7º Ano', '8º Ano', '9º Ano']
    
    return render_template('classes/new.html', grades=grades)

@classes_bp.route('/<class_id>/edit', methods=['GET', 'POST'])
@login_required
def edit(class_id):
    """Rota para edição de turma."""
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    if class_id == 'TURMA_1A':
        class_data = {
            'id': 'TURMA_1A',
            'name': 'Turma 1A',
            'grade': '9º Ano',
            'details': {
                'classroom': 'Sala 101',
                'schedule': 'Manhã (07:30 - 12:00)',
                'teacher': 'Prof. Carlos Oliveira'
            }
        }
    else:
        class_data = {
            'id': class_id,
            'name': f'Turma {class_id}',
            'grade': '9º Ano',
            'details': {
                'classroom': 'Sala 101',
                'schedule': 'Manhã (07:30 - 12:00)',
                'teacher': 'Prof. Carlos Oliveira'
            }
        }
    
    if request.method == 'POST':
        # Obter dados do formulário
        name = request.form.get('name')
        grade = request.form.get('grade')
        classroom = request.form.get('classroom')
        schedule = request.form.get('schedule')
        teacher = request.form.get('teacher')
        
        # Validar campos obrigatórios
        if not name or not grade:
            flash('Por favor, preencha todos os campos obrigatórios.', 'danger')
            return render_template('classes/edit.html', class_data=class_data)
        
        # Em um sistema real, atualizaríamos no banco de dados
        # Para este protótipo, apenas simulamos a atualização
        
        # Registrar ação
        log = AuditLog(
            user_id=current_user.id,
            action='class_updated',
            entity_type='class',
            entity_id=class_id,
            ip_address=request.remote_addr,
            details=f"Turma atualizada: {name} ({class_id})"
        )
        db.session.add(log)
        db.session.commit()
        
        flash(f'Turma {name} atualizada com sucesso!', 'success')
        return redirect(url_for('classes.view', class_id=class_id))
    
    # Lista de séries para o formulário
    grades = ['7º Ano', '8º Ano', '9º Ano']
    
    return render_template('classes/edit.html', class_data=class_data, grades=grades)

@classes_bp.route('/<class_id>/report', methods=['GET', 'POST'])
@login_required
def generate_report(class_id):
    """Rota para geração de relatório de desempenho da turma."""
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    if class_id == 'TURMA_1A':
        class_data = {
            'id': 'TURMA_1A',
            'name': 'Turma 1A',
            'grade': '9º Ano'
        }
    else:
        class_data = {
            'id': class_id,
            'name': f'Turma {class_id}',
            'grade': '9º Ano'
        }
    
    if request.method == 'POST':
        # Obter parâmetros do relatório
        report_type = request.form.get('report_type')
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        include_charts = 'include_charts' in request.form
        include_students = 'include_students' in request.form
        
        # Validar campos
        if not report_type or not start_date or not end_date:
            flash('Por favor, preencha todos os campos obrigatórios.', 'danger')
            return render_template('classes/report.html', class_data=class_data)
        
        # Em um sistema real, geraríamos o relatório
        # Para este protótipo, apenas simulamos a geração
        
        # Criar registro do relatório
        report_name = f"Relatório de {report_type.capitalize()} - {class_data['name']} - {datetime.now().strftime('%d/%m/%Y')}"
        report_path = f"/reports/class_{class_id}_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        
        saved_report = SavedReport(
            user_id=current_user.id,
            report_type=report_type,
            report_name=report_name,
            file_path=report_path,
            entity_id=class_id
        )
        
        # Registrar ação
        l

