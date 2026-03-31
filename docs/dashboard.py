"""
Rotas do painel de controle para a interface web do Sistema Áquila

Este módulo contém as rotas relacionadas ao painel de controle principal,
incluindo visão geral do sistema e estatísticas.
"""

import logging
from datetime import datetime, timedelta
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user

from models import db, User, AuditLog, SavedReport

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.web_interface.routes.dashboard')

# Criar blueprint
dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')

@dashboard_bp.route('/')
@login_required
def index():
    """Rota para o painel de controle principal."""
    # Obter estatísticas básicas
    stats = {
        'total_students': 0,
        'total_classes': 0,
        'students_present_today': 0,
        'students_absent_today': 0,
        'attendance_rate': 0,
        'students_at_risk': 0
    }
    
    # Em um sistema real, estas estatísticas seriam obtidas do banco de dados
    # Para este protótipo, usamos dados fictícios
    stats['total_students'] = 500
    stats['total_classes'] = 20
    stats['students_present_today'] = 450
    stats['students_absent_today'] = 50
    stats['attendance_rate'] = 90
    stats['students_at_risk'] = 25
    
    # Obter relatórios recentes
    recent_reports = SavedReport.query.filter_by(user_id=current_user.id).order_by(SavedReport.created_at.desc()).limit(5).all()
    
    # Obter atividades recentes
    recent_activities = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(10).all()
    
    return render_template('dashboard/index.html', 
                          stats=stats, 
                          recent_reports=recent_reports,
                          recent_activities=recent_activities)

@dashboard_bp.route('/stats')
@login_required
def stats():
    """Rota para estatísticas detalhadas."""
    # Obter período de análise
    period = request.args.get('period', 'week')
    
    if period == 'day':
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        title = 'Estatísticas do Dia'
    elif period == 'week':
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=datetime.now().weekday())
        title = 'Estatísticas da Semana'
    elif period == 'month':
        start_date = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        title = 'Estatísticas do Mês'
    else:
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30)
        title = 'Estatísticas dos Últimos 30 Dias'
    
    # Em um sistema real, estas estatísticas seriam obtidas do banco de dados
    # Para este protótipo, usamos dados fictícios
    attendance_stats = {
        'labels': ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
        'attendance_data': [92, 88, 95, 91, 89],
        'absence_data': [8, 12, 5, 9, 11]
    }
    
    location_stats = {
        'labels': ['Salas de Aula', 'Corredores', 'Banheiros', 'Pátio', 'Biblioteca', 'Cantina'],
        'data': [65, 10, 5, 12, 5, 3]
    }
    
    exit_stats = {
        'labels': ['0', '1', '2', '3', '4', '5+'],
        'data': [350, 80, 40, 20, 8, 2]
    }
    
    bathroom_stats = {
        'labels': ['0', '1', '2', '3', '4', '5+'],
        'data': [380, 70, 30, 15, 4, 1]
    }
    
    return render_template('dashboard/stats.html',
                          title=title,
                          period=period,
                          start_date=start_date,
                          attendance_stats=attendance_stats,
                          location_stats=location_stats,
                          exit_stats=exit_stats,
                          bathroom_stats=bathroom_stats)

@dashboard_bp.route('/at-risk')
@login_required
def at_risk():
    """Rota para visualização de alunos em situação de risco."""
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    at_risk_students = [
        {
            'id': 'ALUNO_042',
            'name': 'João Silva',
            'class': 'Turma 3B',
            'risk_score': 35,
            'attendance_rate': 65,
            'classroom_time': 58,
            'exit_count': 4,
            'risk_factors': ['Frequência abaixo de 75%', 'Menos de 70% do tempo em sala de aula', 'Saídas frequentes']
        },
        {
            'id': 'ALUNO_078',
            'name': 'Maria Oliveira',
            'class': 'Turma 2A',
            'risk_score': 42,
            'attendance_rate': 70,
            'classroom_time': 62,
            'exit_count': 3,
            'risk_factors': ['Frequência abaixo de 75%', 'Menos de 70% do tempo em sala de aula']
        },
        {
            'id': 'ALUNO_103',
            'name': 'Pedro Santos',
            'class': 'Turma 4C',
            'risk_score': 48,
            'attendance_rate': 72,
            'classroom_time': 68,
            'exit_count': 2,
            'risk_factors': ['Frequência abaixo de 75%', 'Menos de 70% do tempo em sala de aula']
        }
    ]
    
    return render_template('dashboard/at_risk.html', at_risk_students=at_risk_students)

