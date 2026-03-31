"""
Modelos de dados para a interface web do Sistema Áquila

Este módulo contém os modelos de dados utilizados pela interface web,
incluindo usuários, configurações e outras entidades necessárias.
"""

import logging
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

# Inicializar SQLAlchemy
db = SQLAlchemy()

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.web_interface.models')

class User(UserMixin, db.Model):
    """Modelo para usuários do sistema."""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')  # admin, coordinator, director, user
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    def set_password(self, password):
        """Define a senha do usuário."""
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        """Verifica a senha do usuário."""
        return check_password_hash(self.password_hash, password)
        
    def is_admin(self):
        """Verifica se o usuário é administrador."""
        return self.role == 'admin'
        
    def __repr__(self):
        return f'<User {self.username}>'
        
class SystemSettings(db.Model):
    """Modelo para configurações do sistema."""
    
    __tablename__ = 'system_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)
    description = db.Column(db.String(256), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    def __repr__(self):
        return f'<SystemSettings {self.key}>'
        
class NotificationPreference(db.Model):
    """Modelo para preferências de notificação dos usuários."""
    
    __tablename__ = 'notification_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notification_type = db.Column(db.String(64), nullable=False)  # email, sms, app, etc.
    enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamento com usuário
    user = db.relationship('User', backref=db.backref('notification_preferences', lazy=True))
    
    def __repr__(self):
        return f'<NotificationPreference {self.user_id} {self.notification_type}>'
        
class AuditLog(db.Model):
    """Modelo para registro de auditoria de ações no sistema."""
    
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(64), nullable=False)
    entity_type = db.Column(db.String(64), nullable=True)
    entity_id = db.Column(db.String(64), nullable=True)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento com usuário
    user = db.relationship('User', backref=db.backref('audit_logs', lazy=True))
    
    def __repr__(self):
        return f'<AuditLog {self.action} by {self.user_id}>'
        
class SavedReport(db.Model):
    """Modelo para relatórios salvos pelos usuários."""
    
    __tablename__ = 'saved_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    report_type = db.Column(db.String(64), nullable=False)  # student, class, at_risk, etc.
    report_name = db.Column(db.String(128), nullable=False)
    file_path = db.Column(db.String(256), nullable=False)
    entity_id = db.Column(db.String(64), nullable=True)  # ID do aluno ou turma, se aplicável
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamento com usuário
    user = db.relationship('User', backref=db.backref('saved_reports', lazy=True))
    
    def __repr__(self):
        return f'<SavedReport {self.report_name}>'
        
class UserSession(db.Model):
    """Modelo para sessões de usuário."""
    
    __tablename__ = 'user_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_id = db.Column(db.String(128), nullable=False, unique=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(256), nullable=True)
    login_timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relacionamento com usuário
    user = db.relationship('User', backref=db.backref('sessions', lazy=True))
    
    def __repr__(self):
        return f'<UserSession {self.user_id}>'
        
def init_system_settings():
    """
    Inicializa as configurações padrão do sistema.
    
    Returns:
        bool: True se as configurações foram inicializadas com sucesso.
    """
    try:
        # Definir configurações padrão
        default_settings = [
            {
                'key': 'system_name',
                'value': 'Áquila',
                'description': 'Nome do sistema'
            },
            {
                'key': 'notification_email_enabled',
                'value': 'true',
                'description': 'Habilitar notificações por e-mail'
            },
            {
                'key': 'attendance_threshold',
                'value': '75',
                'description': 'Limiar de frequência para alertas (%)'
            },
            {
                'key': 'max_bathroom_visits',
                'value': '3',
                'description': 'Número máximo de visitas ao banheiro por dia'
            },
            {
                'key': 'max_class_exits',
                'value': '2',
                'description': 'Número máximo de saídas de sala por dia'
            },
            {
                'key': 'report_retention_days',
                'value': '90',
                'description': 'Dias para retenção de relatórios'
            }
        ]
        
        # Adicionar configurações se não existirem
        for setting in default_settings:
            if not SystemSettings.query.filter_by(key=setting['key']).first():
                new_setting = SystemSettings(
                    key=setting['key'],
                    value=setting['value'],
                    description=setting['description']
                )
                db.session.add(new_setting)
                
        db.session.commit()
        logger.info("Configurações do sistema inicializadas")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao inicializar configurações do sistema: {str(e)}")
        db.session.rollback()
        return False
