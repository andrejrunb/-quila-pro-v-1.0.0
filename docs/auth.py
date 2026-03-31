"""
Rotas de autenticação para a interface web do Sistema Áquila

Este módulo contém as rotas relacionadas à autenticação de usuários,
incluindo login, logout, registro e recuperação de senha.
"""

import logging
from datetime import datetime
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_user, logout_user, login_required, current_user
from urllib.parse import urlparse

from models import db, User, UserSession, AuditLog

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.web_interface.routes.auth')

# Criar blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Rota para login de usuários."""
    # Redirecionar se já estiver logado
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = 'remember' in request.form
        
        # Validar campos
        if not username or not password:
            flash('Por favor, preencha todos os campos.', 'danger')
            return render_template('auth/login.html')
            
        # Buscar usuário
        user = User.query.filter_by(username=username).first()
        
        # Verificar usuário e senha
        if user is None or not user.check_password(password):
            flash('Nome de usuário ou senha incorretos.', 'danger')
            
            # Registrar tentativa de login inválida
            log = AuditLog(
                user_id=user.id if user else None,
                action='login_failed',
                ip_address=request.remote_addr,
                details=f"Tentativa de login para usuário: {username}"
            )
            db.session.add(log)
            db.session.commit()
            
            return render_template('auth/login.html')
            
        # Verificar se o usuário está ativo
        if not user.is_active:
            flash('Sua conta está desativada. Entre em contato com o administrador.', 'danger')
            return render_template('auth/login.html')
            
        # Login bem-sucedido
        login_user(user, remember=remember)
        
        # Atualizar último login
        user.last_login = datetime.utcnow()
        
        # Registrar sessão
        session = UserSession(
            user_id=user.id,
            session_id=request.cookies.get('session', 'unknown'),
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string
        )
        
        # Registrar login bem-sucedido
        log = AuditLog(
            user_id=user.id,
            action='login_success',
            ip_address=request.remote_addr,
            details=f"Login bem-sucedido para usuário: {username}"
        )
        
        db.session.add(session)
        db.session.add(log)
        db.session.commit()
        
        # Redirecionar para a página solicitada ou para o dashboard
        next_page = request.args.get('next')
        if not next_page or urlparse(next_page).netloc:
            next_page = url_for('dashboard.index')
            
        flash('Login realizado com sucesso!', 'success')
        return redirect(next_page)
        
    return render_template('auth/login.html')
    
@auth_bp.route('/logout')
@login_required
def logout():
    """Rota para logout de usuários."""
    # Registrar logout
    log = AuditLog(
        user_id=current_user.id,
        action='logout',
        ip_address=request.remote_addr,
        details=f"Logout para usuário: {current_user.username}"
    )
    
    # Atualizar sessão
    session = UserSession.query.filter_by(
        user_id=current_user.id,
        session_id=request.cookies.get('session', 'unknown'),
        is_active=True
    ).first()
    
    if session:
        session.is_active = False
        session.last_activity = datetime.utcnow()
        
    db.session.add(log)
    db.session.commit()
    
    logout_user()
    flash('Você foi desconectado com sucesso.', 'success')
    return redirect(url_for('auth.login'))
    
@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Rota para registro de novos usuários."""
    # Verificar se o registro está habilitado
    if not current_app.config.get('REGISTRATION_ENABLED', False):
        flash('O registro de novos usuários está desabilitado.', 'danger')
        return redirect(url_for('auth.login'))
        
    # Redirecionar se já estiver logado
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        name = request.form.get('name')
        
        # Validar campos
        if not username or not email or not password or not confirm_password or not name:
            flash('Por favor, preencha todos os campos.', 'danger')
            return render_template('auth/register.html')
            
        if password != confirm_password:
            flash('As senhas não coincidem.', 'danger')
            return render_template('auth/register.html')
            
        # Verificar se o usuário já existe
        if User.query.filter_by(username=username).first():
            flash('Este nome de usuário já está em uso.', 'danger')
            return render_template('auth/register.html')
            
        # Verificar se o email já existe
        if User.query.filter_by(email=email).first():
            flash('Este e-mail já está em uso.', 'danger')
            return render_template('auth/register.html')
            
        # Criar novo usuário
        user = User(
            username=username,
            email=email,
            name=name,
            role='user'  # Papel padrão
        )
        user.set_password(password)
        
        # Registrar criação de usuário
        log = AuditLog(
            action='user_created',
            entity_type='user',
            entity_id=username,
            ip_address=request.remote_addr,
            details=f"Novo usuário registrado: {username}"
        )
        
        db.session.add(user)
        db.session.add(log)
        db.session.commit()
        
        flash('Registro realizado com sucesso! Agora você pode fazer login.', 'success')
        return redirect(url_for('auth.login'))
        
    return render_template('auth/register.html')
    
@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """Rota para recuperação de senha."""
    # Redirecionar se já estiver logado
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))
        
    if request.method == 'POST':
        email = request.form.get('email')
        
        # Validar campos
        if not email:
            flash('Por favor, informe seu e-mail.', 'danger')
            return render_template('auth/forgot_password.html')
            
        # Buscar usuário
        user = User.query.filter_by(email=email).first()
        
        if user:
            # Em um sistema real, enviaríamos um e-mail com instruções
            # Para este protótipo, apenas registramos a solicitação
            log = AuditLog(
                user_id=user.id,
                action='password_reset_requested',
                ip_address=request.remote_addr,
                details=f"Solicitação de redefinição de senha para: {email}"
            )
            db.session.add(log)
            db.session.commit()
            
        # Sempre mostrar a mesma mensagem para evitar enumeração de usuários
        flash('Se o e-mail estiver registrado, você receberá instruções para redefinir sua senha.', 'info')
        return redirect(url_for('auth.login'))
        
    return render_template('auth/forgot_password.html')
    
@auth_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    """Rota para visualização e edição do perfil do usuário."""
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
        
        # Validar campos
        if not name or not email:
            flash('Nome e e-mail são obrigatórios.', 'danger')
            return render_template('auth/profile.html')
            
        # Verificar se o email já está em uso por outro usuário
        if email != current_user.email and User.query.filter_by(email=email).first():
            flash('Este e-mail já está em uso por outro usuário.', 'danger')
            return render_template('auth/profile.html')
            
        # Atualizar informações básicas
        current_user.name = name
        current_user.email = email
        
        # Atualizar senha se fornecida
        if current_password and new_password and confirm_password:
            if not current_user.check_password(current_password):
                flash('Senha atual incorreta.', 'danger')
                return render_template('auth/profile.html')
                
            if new_password != confirm_password:
                flash('As novas senhas não coincidem.', 'danger')
                return render_template('auth/profile.html')
                
            current_user.set_password(new_password)
            
            # Registrar alteração de senha
            log = AuditLog(
                user_id=current_user.id,
                action='password_changed',
                ip_address=request.remote_addr,
                details=f"Senha alterada para usuário: {current_user.username}"
            )
            db.session.add(log)
            
        # Registrar atualização de perfil
        log = AuditLog(
            user_id=current_user.id,
            action='profile_updated',
            ip_address=request.remote_addr,
            details=f"Perfil atualizado para usuário: {current_user.username}"
        )
        
        db.session.add(log)
        db.session.commit()
        
        flash('Perfil atualizado com sucesso!', 'success')
        return redirect(url_for('auth.profile'))
        
    return render_template('auth/profile.html')