@dashboard_bp.route('/search')
@login_required
def search():
    """Rota para busca global no sistema."""
    query = request.args.get('q', '')
    
    if not query or len(query) < 3:
        return render_template('dashboard/search.html', query=query, results=None)
    
    # Em um sistema real, estes resultados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    results = {
        'students': [
            {'id': 'ALUNO_042', 'name': 'João Silva', 'class': 'Turma 3B'},
            {'id': 'ALUNO_078', 'name': 'Maria Oliveira', 'class': 'Turma 2A'}
        ],
        'classes': [
            {'id': 'TURMA_3B', 'name': 'Turma 3B', 'students_count': 25},
            {'id': 'TURMA_2A', 'name': 'Turma 2A', 'students_count': 28}
        ],
        'reports': [
            {'id': 1, 'name': 'Relatório de Frequência - Turma 3B', 'created_at': datetime.now() - timedelta(days=2)},
            {'id': 2, 'name': 'Relatório de Desempenho - João Silva', 'created_at': datetime.now() - timedelta(days=5)}
        ]
    }
    
    return render_template('dashboard/search.html', query=query, results=results)

@dashboard_bp.route('/activity-log')
@login_required
def activity_log():
    """Rota para visualização do log de atividades."""
    # Verificar permissões
    if not current_user.is_admin():
        flash('Você não tem permissão para acessar esta página.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    page = request.args.get('page', 1, type=int)
    per_page = 20
    
    # Obter logs de atividade
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).paginate(page=page, per_page=per_page)
    
    return render_template('dashboard/activity_log.html', logs=logs)

@dashboard_bp.route('/api/stats/attendance')
@login_required
def api_stats_attendance():
    """API para obter estatísticas de frequência para gráficos."""
    period = request.args.get('period', 'week')
    
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    if period == 'day':
        labels = ['8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h']
        attendance_data = [85, 90, 92, 88, 75, 80, 85, 88, 85, 80]
    elif period == 'week':
        labels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
        attendance_data = [92, 88, 95, 91, 89]
    elif period == 'month':
        labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4']
        attendance_data = [90, 88, 92, 91]
    else:
        labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4']
        attendance_data = [90, 88, 92, 91]
    
    absence_data = [100 - a for a in attendance_data]
    
    return jsonify({
        'labels': labels,
        'attendance_data': attendance_data,
        'absence_data': absence_data
    })

@dashboard_bp.route('/api/stats/location')
@login_required
def api_stats_location():
    """API para obter estatísticas de localização para gráficos."""
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    return jsonify({
        'labels': ['Salas de Aula', 'Corredores', 'Banheiros', 'Pátio', 'Biblioteca', 'Cantina'],
        'data': [65, 10, 5, 12, 5, 3]
    })

@dashboard_bp.route('/api/stats/exits')
@login_required
def api_stats_exits():
    """API para obter estatísticas de saídas de sala para gráficos."""
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    return jsonify({
        'labels': ['0', '1', '2', '3', '4', '5+'],
        'data': [350, 80, 40, 20, 8, 2]
    })

@dashboard_bp.route('/api/stats/bathroom')
@login_required
def api_stats_bathroom():
    """API para obter estatísticas de visitas ao banheiro para gráficos."""
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    return jsonify({
        'labels': ['0', '1', '2', '3', '4', '5+'],
        'data': [380, 70, 30, 15, 4, 1]
    })
