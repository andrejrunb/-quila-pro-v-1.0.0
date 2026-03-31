"""
Rotas para configurações do sistema na interface web do Sistema Áquila

Este módulo contém as rotas relacionadas às configurações do sistema,
incluindo configurações gerais, usuários e notificações.
"""

import logging
import os
from datetime import datetime
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash

from models import db, User, SystemSettings, NotificationPreference, AuditLog

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.web_interface.routes.settings')

# Criar blueprint
settings_bp = Blueprint('settings', __name__, url_prefix='/settings')

@settings_bp.route('/')
@login_required
def index():
    """Rota para página principal de configurações."""
    # Verificar permissões
    if not current_user.is_admin():
        flash('Você não tem permissão para acessar as configurações do sistema.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    # Obter configurações do sistema
    settings = SystemSettings.query.all()
    
    # Agrupar configurações por categoria
    general_settings = []
    notification_settings = []
    security_settings = []
    
    for setting in settings:
        if setting.key.startswith('notification_'):
            notification_settings.append(setting)
        elif setting.key.startswith('security_'):
            security_settings.append(setting)
        else:
            general_settings.append(setting)
    
    return render_template('settings/index.html',
                          general_settings=general_settings,
                          notification_settings=notification_settings,
                          security_settings=security_settings)

@settings_bp.route('/update', methods=['POST'])
@login_required
def update():
    """Rota para atualização de configurações do sistema."""
    # Verificar permissões
    if not current_user.is_admin():
        flash('Você não tem permissão para atualizar as configurações do sistema.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    # Obter dados do formulário
    for key, value in request.form.items():
        if key.startswith('setting_'):
            setting_key = key.replace('setting_', '')
            
            # Buscar configuração
            setting = SystemSettings.query.filter_by(key=setting_key).first()
            
            if setting and setting.value != value:
                # Atualizar valor
                old_value = setting.value
                setting.value = value
                setting.updated_by = current_user.id
                
                # Registrar alteração
                log = AuditLog(
                    user_id=current_user.id,
                    action='setting_updated',
                    entity_type='system_setting',
                    entity_id=setting_key,
                    ip_address=request.remote_addr,
                    details=f"Configuração '{setting_key}' alterada de '{old_value}' para '{value}'"
                )
                db.session.add(log)
    
    db.session.commit()
    flash('Configurações atualizadas com sucesso!', 'success')
    return redirect(url_for('settings.index'))

@settings_bp.route('/users')
@login_required
def users():
    """Rota para gerenciamento de usuários."""
    # Verificar permissões
    if not current_user.is_admin():
        flash('Você não tem permissão para gerenciar usuários.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    # Obter parâmetros de filtro
    role_filter = request.args.get('role', '')
    status_filter = request.args.get('status', '')
    search = request.args.get('search', '')
    
    # Construir consulta
    query = User.query
    
    if role_filter:
        query = query.filter_by(role=role_filter)
        
    if status_filter:
        is_active = status_filter == 'active'
        query = query.filter_by(is_active=is_active)
        
    if search:
        query = query.filter(
            (User.username.ilike(f'%{search}%')) |
            (User.email.ilike(f'%{search}%')) |
            (User.name.ilike(f'%{search}%'))
        )
    
    # Executar consulta
    users = query.order_by(User.username).all()
    
    return render_template('settings/users.html',
                          users=users,
                          role_filter=role_filter,
                          status_filter=status_filter,
                          search=search)

@settings_bp.route('/users/new', methods=['GET', 'POST'])
@login_required
def new_user():
    """Rota para criação de novo usuário."""
    # Verificar permissões
    if not current_user.is_admin():
        flash('Você não tem permissão para criar usuários.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    if request.method == 'POST':
        # Obter dados do formulário
        username = request.form.get('username')
        email = request.form.get('email')
        name = request.form.get('name')
        role = request.form.get('role')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Validar campos obrigatórios
        if not username or not email or not name or not role or not password or not confirm_password:
            flash('Por favor, preencha todos os campos obrigatórios.', 'danger')
            return render_template('settings/new_user.html')
            
        if password != confirm_password:
            flash('As senhas não coincidem.', 'danger')
            return render_template('settings/new_user.html')
            
        # Verificar se o usuário já existe
        if User.query.filter_by(username=username).first():
            flash('Este nome de usuário já está em uso.', 'danger')
            return render_template('settings/new_user.html')
            
        # Verificar se o email já existe
        if User.query.filter_by(email=email).first():
            flash('Este e-mail já está em uso.', 'danger')
            return render_template('settings/new_user.html')
            
        # Criar novo usuário
        user = User(
            username=username,
            email=email,
            name=name,
            role=role
        )
        user.set_password(password)
        
        # Registrar criação de usuário
        log = AuditLog(
            user_id=current_user.id,
            action='user_created',
            entity_type='user',
            entity_id=username,
            ip_address=request.remote_addr,
            details=f"Novo usuário criado: {username} (papel: {role})"
        )
        
        db.session.add(user)
        db.session.add(log)
        db.session.commit()
        
        flash(f'Usuário {username} criado com sucesso!', 'success')
        return redirect(url_for('settings.users'))
    
    return render_template('settings/new_user.html')

@settings_bp.route('/users/edit/<int:user_id>', methods=['GET', 'POST'])
@login_required
def edit_user(user_id):
    """Rota para edição de usuário."""
    # Verificar permissões
    if not current_user.is_admin():
        flash('Você não tem permissão para editar usuários.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    # Buscar usuário
    user = User.query.get_or_404(user_id)
    
    if request.method == 'POST':
        # Obter dados do formulário
        email = request.form.get('email')
        name = request.form.get('name')
        role = request.form.get('role')
        is_active = 'is_active' in request.form
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Validar campos obrigatórios
        if not email or not name or not role:
            flash('Por favor, preencha todos os campos obrigatórios.', 'danger')
            return render_template('settings/edit_user.html', user=user)
            
        # Verificar se o email já está em uso por outro usuário
        if email != user.email and User.query.filter_by(email=email).first():
            flash('Este e-mail já está em uso por outro usuário.', 'danger')
            return render_template('settings/edit_user.html', user=user)
            
        # Atualizar dados do usuário
        user.email = email
        user.name = name
        user.role = role
        user.is_active = is_active
        
        # Atualizar senha se fornecida
        if password and confirm_password:
            if password != confirm_password:
                flash('As senhas não coincidem.', 'danger')
                return render_template('settings/edit_user.html', user=user)
                
            user.set_password(password)
        
        # Registrar edição de usuário
        log = AuditLog(
            user_id=current_user.id,
            action='user_updated',
            entity_type='user',
            entity_id=user.username,
            ip_address=request.remote_addr,
            details=f"Usuário atualizado: {user.username} (papel: {role}, ativo: {is_active})"
        )
        
        db.session.add(log)
        db.session.commit()
        
        flash(f'Usuário {user.username} atualizado com sucesso!', 'success')
        return redirect(url_for('settings.users'))
    
    return render_template('settings/edit_user.html', user=user)

@settings_bp.route('/users/delete/<int:user_id>', methods=['POST'])
@login_required
def delete_user(user_id):
    """Rota para exclusão de usuário."""
    # Verificar permissões
    if not current_user.is_admin():
        flash('Você não tem permissão para excluir usuários.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    # Buscar usuário
    user = User.query.get_or_404(user_id)
    
    # Impedir exclusão do próprio usuário
    if user.id == current_user.id:
        flash('Você não pode excluir seu próprio usuário.', 'danger')
        return redirect(url_for('settings.users'))
    
    # Impedir exclusão do usuário admin padrão
    if user.username == 'admin':
        flash('O usuário admin padrão não pode ser excluído.', 'danger')
        return redirect(url_for('settings.users'))
    
    # Registrar exclusão de usuário
    log = AuditLog(
        user_id=current_user.id,
        action='user_deleted',
        entity_type='user',
        entity_id=user.username,
        ip_address=request.remote_addr,
        details=f"Usuário excluído: {user.username}"
    )
    
    # Excluir usuário
    db.session.delete(user)
    db.session.add(log)
    db.session.commit()
    
    flash(f'Usuário {user.username} excluído com sucesso!', 'success')
    return redirect(url_for('settings.users'))

@settings_bp.route('/notifications')
@login_required
def notifications():
    """Rota para configurações de notificações."""
    # Obter preferências de notificação do usuário
    preferences = NotificationPreference.query.filter_by(user_id=current_user.id).all()
    
    # Se não existirem preferências, criar padrões
    if not preferences:
        default_types = ['email', 'app', 'sms']
        
        for notification_type in default_types:
            preference = NotificationPreference(
                user_id=current_user.id,
                notification_type=notification_type,
                enabled=True
            )
            db.session.add(preference)
            
        db.session.commit()
        
        # Recarregar preferências
        preferences = NotificationPreference.query.filter_by(user_id=current_user.id).all()
    
    return render_template('settings/notifications.html', preferences=preferences)

@settings_bp.route('/notifications/update', methods=['POST'])
@login_required
def update_notifications():
    """Rota para atualização de preferências de notificação."""
    # Obter preferências de notificação do usuário
    preferences = NotificationPreference.query.filter_by(user_id=current_user.id).all()
    
    # Atualizar preferências
    for preference in preferences:
        enabled = f'notification_{preference.notification_type}' in request.form
        
        if preference.enabled != enabled:
            preference.enabled = enabled
            preference.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    flash('Preferências de notificação atualizadas com sucesso!', 'success')
    return redirect(url_for('settings.notifications'))

@settings_bp.route('/system')
@login_required
def system():
    """Rota para informações do sistema."""
    # Verificar permissões
    if not current_user.is_admin():
        flash('Você não tem permissão para acessar as informações do sistema.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    # Obter informações do sistema
    system_info = {
        'version': '1.0.0',
        'uptime': '3 dias, 5 horas, 12 minutos',
        'last_update': datetime.now() - timedelta(days=3),
        'database_size': '256 MB',
        'storage_usage': '1.2 GB / 10 GB',
        'memory_usage': '512 MB / 2 GB',
        'cpu_usage': '15%',
        'active_users': 5,
        'total_students': 500,
        'total_classes': 20
    }
    
    # Obter logs recentes
    recent_logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(20).all()
    
    return render_template('settings/system.html', 
                          system_info=system_info,
                          recent_logs=recent_logs)

@settings_bp.route('/backup', methods=['GET', 'POST'])
@login_required
def backup():
    """Rota para backup e restauração do sistema."""
    # Verificar permissões
    if not current_user.is_admin():
        flash('Você não tem permissão para gerenciar backups do sistema.', 'danger')
        return redirect(url_for('dashboard.index'))
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'backup':
            # Em um sistema real, realizaríamos o backup
            # Para este protótipo, apenas simulamos a operação
            
            # Registrar ação
            log = AuditLog(
                user_id=current_user.id,
                action='system_backup',
                ip_address=request.remote_addr,
                details=f"Backup do sistema realizado"
            )
            db.session.add(log)
            db.session.commit()
            
            flash('Backup do sistema realizado com sucesso!', 'success')
            
        elif action == 'restore':
            # Verificar se o arquivo foi enviado
            if 'backup_file' not in request.files:
                flash('Nenhum arquivo de backup selecionado.', 'danger')
                return redirect(url_for('settings.backup'))
                
            file = request.files['backup_file']
            
            if file.filename == '':
                flash('Nenhum arquivo de backup selecionado.', 'danger')
                return redirect(url_for('settings.backup'))
                
            # Em um sistema real, realizaríamos a restauração
            # Para este protótipo, apenas simulamos a operação
            
            # Registrar ação
            log = AuditLog(
                user_id=current_user.id,
                action='system_restore',
                ip_address=request.remote_addr,
                details=f"Restauração do sistema a partir do arquivo: {file.filename}"
            )
            db.session.add(log)
            db.session.commit()
            
            flash('Restauração do sistema realizada com sucesso!', 'success')
    
    # Lista de backups disponíveis
    backups = [
        {
            'id': 1,
            'filename': 'backup_20250401_120000.zip',
            'size': '1.5 GB',
            'created_at': datetime.now() - timedelta(days=1),
            'created_by': 'ad
