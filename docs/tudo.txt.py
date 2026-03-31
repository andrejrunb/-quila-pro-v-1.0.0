"""
Módulo de inicialização da interface web para o Sistema Áquila

Este módulo contém a aplicação Flask principal e as configurações
para a interface web do sistema.
"""

import os
import logging
from datetime import datetime
from flask import Flask, render_template, redirect, url_for, flash, request, jsonify, send_from_directory
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_wtf.csrf import CSRFProtect

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.web_interface')

def create_app(config=None):
    """
    Cria e configura a aplicação Flask.
    
    Args:
        config (dict, opcional): Configurações adicionais.
        
    Returns:
        Flask: Aplicação Flask configurada.
    """
    # Criar aplicação Flask
    app = Flask(__name__, 
                template_folder=os.path.join(os.path.dirname(__file__), 'templates'),
                static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    
    # Configurações padrão
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'aquila-secret-key-dev'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URI', 'sqlite:///aquila.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        UPLOAD_FOLDER=os.path.join(os.path.dirname(__file__), 'uploads'),
        REPORTS_FOLDER=os.path.join(os.path.dirname(__file__), 'reports'),
        MAX_CONTENT_LENGTH=16 * 1024 * 1024  # 16 MB max upload
    )
    
    # Aplicar configurações adicionais
    if config:
        app.config.update(config)
        
    # Criar diretórios necessários
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['REPORTS_FOLDER'], exist_ok=True)
    
    # Inicializar proteção CSRF
    csrf = CSRFProtect(app)
    
    # Inicializar gerenciador de login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Por favor, faça login para acessar esta página.'
    
    # Importar e registrar blueprints
    from .routes.auth import auth_bp
    from .routes.dashboard import dashboard_bp
    from .routes.students import students_bp
    from .routes.classes import classes_bp
    from .routes.reports import reports_bp
    from .routes.settings import settings_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(classes_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(settings_bp)
    
    # Configurar função de carregamento de usuário
    from .models import User
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
        
    # Configurar tratamento de erros
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('errors/404.html'), 404
        
    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('errors/500.html'), 500
        
    # Rota raiz
    @app.route('/')
    def index():
        return redirect(url_for('dashboard.index'))
        
    # Rota para verificação de saúde da aplicação
    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'ok',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0'
        })
        
    # Rota para servir arquivos de relatório
    @app.route('/reports/<path:filename>')
    @login_required
    def serve_report(filename):
        return send_from_directory(app.config['REPORTS_FOLDER'], filename)
        
    logger.info("Aplicação Flask inicializada")
    return app
    
def init_db(app):
    """
    Inicializa o banco de dados da aplicação.
    
    Args:
        app (Flask): Aplicação Flask.
        
    Returns:
        SQLAlchemy: Instância do banco de dados.
    """
    from .models import db
    
    with app.app_context():
        db.init_app(app)
        db.create_all()
        
        # Criar usuário admin se não existir
        from .models import User
        if not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin',
                email='admin@aquila.com',
                name='Administrador',
                role='admin'
            )
            admin.set_password('admin123')  # Senha temporária para desenvolvimento
            db.session.add(admin)
            db.session.commit()
            logger.info("Usuário admin criado")
            
    logger.info("Banco de dados inicializado")
    return db
    
def run_app(host='0.0.0.0', port=5000, debug=False):
    """
    Executa a aplicação Flask.
    
    Args:
        host (str): Host para executar a aplicação.
        port (int): Porta para executar a aplicação.
        debug (bool): Modo de depuração.
        
    Returns:
        None
    """
    app = create_app()
    db = init_db(app)
    
    logger.info(f"Iniciando aplicação em {host}:{port} (debug={debug})")
    app.run(host=host, port=port, debug=debug)
    
if __name__ == '__main__':
    run_app(debug=True)
"""
Rotas de autenticação para a interface web do Sistema Áquila

Este módulo contém as rotas relacionadas à autenticação de usuários,
incluindo login, logout, registro e recuperação de senha.
"""

import logging
from datetime import datetime
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.urls import url_parse

from ..models import db, User, UserSession, AuditLog

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
        if not next_page or url_parse(next_page).netloc != '':
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
import cv2
import threading
import time
import logging
from ..facial_recognition.facial_recognition_system import FacialRecognitionSystem

# Configuração de logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class CameraManager:
    def __init__(self, camera_config, facial_recognition_system=None):
        self.camera_config = camera_config
        self.cameras = {}
        self.running = False
        self.frame_buffers = {}
        self.lock = threading.Lock()
        self.facial_recognition_system = facial_recognition_system

    def _capture_stream(self, camera_id, rtsp_url):
        logging.info(f"Iniciando captura para a câmera {camera_id} em {rtsp_url}")
        cap = cv2.VideoCapture(rtsp_url)

        if not cap.isOpened():
            logging.error(f"Erro: Não foi possível abrir o stream RTSP para a câmera {camera_id} em {rtsp_url}")
            return

        while self.running:
            ret, frame = cap.read()
            if not ret:
                logging.warning(f"Erro: Não foi possível ler o frame da câmera {camera_id}. Tentando reconectar...")
                cap.release()
                cap = cv2.VideoCapture(rtsp_url)
                if not cap.isOpened():
                    logging.error(f"Erro: Falha na reconexão da câmera {camera_id}.")
                    break
                time.sleep(5) # Espera antes de tentar novamente
                continue

            with self.lock:
                self.frame_buffers[camera_id] = frame
            
            # Se houver um sistema de reconhecimento facial, processar o frame
            if self.facial_recognition_system:
                results = self.facial_recognition_system.process_frame(frame)
                # Aqui você pode fazer algo com os resultados, como enviar para um banco de dados
                # ou para um módulo de presença.
                # Exemplo: logging.debug(f"Câmera {camera_id}: {results}")

            # Pequena pausa para evitar consumo excessivo de CPU
            time.sleep(0.01)

        cap.release()
        logging.info(f"Captura para a câmera {camera_id} encerrada.")

    def start_cameras(self):
        self.running = True
        for cam_id, cam_info in self.camera_config.items():
            rtsp_url = cam_info["rtsp_url"]
            thread = threading.Thread(target=self._capture_stream, args=(cam_id, rtsp_url))
            thread.daemon = True
            thread.start()
            self.cameras[cam_id] = thread
        logging.info("Todas as câmeras iniciadas.")

    def stop_cameras(self):
        self.running = False
        for cam_id, thread in self.cameras.items():
            if thread.is_alive():
                thread.join(timeout=5) # Espera a thread terminar
                if thread.is_alive():
                    logging.warning(f"Thread da câmera {cam_id} não encerrou. Pode haver recursos pendentes.")
        logging.info("Todas as câmeras paradas.")

    def get_latest_frame(self, camera_id):
        with self.lock:
            return self.frame_buffers.get(camera_id, None)

    def list_active_cameras(self):
        return list(self.cameras.keys())

if __name__ == '__main__':
    # Exemplo de configuração de câmeras
    camera_configurations = {
        "camera_sala_1": {
            "rtsp_url": "rtsp://admin:admin123@192.168.1.100:554/stream1",
            "location": "Sala 101"
        },
        "camera_entrada": {
            "rtsp_url": "rtsp://user:pass@192.168.1.101:554/live/ch0",
            "location": "Entrada Principal"
        }
    }

    print("\n--- Teste do CameraManager com Reconhecimento Facial (Simulado) ---")
    print("Por favor, certifique-se de que as URLs RTSP no script são válidas para suas câmeras IP.")
    print("Este teste simula a captura de streams de vídeo e o processamento por um sistema de RF.")
    print("Pressione Ctrl+C para parar.")

    # Inicializa o sistema de reconhecimento facial (simulado para este exemplo)
    # Em um cenário real, você carregaria um modelo treinado e um dataset de faces.
    fr_system = FacialRecognitionSystem() # Instancia o sistema de RF
    # fr_system.load_known_faces("./dataset_example") # Carregue seu dataset real
    # fr_system.train_recognizer() # Treine o reconhecedor se necessário

    manager = CameraManager(camera_configurations, facial_recognition_system=fr_system)
    manager.start_cameras()

    try:
        while True:
            for cam_id in manager.list_active_cameras():
                frame = manager.get_latest_frame(cam_id)
                if frame is not None:
                    # Os resultados do reconhecimento facial já estão sendo processados dentro de _capture_stream
                    # Aqui você pode adicionar lógica para exibir o frame com os resultados, se desejar
                    # frame_with_results = fr_system.draw_recognition_results(frame.copy(), fr_system.process_frame(frame))
                    # cv2.imshow(f"Câmera {cam_id}", frame_with_results) # Descomente para visualizar
                    pass
            time.sleep(1) # Simula o processamento em tempo real

    except KeyboardInterrupt:
        print("\nInterrupção pelo usuário. Parando câmeras...")
    finally:
        manager.stop_cameras()
        print("Teste do CameraManager finalizado.")
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

from ..models import db, AuditLog, SavedReport

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
(Content truncated due to size limit. Use line ranges to read in chunks)"""
Rotas do painel de controle para a interface web do Sistema Áquila

Este módulo contém as rotas relacionadas ao painel de controle principal,
incluindo visão geral do sistema e estatísticas.
"""

import logging
from datetime import datetime, timedelta
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user

from ..models import db, User, AuditLog, SavedReport

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
import cv2

class FaceDetector:
    def __init__(self, cascade_path="haarcascade_frontalface_default.xml"):
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + cascade_path)
        if self.face_cascade.empty():
            raise IOError(f"Não foi possível carregar o arquivo cascade: {cascade_path}")

    def detect_faces(self, frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=scaleFactor, minNeighbors=minNeighbors, minSize=minSize)
        return faces

    def draw_faces(self, frame, faces):
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
        return frame

if __name__ == '__main__':
    # Exemplo de uso do FaceDetector
    cap = cv2.VideoCapture(0) # Usar 0 para webcam, ou um caminho de vídeo

    if not cap.isOpened():
        print("Erro: Não foi possível abrir a câmera.")
    else:
        detector = FaceDetector()
        print("Pressione 'q' para sair.")
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Erro: Não foi possível ler o frame.")
                break

            faces = detector.detect_faces(frame)
            frame_with_faces = detector.draw_faces(frame, faces)

            cv2.imshow('Face Detection', frame_with_faces)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()
import cv2
import numpy as np
import os

class FaceRecognizer:
    def __init__(self, recognizer_type='LBPH', model_path=None):
        if recognizer_type == 'LBPH':
            self.recognizer = cv2.face.LBPHFaceRecognizer_create()
        elif recognizer_type == 'Eigen':
            self.recognizer = cv2.face.EigenFaceRecognizer_create()
        elif recognizer_type == 'Fisher':
            self.recognizer = cv2.face.FisherFaceRecognizer_create()
        else:
            raise ValueError('Tipo de reconhecedor não suportado. Escolha entre LBPH, Eigen ou Fisher.')
        
        self.model_path = model_path
        self.labels = {}
        self.next_label_id = 0

        if self.model_path and os.path.exists(self.model_path):
            self.recognizer.read(self.model_path)
            # Carregar labels se existirem (LBPH não armazena labels diretamente)
            # Para um sistema real, você precisaria de um mapeamento de ID para nome em um DB
            print(f"Modelo de reconhecimento carregado de {self.model_path}")

    def train(self, faces, labels):
        if not faces or not labels:
            print("Nenhum dado para treinamento.")
            return
        
        # Mapear labels de string para IDs numéricos
        numeric_labels = []
        for label in labels:
            if label not in self.labels:
                self.labels[label] = self.next_label_id
                self.next_label_id += 1
            numeric_labels.append(self.labels[label])

        self.recognizer.train(faces, np.array(numeric_labels))
        print("Modelo de reconhecimento treinado com sucesso.")
        if self.model_path:
            self.recognizer.write(self.model_path)
            print(f"Modelo salvo em {self.model_path}")

    def recognize(self, face_image):
        if self.recognizer.empty():
            return "Desconhecido", 0.0
        
        label_id, confidence = self.recognizer.predict(face_image)
        
        # Mapear ID numérico de volta para label de string
        recognized_label = "Desconhecido"
        for label_name, lid in self.labels.items():
            if lid == label_id:
                recognized_label = label_name
                break
        
        return recognized_label, confidence

    def get_label_map(self):
        return {v: k for k, v in self.labels.items()}

if __name__ == '__main__':
    # Exemplo de uso do FaceRecognizer
    # Este é um exemplo simplificado. Em um cenário real, você teria um dataset de imagens.
    
    # 1. Preparar dados de treinamento (simulados)
    # Criar algumas imagens de rosto de exemplo (apenas para demonstração)
    # Em um cenário real, você usaria o FaceDetector para extrair rostos de imagens de treinamento.
    faces_data = []
    labels_data = []

    # Rosto 1: Alice
    img_alice1 = np.zeros((100, 100), dtype=np.uint8)
    cv2.putText(img_alice1, 'Alice', (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 255, 2)
    faces_data.append(img_alice1)
    labels_data.append('Alice')

    img_alice2 = np.zeros((100, 100), dtype=np.uint8)
    cv2.putText(img_alice2, 'Alice', (15, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.7, 255, 2)
    faces_data.append(img_alice2)
    labels_data.append('Alice')

    # Rosto 2: Bob
    img_bob1 = np.zeros((100, 100), dtype=np.uint8)
    cv2.putText(img_bob1, 'Bob', (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 255, 2)
    faces_data.append(img_bob1)
    labels_data.append('Bob')

    img_bob2 = np.zeros((100, 100), dtype=np.uint8)
    cv2.putText(img_bob2, 'Bob', (15, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.7, 255, 2)
    faces_data.append(img_bob2)
    labels_data.append('Bob')

    # 2. Inicializar e treinar o reconhecedor
    model_file = 'aquila_face_model.yml'
    recognizer = FaceRecognizer(recognizer_type='LBPH', model_path=model_file)
    recognizer.train(faces_data, labels_data)

    # 3. Testar reconhecimento
    print("\n--- Testando Reconhecimento ---")
    test_face_alice = np.zeros((100, 100), dtype=np.uint8)
    cv2.putText(test_face_alice, 'Alice', (12, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.75, 255, 2)
    name, conf = recognizer.recognize(test_face_alice)
    print(f"Rosto de teste (Alice): Reconhecido como {name} com confiança {conf:.2f}")

    test_face_charlie = np.zeros((100, 100), dtype=np.uint8)
    cv2.putText(test_face_charlie, 'Charlie', (5, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 255, 2)
    name, conf = recognizer.recognize(test_face_charlie)
    print(f"Rosto de teste (Charlie - Desconhecido): Reconhecido como {name} com confiança {conf:.2f}")

    # Limpar arquivo de modelo após o teste
    if os.path.exists(model_file):
        os.remove(model_file)
import cv2
import numpy as np
from .face_detector import FaceDetector
from .face_recognizer import FaceRecognizer
import os
import time
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class FacialRecognitionSystem:
    def __init__(self, model_path="aquila_face_model.yml", recognizer_type="LBPH"):
        self.face_detector = FaceDetector()
        self.face_recognizer = FaceRecognizer(recognizer_type=recognizer_type, model_path=model_path)
        self.known_faces = []
        self.known_names = []
        self.model_path = model_path

    def load_known_faces(self, dataset_path="./dataset"):
        logging.info(f"Carregando faces conhecidas do dataset: {dataset_path}")
        if not os.path.exists(dataset_path):
            logging.warning(f"Dataset path {dataset_path} não encontrado. Crie um dataset para treinar o reconhecedor.")
            return

        faces = []
        names = []
        for name_dir in os.listdir(dataset_path):
            person_path = os.path.join(dataset_path, name_dir)
            if os.path.isdir(person_path):
                for img_name in os.listdir(person_path):
                    img_path = os.path.join(person_path, img_name)
                    img = cv2.imread(img_path)
                    if img is None:
                        logging.warning(f"Não foi possível carregar a imagem: {img_path}")
                        continue
                    
                    # Converter para escala de cinza para o reconhecedor LBPH
                    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    
                    # Detectar faces na imagem de treinamento
                    detected_faces = self.face_detector.detect_faces(img)
                    if len(detected_faces) == 1:
                        (x, y, w, h) = detected_faces[0]
                        face_roi = gray_img[y:y+h, x:x+w]
                        # Redimensionar para um tamanho padrão para o reconhecedor
                        face_roi = cv2.resize(face_roi, (100, 100))
                        faces.append(face_roi)
                        names.append(name_dir)
                    elif len(detected_faces) > 1:
                        logging.warning(f"Múltiplas faces detectadas na imagem de treinamento {img_path}. Ignorando.")
                    else:
                        logging.warning(f"Nenhuma face detectada na imagem de treinamento {img_path}. Ignorando.")
        
        self.known_faces = faces
        self.known_names = names
        logging.info(f"{len(self.known_faces)} faces carregadas para treinamento.")

    def train_recognizer(self):
        if self.known_faces and self.known_names:
            self.face_recognizer.train(self.known_faces, self.known_names)
            logging.info("Reconhecedor facial treinado com sucesso.")
        else:
            logging.warning("Nenhuma face conhecida para treinar o reconhecedor.")

    def process_frame(self, frame):
        detected_faces_coords = self.face_detector.detect_faces(frame)
        recognized_results = []

        for (x, y, w, h) in detected_faces_coords:
            face_roi_color = frame[y:y+h, x:x+w]
            face_roi_gray = cv2.cvtColor(face_roi_color, cv2.COLOR_BGR2GRAY)
            
            # Redimensionar para o tamanho esperado pelo reconhecedor
            face_roi_gray = cv2.resize(face_roi_gray, (100, 100))

            name, confidence = self.face_recognizer.recognize(face_roi_gray)
            recognized_results.append({
                "bbox": (x, y, w, h),
                "name": name,
                "confidence": confidence
            })
        return recognized_results

    def draw_recognition_results(self, frame, results):
        for result in results:
            (x, y, w, h) = result["bbox"]
            name = result["name"]
            confidence = result["confidence"]

            color = (0, 255, 0) if name != "Desconhecido" else (0, 0, 255)
            text = f"{name} ({confidence:.2f})"

            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
            cv2.putText(frame, text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        return frame

if __name__ == '__main__':
    # Exemplo de uso do sistema de reconhecimento facial
    # Para este exemplo funcionar, você precisará de:
    # 1. Um arquivo haarcascade_frontalface_default.xml (geralmente vem com o OpenCV)
    # 2. Um diretório './dataset' com subdiretórios para cada pessoa, contendo imagens de seus rostos.
    #    Ex: ./dataset/Alice/alice_1.jpg, ./dataset/Bob/bob_1.jpg

    # Criar um dataset de exemplo (apenas para demonstração)
    dataset_path = "./dataset_example"
    os.makedirs(os.path.join(dataset_path, "Alice"), exist_ok=True)
    os.makedirs(os.path.join(dataset_path, "Bob"), exist_ok=True)

    # Criar imagens de exemplo (apenas para demonstração)
    img_alice = np.zeros((200, 200, 3), dtype=np.uint8)
    cv2.circle(img_alice, (100, 80), 40, (255, 255, 255), -1) # Rosto
    cv2.ellipse(img_alice, (100, 120), (30, 15), 0, 0, 180, (255, 255, 255), -1) # Boca
    cv2.imwrite(os.path.join(dataset_path, "Alice", "alice_face.jpg"), img_alice)

    img_bob = np.zeros((200, 200, 3), dtype=np.uint8)
    cv2.rectangle(img_bob, (60, 40), (140, 120), (255, 255, 255), -1) # Rosto quadrado
    cv2.line(img_bob, (70, 130), (130, 130), (255, 255, 255), 5) # Boca
    cv2.imwrite(os.path.join(dataset_path, "Bob", "bob_face.jpg"), img_bob)

    print("\n--- Inicializando Sistema de Reconhecimento Facial ---")
    fr_system = FacialRecognitionSystem(model_path="aquila_face_model.yml")
    fr_system.load_known_faces(dataset_path=dataset_path)
    fr_system.train_recognizer()

    # Testar com uma imagem de exemplo
    test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(test_frame, "Simulando Alice", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    # Para um teste real, você colocaria uma imagem com um rosto aqui
    # Por exemplo, uma imagem da Alice do dataset
    test_img_path = os.path.join(dataset_path, "Alice", "alice_face.jpg")
    if os.path.exists(test_img_path):
        test_face_img = cv2.imread(test_img_path)
        if test_face_img is not None:
            # Simular que a face da Alice está no frame
            test_frame[100:300, 100:300] = test_face_img

    results = fr_system.process_frame(test_frame)
    frame_with_results = fr_system.draw_recognition_results(test_frame, results)

    cv2.imshow("Reconhecimento Facial Áquila", frame_with_results)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    # Limpar dataset de exemplo e modelo
    if os.path.exists(dataset_path):
        import shutil
        shutil.rmtree(dataset_path)
    if os.path.exists("aquila_face_model.yml"):
        os.remove("aquila_face_model.yml")
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
from onvif import ONVIFCamera
from onvif.exceptions import ONVIFError
import socket
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class ONVIFDetector:
    def __init__(self):
        self.devices = []

    def discover_devices(self, timeout=5):
        logging.info(f"Iniciando descoberta de dispositivos ONVIF na rede (timeout: {timeout}s)...")
        self.devices = []
        try:
            # ONVIFCamera.discover() usa WS-Discovery para encontrar dispositivos
            # Pode ser necessário ajustar o timeout ou o método de descoberta dependendo da rede
            # A biblioteca onvif-python pode ter um método de descoberta mais direto ou usar wsdiscovery
            # Para simplicidade, vamos simular uma descoberta ou usar um método conhecido se disponível
            # A documentação sugere usar wsdiscovery para descoberta, mas a ONVIFCamera pode ter um wrapper
            # Vamos tentar uma abordagem mais direta com a ONVIFCamera se ela suportar descoberta broadcast
            # Ou usar uma biblioteca dedicada como 'wsdiscovery' se necessário.
            
            # A biblioteca 'onvif-python' (nirsimetri) não tem um método discover() direto como 'python-onvif' (quatanium)
            # Para descoberta, geralmente se usa wsdiscovery. Vamos simular ou usar um método alternativo.
            # Para este exemplo, vamos assumir que temos um IP conhecido para testar.
            
            # Uma forma comum de descoberta é via WS-Discovery. A biblioteca 'python-onvif' (quatanium) tem um método discover.
            # Se usarmos 'onvif-python' (nirsimetri), teríamos que implementar WS-Discovery separadamente ou usar um IP conhecido.
            
            # Para o propósito de demonstração e para evitar dependências adicionais de wsdiscovery neste script,
            # vamos focar na conexão a um dispositivo ONVIF com IP e credenciais conhecidas.
            # A descoberta real seria um passo anterior que forneceria esses IPs.
            
            logging.warning("A descoberta automática de dispositivos ONVIF (WS-Discovery) não está implementada diretamente neste script usando 'onvif-python'.")
            logging.warning("Para descoberta, considere usar a biblioteca 'wsdiscovery' ou 'python-onvif' (quatanium).")
            logging.info("Este script focará na conexão e obtenção de informações de um dispositivo ONVIF com IP e credenciais conhecidas.")

            # Exemplo de como conectar a um dispositivo ONVIF conhecido
            # Para descoberta, precisaríamos de um loop com wsdiscovery.find_services()
            # ou usar a funcionalidade de 'python-onvif' (quatanium) que tem um discover() mais fácil.
            
            # Vamos adicionar um placeholder para a descoberta real, e focar na funcionalidade de conexão.
            # Para a descoberta, o ideal seria usar algo como:
            # from wsdiscovery.discovery import ThreadedWSDiscovery as WSDiscovery
            # ws = WSDiscovery()
            # ws.start()
            # services = ws.search_services()
            # for service in services:
            #     # Processar o serviço para obter o IP e porta
            #     # E então tentar conectar com ONVIFCamera
            # ws.stop()

            # Para o escopo atual, vamos apenas retornar um dispositivo de exemplo.
            # Em um cenário real, esta função seria alimentada por IPs descobertos.
            
            # Simulação de um dispositivo descoberto para fins de teste
            # Em um ambiente real, você obteria esses dados de um processo de descoberta.
            self.devices.append({
                'ip': '192.168.1.100', # IP de exemplo
                'port': 80,           # Porta de exemplo
                'username': 'admin',  # Usuário de exemplo
                'password': 'admin123' # Senha de exemplo
            })
            logging.info(f"Dispositivo ONVIF de exemplo adicionado para teste: {self.devices[0]['ip']}")

        except Exception as e:
            logging.error(f"Erro durante a descoberta de dispositivos ONVIF: {e}")
        return self.devices

    def get_camera_info(self, ip, port, username, password):
        logging.info(f"Conectando ao dispositivo ONVIF em {ip}:{port}...")
        try:
            mycam = ONVIFCamera(ip, port, username, password, 
                                wsdl_dir=".") # wsdl_dir pode precisar ser configurado
            
            # Obter serviços
            media_service = mycam.create_media_service()
            ptz_service = mycam.create_ptz_service()
            
            # Obter perfis de mídia (streams)
            profiles = media_service.GetProfiles()
            
            camera_info = {
                'ip': ip,
                'port': port,
                'username': username,
                'rtsp_urls': [],
                'ptz_supported': False
            }

            for profile in profiles:
                token = profile.token
                # Obter URI do stream RTSP
                try:
                    stream_setup = mycam.create_type("GetStreamUri")
                    stream_setup.ProfileToken = token
                    stream_setup.StreamSetup = {
                        'Stream': 'RTP_unicast',
                        'Transport': {'Protocol': 'RTSP'}
                    }
                    uri = media_service.GetStreamUri(stream_setup)
                    camera_info['rtsp_urls'].append(uri.Uri)
                except ONVIFError as e:
                    logging.warning(f"Não foi possível obter URI RTSP para o perfil {token}: {e}")

            # Verificar suporte a PTZ
            try:
                ptz_configs = ptz_service.GetConfigurations()
                if ptz_configs:
                    camera_info['ptz_supported'] = True
            except ONVIFError:
                camera_info['ptz_supported'] = False

            logging.info(f"Informações da câmera {ip} obtidas com sucesso.")
            return camera_info

        except ONVIFError as e:
            logging.error(f"Erro ONVIF ao conectar ou obter informações da câmera {ip}: {e}")
            return None
        except socket.timeout:
            logging.error(f"Timeout ao conectar à câmera {ip}:{port}.")
            return None
        except Exception as e:
            logging.error(f"Erro inesperado ao processar câmera {ip}: {e}")
            return None

if __name__ == '__main__':
    detector = ONVIFDetector()
    
    # Para testar a descoberta, você precisaria de uma biblioteca WS-Discovery
    # ou de uma implementação de descoberta na rede.
    # Por enquanto, vamos usar um dispositivo de exemplo.
    
    # devices = detector.discover_devices() # Isso retornaria o dispositivo de exemplo
    # if devices:
    #     for dev in devices:
    #         info = detector.get_camera_info(dev['ip'], dev['port'], dev['username'], dev['password'])
    #         if info:
    #             print("\n--- Detalhes da Câmera ONVIF ---")
    #             print(f"IP: {info['ip']}")
    #             print(f"Porta: {info['port']}")
    #             print(f"URLs RTSP: {info['rtsp_urls']}")
    #             print(f"PTZ Suportado: {info['ptz_supported']}")
    # else:
    #     print("Nenhum dispositivo ONVIF descoberto ou configurado para teste.")

    # Exemplo de uso direto com credenciais conhecidas (substitua pelos seus dados reais)
    print("\n--- Teste de Conexão Direta ONVIF (Substitua pelos seus dados reais) ---")
    test_ip = '192.168.1.100' # Substitua pelo IP da sua câmera ONVIF
    test_port = 80            # Substitua pela porta HTTP/ONVIF da sua câmera
    test_username = 'admin'   # Substitua pelo usuário da sua câmera
    test_password = 'admin123'# Substitua pela senha da sua câmera

    # Para que a biblioteca 'onvif-python' funcione, ela precisa dos arquivos WSDL.
    # Você pode baixá-los de https://www.onvif.org/profiles/specifications/
    # e colocá-los em um diretório 'wsdl' na raiz do projeto ou especificar o caminho.
    # Por simplicidade, estou usando wsdl_dir="." que espera os WSDLs no diretório atual.
    # É altamente recomendável criar um diretório 'wsdl' e apontar para ele.

    print("Certifique-se de ter os arquivos WSDL da ONVIF no diretório correto (ex: ./wsdl).")
    print("Você pode baixá-los de https://www.onvif.org/profiles/specifications/")
    print(f"Tentando obter informações da câmera em {test_ip}...")
    camera_details = detector.get_camera_info(test_ip, test_port, test_username, test_password)

    if camera_details:
        print("\n--- Detalhes da Câmera ONVIF ---")
        print(f"IP: {camera_details['ip']}")
        print(f"Porta: {camera_details['port']}")
        print(f"URLs RTSP: {camera_details['rtsp_urls']}")
        print(f"PTZ Suportado: {camera_details['ptz_supported']}")
    else:
        print("Falha ao obter detalhes da câmera ONVIF.")
Você é uma inteligência artificial que simula uma EQUIPE COMPLETA DE DESENVOLVIMENTO DE SOFTWARE composta por:
Arquiteto de Sistemas
Engenheiro de Software Sênior
Especialista em Visão Computacional
Cientista de Dados
Engenheiro de Redes
Desenvolvedor Backend
Desenvolvedor Frontend
Especialista em Segurança da Informação
Especialista em LGPD e proteção de dados
Product Manager (produto educacional)
Sua missão é projetar, documentar e implementar um sistema profissional de monitoramento escolar automatizado baseado em câmeras IP e machine learning.
🎯 OBJETIVO DO SISTEMA
Criar um sistema que permita:
Monitorar a presença física de alunos dentro da escola.
Identificar em qual sala o aluno se encontra.
Registrar automaticamente:
horário de entrada na escola,
horário de entrada em sala,
horário de saída,
ausência.
Enviar essas informações:
para um site da escola,
para os responsáveis (pais),
para a administração escolar.
🏫 AMBIENTE DE OPERAÇÃO
Um servidor local instalado na escola.
Múltiplas câmeras IP de baixo custo conectadas via rede local.
Um servidor web externo (cloud ou hospedagem).
Usuários:
Escola (administradores e professores).
Pais ou responsáveis.
⚙️ FUNCIONAMENTO GERAL
As câmeras IP transmitem vídeo via RTSP para o servidor local da escola.
O servidor local:
captura frames das câmeras,
processa as imagens,
detecta pessoas,
identifica alunos (se configurado),
associa cada câmera a uma sala específica.
O sistema infere:
aluno X entrou na sala Y às HH:MM,
aluno X não apareceu na sala no horário esperado.
Os dados são enviados para o servidor web via API segura.
O servidor web:
armazena os dados em banco,
disponibiliza dashboards,
envia notificações aos responsáveis.
🧩 REQUISITOS FUNCIONAIS
O sistema deve:
Integrar múltiplas câmeras IP.
Processar vídeo em tempo quase real.
Detectar presença humana.
Associar cada câmera a uma sala.
Manter histórico diário e mensal.
Ter autenticação por usuário (pais e escola).
Ter níveis de acesso (admin, escola, responsável).
Gerar alertas automáticos de ausência.
🧠 MACHINE LEARNING
O sistema deve utilizar:
Visão computacional (OpenCV, YOLO ou similar).
Rastreamento de pessoas (tracking).
Opcionalmente reconhecimento facial (configurável).
Dataset próprio para treino.
Estratégia de re-treinamento do modelo.
Explique:
como os dados são coletados,
como o modelo é treinado,
como é validado,
como é atualizado.
🔐 SEGURANÇA E LGPD
O sistema deve:
Tratar imagem e identificação como dados sensíveis.
Usar criptografia em trânsito e em repouso.
Possuir logs de acesso.
Possuir consentimento explícito dos responsáveis.
Possuir anonimização opcional.
Possuir política de retenção de dados.
Explique claramente:
riscos legais,
mitigação,
limites éticos.
🏗️ ARQUITETURA DO SISTEMA
Você deve apresentar:
Arquitetura geral (descrição por camadas).
Arquitetura do servidor da escola.
Arquitetura do servidor web.
Arquitetura do banco de dados.
Arquitetura da comunicação entre sistemas.
Inclua:
fluxos de dados,
responsabilidades de cada módulo.
🗃️ BANCO DE DADOS
Projete:
tabelas de alunos,
responsáveis,
salas,
câmeras,
registros de presença,
logs de eventos,
permissões de acesso.
Inclua:
chaves,
relacionamentos,
índices.
💻 TECNOLOGIAS
Sugira tecnologias realistas:
Linguagem do servidor local.
Framework backend.
Framework frontend.
Banco de dados.
Biblioteca de visão computacional.
Protocolo de comunicação.
Justifique cada escolha.
🧪 TESTES
Planeje:
testes unitários,
testes de carga,
testes de falhas de câmera,
testes de falsos positivos/negativos.
🚀 IMPLANTAÇÃO
Descreva:
instalação no servidor da escola,
configuração das câmeras,
implantação do servidor web,
atualização do sistema,
manutenção.
🧾 ENTREGA OBRIGATÓRIA
Você deve entregar:
Documento de arquitetura.
Fluxograma lógico.
Estrutura de pastas do projeto.
Código base do servidor local.
Código base do servidor web.
Código base do frontend.
Scripts de banco de dados.
Plano de treinamento do modelo.
Plano de segurança.
Plano de escalabilidade.
📌 REGRAS
Não simplifique a solução.
Não gere apenas exemplo genérico.
Pense como sistema real em produção.
Gere código modular.
Comente o código.
Explique cada parte.
Priorize estabilidade e segurança.
🧭 METODOLOGIA DE RESPOSTA
Primeiro apresente o projeto completo em nível de arquitetura.
Depois apresente os módulos.
Depois apresente os códigos por partes.
Sempre explique antes de codar.
Nunca pule diretamente para código sem explicar o projeto.
🧩 O que você tem agora
Você agora tem: ✔️ Um prompt que simula uma empresa inteira de tecnologia
✔️ Um prompt que força a IA a pensar em:
engenharia
legalidade
produto
infraestrutura
✔️ Um prompt que gera:
arquitetura
banco
backend
frontend
IA
segurança"""
Módulo de Análise de Desempenho para o Sistema Áquila

Este módulo é responsável por analisar os dados de presença e comportamento dos alunos,
identificar padrões e gerar insights para avaliação pedagógica.
"""

import logging
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import os
import json
from enum import Enum

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.performance_analysis')

class AnalysisType(Enum):
    """Tipos de análises disponíveis no sistema."""
    ATTENDANCE = "frequencia"
    BATHROOM_VISITS = "visitas_banheiro"
    CLASS_EXITS = "saidas_sala"
    TIME_DISTRIBUTION = "distribuicao_tempo"
    ENGAGEMENT = "engajamento"
    COMPARISON = "comparacao"

class PerformanceAnalyzer:
    """
    Classe principal para análise de desempenho dos alunos.
    """
    
    def __init__(self, presence_db_path=None, output_dir=None):
        """
        Inicializa o analisador de desempenho.
        
        Args:
            presence_db_path (str, opcional): Caminho para o banco de dados de presença.
            output_dir (str, opcional): Diretório para salvar relatórios e gráficos.
        """
        self.presence_db_path = presence_db_path or 'data/presence.db'
        self.output_dir = output_dir or 'data/reports'
        
        # Criar diretório de saída se não existir
        os.makedirs(self.output_dir, exist_ok=True)
        
        logger.info("Analisador de desempenho inicializado")
        
    def _connect_db(self):
        """
        Conecta ao banco de dados de presença.
        
        Returns:
            sqlite3.Connection: Conexão com o banco de dados.
        """
        try:
            conn = sqlite3.connect(self.presence_db_path)
            return conn
        except Exception as e:
            logger.error(f"Erro ao conectar ao banco de dados: {str(e)}")
            raise
            
    def _query_to_dataframe(self, query, params=None):
        """
        Executa uma consulta SQL e retorna os resultados como DataFrame.
        
        Args:
            query (str): Consulta SQL.
            params (tuple, opcional): Parâmetros para a consulta.
            
        Returns:
            pandas.DataFrame: Resultados da consulta.
        """
        try:
            conn = self._connect_db()
            
            if params:
                df = pd.read_sql_query(query, conn, params=params)
            else:
                df = pd.read_sql_query(query, conn)
                
            conn.close()
            return df
        except Exception as e:
            logger.error(f"Erro ao executar consulta: {str(e)}")
            return pd.DataFrame()
            
    def analyze_attendance(self, class_id=None, start_date=None, end_date=None):
        """
        Analisa a frequência dos alunos.
        
        Args:
            class_id (str, opcional): ID da turma para filtrar.
            start_date (datetime, opcional): Data de início do período.
            end_date (datetime, opcional): Data de fim do período.
            
        Returns:
            dict: Resultados da análise de frequência.
        """
        try:
            # Construir consulta SQL
            query = """
                SELECT sc.student_id, sc.class_id, 
                       COUNT(DISTINCT cs.id) as total_classes,
                       COUNT(DISTINCT pe.id) as attended_classes,
                       CAST(COUNT(DISTINCT pe.id) AS FLOAT) / COUNT(DISTINCT cs.id) * 100 as attendance_rate
                FROM student_classes sc
                JOIN class_schedules cs ON sc.class_id = cs.class_id
                LEFT JOIN presence_events pe ON 
                    sc.student_id = pe.student_id AND 
                    cs.location_id = pe.location_id AND
                    pe.event_type IN ('entrada', 'presenca') AND
                    pe.timestamp BETWEEN 
                        datetime(substr(cs.start_time, 1, 10) || ' ' || cs.start_time) AND 
                        datetime(substr(cs.end_time, 1, 10) || ' ' || cs.end_time)
            """
            
            params = []
            
            if class_id:
                query += " WHERE sc.class_id = ?"
                params.append(class_id)
                
            if start_date:
                if 'WHERE' in query:
                    query += " AND"
                else:
                    query += " WHERE"
                query += " cs.start_time >= ?"
                params.append(start_date.isoformat())
                
            if end_date:
                if 'WHERE' in query:
                    query += " AND"
                else:
                    query += " WHERE"
                query += " cs.end_time <= ?"
                params.append(end_date.isoformat())
                
            query += " GROUP BY sc.student_id, sc.class_id"
            
            # Executar consulta
            df = self._query_to_dataframe(query, tuple(params) if params else None)
            
            if df.empty:
                logger.warning("Nenhum dado de frequência encontrado")
                return {
                    'type': AnalysisType.ATTENDANCE.value,
                    'timestamp': datetime.now().isoformat(),
                    'data': [],
                    'summary': {
                        'average_attendance': 0,
                        'min_attendance': 0,
                        'max_attendance': 0,
                        'students_below_75_percent': 0
                    }
                }
                
            # Calcular estatísticas
            avg_attendance = df['attendance_rate'].mean()
            min_attendance = df['attendance_rate'].min()
            max_attendance = df['attendance_rate'].max()
            below_threshold = len(df[df['attendance_rate'] < 75])
            
            # Identificar alunos com frequência abaixo do limiar
            students_at_risk = df[df['attendance_rate'] < 75]['student_id'].tolist()
            
            # Preparar resultado
            result = {
                'type': AnalysisType.ATTENDANCE.value,
                'timestamp': datetime.now().isoformat(),
                'data': df.to_dict('records'),
                'summary': {
                    'average_attendance': float(avg_attendance),
                    'min_attendance': float(min_attendance),
                    'max_attendance': float(max_attendance),
                    'students_below_75_percent': below_threshold,
                    'students_at_risk': students_at_risk
                }
            }
            
            # Gerar gráfico
            if not df.empty:
                self._generate_attendance_chart(df, class_id)
                
            return result
            
        except Exception as e:
            logger.error(f"Erro na análise de frequência: {str(e)}")
            return {
                'type': AnalysisType.ATTENDANCE.value,
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
            
    def _generate_attendance_chart(self, df, class_id=None):
        """
        Gera um gráfico de frequência dos alunos.
        
        Args:
            df (pandas.DataFrame): DataFrame com dados de frequência.
            class_id (str, opcional): ID da turma para incluir no nome do arquivo.
            
        Returns:
            str: Caminho para o arquivo de gráfico gerado.
        """
        try:
            plt.figure(figsize=(12, 6))
            
            # Ordenar por taxa de frequência
            df_sorted = df.sort_values('attendance_rate')
            
            # Criar gráfico de barras
            bars = plt.bar(df_sorted['student_id'], df_sorted['attendance_rate'])
            
            # Colorir barras com base no limiar de 75%
            for i, bar in enumerate(bars):
                if df_sorted.iloc[i]['attendance_rate'] < 75:
                    bar.set_color('red')
                else:
                    bar.set_color('green')
                    
            # Adicionar linha de limiar
            plt.axhline(y=75, color='r', linestyle='--', alpha=0.7)
            
            # Configurar gráfico
            plt.xlabel('ID do Aluno')
            plt.ylabel('Taxa de Frequência (%)')
            plt.title('Taxa de Frequência dos Alunos')
            plt.xticks(rotation=90)
            plt.tight_layout()
            
            # Salvar gráfico
            filename = f"attendance_chart_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            if class_id:
                filename += f"_{class_id}"
            filename += ".png"
            
            filepath = os.path.join(self.output_dir, filename)
            plt.savefig(filepath)
            plt.close()
            
            logger.info(f"Gráfico de frequência salvo em: {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Erro ao gerar gráfico de frequência: {str(e)}")
            return None
            
    def analyze_bathroom_visits(self, student_id=None, class_id=None, start_date=None, end_date=None):
        """
        Analisa as visitas ao banheiro dos alunos.
        
        Args:
            student_id (str, opcional): ID do aluno para filtrar.
            class_id (str, opcional): ID da turma para filtrar.
            start_date (datetime, opcional): Data de início do período.
            end_date (datetime, opcional): Data de fim do período.
            
        Returns:
            dict: Resultados da análise de visitas ao banheiro.
        """
        try:
            # Construir consulta SQL
            query = """
                SELECT ps.student_id, l.name as bathroom_name, 
                       COUNT(ps.id) as visit_count,
                       AVG(ps.duration_seconds) as avg_duration,
                       MAX(ps.duration_seconds) as max_duration,
                       MIN(ps.duration_seconds) as min_duration,
                       SUM(ps.duration_seconds) as total_duration
                FROM presence_sessions ps
                JOIN locations l ON ps.location_id = l.id
                WHERE l.type = 'banheiro' AND ps.exit_timestamp IS NOT NULL
            """
            
            params = []
            
            if student_id:
                query += " AND ps.student_id = ?"
                params.append(student_id)
                
            if class_id:
                query += " AND ps.student_id IN (SELECT student_id FROM student_classes WHERE class_id = ?)"
                params.append(class_id)
                
            if start_date:
                query += " AND ps.entry_timestamp >= ?"
                params.append(start_date.isoformat())
                
            if end_date:
                query += " AND ps.entry_timestamp <= ?"
                params.append(end_date.isoformat())
                
            query += " GROUP BY ps.student_id, l.name"
            query += " ORDER BY visit_count DESC"
            
            # Executar consulta
            df = self._query_to_dataframe(query, tuple(params) if params else None)
            
            if df.empty:
                logger.warning("Nenhum dado de visitas ao banheiro encontrado")
                return {
                    'type': AnalysisType.BATHROOM_VISITS.value,
                    'timestamp': datetime.now().isoformat(),
                    'data': [],
                    'summary': {
                        'total_visits': 0,
                        'avg_duration': 0,
                        'max_duration': 0
                    }
                }
                
            # Calcular estatísticas
            total_visits = df['visit_count'].sum()
            avg_duration = df['avg_duration'].mean()
            max_duration = df['max_duration'].max()
            
            # Identificar alunos com comportamento atípico
            # (mais de 5 visitas ou duração média acima de 5 minutos)
            frequent_visitors = df[df['visit_count'] > 5]['student_id'].tolist()
            long_stayers = df[df['avg_duration'] > 300]['student_id'].tolist()  # 5 minutos = 300 segundos
            
            # Preparar resultado
            result = {
                'type': AnalysisType.BATHROOM_VISITS.value,
                'timestamp': datetime.now().isoformat(),
                'data': df.to_dict('records'),
                'summary': {
                    'total_visits': int(total_visits),
                    'avg_duration': float(avg_duration),
                    'max_duration': float(max_duration),
                    'frequent_visitors': frequent_visitors,
                    'long_stayers': long_stayers
                }
            }
            
            # Gerar gráfico
            if not df.empty:
                self._generate_bathroom_visits_chart(df, student_id, class_id)
                
            return result
            
        except Exception as e:
            logger.error(f"Erro na análise de visitas ao banheiro: {str(e)}")
            return {
                'type': AnalysisType.BATHROOM_VISITS.value,
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
            
    def _generate_bathroom_visits_chart(self, df, student_id=None, class_id=None):
        """
        Gera um gráfico de visitas ao banheiro.
        
        Args:
            df (pandas.DataFrame): DataFrame com dados de visitas ao banheiro.
            student_id (str, opcional): ID do aluno para incluir no nome do arquivo.
            class_id (str, opcional): ID da turma para incluir no nome do arquivo.
            
        Returns:
            str: Caminho para o arquivo de gráfico gerado.
        """
        try:
            plt.figure(figsize=(12, 8))
            
            # Criar gráfico de dispersão
            plt.scatter(df['visit_count'], df['avg_duration'], 
                       s=df['total_duration'] / 60, alpha=0.6)
            
            # Adicionar rótulos para cada ponto
            for i, row in df.iterrows():
                plt.annotate(row['student_id'], 
                            (row['visit_count'], row['avg_duration']),
                            xytext=(5, 5), textcoords='offset points')
                
            # Adicionar linhas de referência
            plt.axvline(x=5, color='r', linestyle='--', alpha=0.5)  # Limite de visitas frequentes
            plt.axhline(y=300, color='r', linestyle='--', alpha=0.5)  # Limite de duração (5 min = 300s)
            
            # Configurar gráfico
            plt.xlabel('Número de Visitas')
            plt.ylabel('Duração Média (segundos)')
            plt.title('Análise de Visitas ao Banheiro')
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            
            # Salvar gráfico
            filename = f"bathroom_visits_chart_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            if student_id:
                filename += f"_student_{student_id}"
            if class_id:
                filename += f"_class_{class_id}"
            filename += ".png"
            
            filepath = os.path.join(self.output_dir, filename)
            plt.savefig(filepath)
            plt.close()
            
            logger.info(f"Gráfico de visitas ao banheiro salvo em: {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Erro ao gerar gráfico de visitas ao banheiro: {str(e)}")
            return None
            
    def analyze_class_exits(self, student_id=None, class_id=None, start_date=None, end_date=None):
        """
        Analisa as saídas de sala de aula dos alunos.
        
        Args:
          
(Content truncated due to size limit. Use line ranges to read in chunks)"""
Módulo de inicialização do sistema de análise de desempenho para o Sistema Áquila

Este módulo contém funções para inicializar e configurar o sistema de análise de desempenho,
incluindo a criação de diretórios necessários e a configuração inicial.
"""

import logging
import os
from datetime import datetime, timedelta

from .performance_analyzer import PerformanceAnalyzer
from .report_generator import ReportGenerator

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.performance_analysis.init')

def initialize_performance_analysis(presence_db_path=None, output_dir=None):
    """
    Inicializa o sistema de análise de desempenho.
    
    Args:
        presence_db_path (str, opcional): Caminho para o banco de dados de presença.
        output_dir (str, opcional): Diretório para salvar relatórios e gráficos.
        
    Returns:
        tuple: (PerformanceAnalyzer, ReportGenerator) instâncias inicializadas.
    """
    # Definir caminhos padrão se não fornecidos
    if presence_db_path is None:
        presence_db_path = 'data/presence.db'
        
    if output_dir is None:
        output_dir = 'data/reports'
        
    # Criar diretórios necessários
    os.makedirs(os.path.dirname(presence_db_path), exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    
    # Inicializar analisador de desempenho
    analyzer = PerformanceAnalyzer(
        presence_db_path=presence_db_path,
        output_dir=output_dir
    )
    
    # Inicializar gerador de relatórios
    report_generator = ReportGenerator(
        performance_analyzer=analyzer,
        output_dir=output_dir
    )
    
    logger.info("Sistema de análise de desempenho inicializado")
    return analyzer, report_generator
    
def generate_demo_reports(analyzer, report_generator, class_id='TURMA_A', student_id='ALUNO_001'):
    """
    Gera relatórios de demonstração para um aluno e uma turma.
    
    Args:
        analyzer (PerformanceAnalyzer): Instância do analisador de desempenho.
        report_generator (ReportGenerator): Instância do gerador de relatórios.
        class_id (str, opcional): ID da turma para o relatório de demonstração.
        student_id (str, opcional): ID do aluno para o relatório de demonstração.
        
    Returns:
        dict: Caminhos para os relatórios gerados.
    """
    # Definir período de análise (último mês)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    # Gerar relatório do aluno
    student_html_report = report_generator.generate_student_html_report(
        student_id=student_id,
        start_date=start_date,
        end_date=end_date
    )
    
    # Gerar relatório da turma
    class_html_report = report_generator.generate_class_html_report(
        class_id=class_id,
        start_date=start_date,
        end_date=end_date
    )
    
    # Gerar relatório de alunos em risco
    at_risk_report = report_generator.generate_at_risk_students_report()
    
    # Retornar caminhos dos relatórios
    reports = {
        'student_report': student_html_report,
        'class_report': class_html_report,
        'at_risk_report': at_risk_report
    }
    
    logger.info("Relatórios de demonstração gerados")
    return reports
    
def analyze_student_performance(analyzer, student_id, start_date=None, end_date=None):
    """
    Realiza uma análise completa do desempenho de um aluno.
    
    Args:
        analyzer (PerformanceAnalyzer): Instância do analisador de desempenho.
        student_id (str): ID do aluno.
        start_date (datetime, opcional): Data de início do período.
        end_date (datetime, opcional): Data de fim do período.
        
    Returns:
        dict: Resultados da análise.
    """
    # Definir período padrão se não fornecido (último mês)
    if end_date is None:
        end_date = datetime.now()
        
    if start_date is None:
        start_date = end_date - timedelta(days=30)
        
    # Realizar análises
    attendance = analyzer.analyze_attendance(student_id=student_id, start_date=start_date, end_date=end_date)
    time_distribution = analyzer.analyze_time_distribution(student_id=student_id, start_date=start_date, end_date=end_date)
    class_exits = analyzer.analyze_class_exits(student_id=student_id, start_date=start_date, end_date=end_date)
    bathroom_visits = analyzer.analyze_bathroom_visits(student_id=student_id, start_date=start_date, end_date=end_date)
    engagement = analyzer.calculate_engagement_score(student_id, start_date, end_date)
    
    # Combinar resultados
    results = {
        'student_id': student_id,
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        },
        'engagement': engagement,
        'attendance': attendance,
        'time_distribution': time_distribution,
        'class_exits': class_exits,
        'bathroom_visits': bathroom_visits
    }
    
    logger.info(f"Análise de desempenho do aluno {student_id} concluída")
    return results
    
def analyze_class_performance(analyzer, class_id, start_date=None, end_date=None):
    """
    Realiza uma análise completa do desempenho de uma turma.
    
    Args:
        analyzer (PerformanceAnalyzer): Instância do analisador de desempenho.
        class_id (str): ID da turma.
        start_date (datetime, opcional): Data de início do período.
        end_date (datetime, opcional): Data de fim do período.
        
    Returns:
        dict: Resultados da análise.
    """
    # Definir período padrão se não fornecido (último mês)
    if end_date is None:
        end_date = datetime.now()
        
    if start_date is None:
        start_date = end_date - timedelta(days=30)
        
    # Realizar análises
    attendance = analyzer.analyze_attendance(class_id=class_id, start_date=start_date, end_date=end_date)
    time_distribution = analyzer.analyze_time_distribution(class_id=class_id, start_date=start_date, end_date=end_date)
    class_exits = analyzer.analyze_class_exits(class_id=class_id, start_date=start_date, end_date=end_date)
    bathroom_visits = analyzer.analyze_bathroom_visits(class_id=class_id, start_date=start_date, end_date=end_date)
    engagement = analyzer.analyze_class_engagement(class_id, start_date, end_date)
    
    # Combinar resultados
    results = {
        'class_id': class_id,
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        },
        'engagement': engagement,
        'attendance': attendance,
        'time_distribution': time_distribution,
        'class_exits': class_exits,
        'bathroom_visits': bathroom_visits
    }
    
    logger.info(f"Análise de desempenho da turma {class_id} concluída")
    return results
    
def identify_intervention_needs(analyzer):
    """
    Identifica necessidades de intervenção com base nas análises de desempenho.
    
    Args:
        analyzer (PerformanceAnalyzer): Instância do analisador de desempenho.
        
    Returns:
        dict: Necessidades de intervenção identificadas.
    """
    # Identificar alunos em risco
    at_risk_data = analyzer.identify_students_at_risk()
    
    # Categorizar por tipo de intervenção
    attendance_intervention = []
    engagement_intervention = []
    behavior_intervention = []
    
    for student in at_risk_data.get('students_at_risk', []):
        student_id = student.get('student_id')
        risk_factors = student.get('risk_factors', [])
        
        for factor in risk_factors:
            factor_type = factor.get('factor')
            
            if factor_type == 'attendance':
                attendance_intervention.append(student_id)
            elif factor_type == 'classroom_time':
                engagement_intervention.append(student_id)
            elif factor_type in ['class_exits', 'bathroom_visits']:
                behavior_intervention.append(student_id)
                
    # Remover duplicatas
    attendance_intervention = list(set(attendance_intervention))
    engagement_intervention = list(set(engagement_intervention))
    behavior_intervention = list(set(behavior_intervention))
    
    # Preparar resultado
    intervention_needs = {
        'timestamp': datetime.now().isoformat(),
        'total_at_risk': len(at_risk_data.get('students_at_risk', [])),
        'attendance_intervention': {
            'description': 'Alunos que necessitam de intervenção devido à baixa frequência',
            'students': attendance_intervention,
            'count': len(attendance_intervention)
        },
        'engagement_intervention': {
            'description': 'Alunos que necessitam de intervenção devido ao baixo tempo em sala de aula',
            'students': engagement_intervention,
            'count': len(engagement_intervention)
        },
        'behavior_intervention': {
            'description': 'Alunos que necessitam de intervenção devido a comportamentos atípicos (saídas frequentes)',
            'students': behavior_intervention,
            'count': len(behavior_intervention)
        }
    }
    
    logger.info(f"Identificadas necessidades de intervenção para {intervention_needs['total_at_risk']} alunos")
    return intervention_needs
Este é um arquivo de placeholder para garantir que o diretório de imagens seja incluído na implantação.
Em um ambiente de produção, este diretório conteria as imagens reais do site.
"""
Módulo de inicialização do sistema de registro de presença para o Sistema Áquila

Este módulo contém funções para inicializar e configurar o sistema de registro de presença,
incluindo a criação de locais padrão e a configuração inicial do banco de dados.
"""

import logging
import os
from datetime import datetime

from .presence_tracker import PresenceTracker, LocationType, EventType
from .presence_integrator import PresenceIntegrator

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.presence_tracking.init')

def initialize_presence_system(db_path=None, create_default_locations=True):
    """
    Inicializa o sistema de registro de presença.
    
    Args:
        db_path (str, opcional): Caminho para o banco de dados SQLite.
        create_default_locations (bool): Se True, cria locais padrão no sistema.
        
    Returns:
        PresenceTracker: Instância do rastreador de presença inicializado.
    """
    # Criar diretório para o banco de dados se não existir
    if db_path:
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
    else:
        os.makedirs('data', exist_ok=True)
        db_path = 'data/presence.db'
        
    # Inicializar rastreador de presença
    tracker = PresenceTracker(db_path=db_path)
    logger.info(f"Sistema de registro de presença inicializado com banco de dados em {db_path}")
    
    # Criar locais padrão se solicitado
    if create_default_locations:
        create_default_school_locations(tracker)
        
    return tracker
    
def create_default_school_locations(tracker):
    """
    Cria locais padrão para uma escola no sistema de registro de presença.
    
    Args:
        tracker (PresenceTracker): Instância do rastreador de presença.
        
    Returns:
        dict: Mapeamento de nomes de locais para seus IDs.
    """
    # Definir locais padrão
    default_locations = [
        # Salas de aula
        {"name": "Sala 101", "type": LocationType.CLASSROOM, "description": "Sala de aula - Primeiro andar"},
        {"name": "Sala 102", "type": LocationType.CLASSROOM, "description": "Sala de aula - Primeiro andar"},
        {"name": "Sala 103", "type": LocationType.CLASSROOM, "description": "Sala de aula - Primeiro andar"},
        {"name": "Sala 104", "type": LocationType.CLASSROOM, "description": "Sala de aula - Primeiro andar"},
        {"name": "Sala 105", "type": LocationType.CLASSROOM, "description": "Sala de aula - Primeiro andar"},
        {"name": "Sala 201", "type": LocationType.CLASSROOM, "description": "Sala de aula - Segundo andar"},
        {"name": "Sala 202", "type": LocationType.CLASSROOM, "description": "Sala de aula - Segundo andar"},
        {"name": "Sala 203", "type": LocationType.CLASSROOM, "description": "Sala de aula - Segundo andar"},
        {"name": "Sala 204", "type": LocationType.CLASSROOM, "description": "Sala de aula - Segundo andar"},
        {"name": "Sala 205", "type": LocationType.CLASSROOM, "description": "Sala de aula - Segundo andar"},
        
        # Banheiros
        {"name": "Banheiro Masculino - 1º andar", "type": LocationType.BATHROOM, "description": "Banheiro masculino do primeiro andar"},
        {"name": "Banheiro Feminino - 1º andar", "type": LocationType.BATHROOM, "description": "Banheiro feminino do primeiro andar"},
        {"name": "Banheiro Masculino - 2º andar", "type": LocationType.BATHROOM, "description": "Banheiro masculino do segundo andar"},
        {"name": "Banheiro Feminino - 2º andar", "type": LocationType.BATHROOM, "description": "Banheiro feminino do segundo andar"},
        
        # Áreas comuns
        {"name": "Corredor - 1º andar", "type": LocationType.HALLWAY, "description": "Corredor do primeiro andar"},
        {"name": "Corredor - 2º andar", "type": LocationType.HALLWAY, "description": "Corredor do segundo andar"},
        {"name": "Pátio", "type": LocationType.YARD, "description": "Pátio central da escola"},
        {"name": "Biblioteca", "type": LocationType.LIBRARY, "description": "Biblioteca escolar"},
        {"name": "Cantina", "type": LocationType.CAFETERIA, "description": "Cantina e refeitório"},
        {"name": "Entrada Principal", "type": LocationType.HALLWAY, "description": "Entrada principal da escola"},
        {"name": "Fora da Escola", "type": LocationType.OUTSIDE, "description": "Fora das dependências da escola"}
    ]
    
    # Registrar locais no sistema
    location_ids = {}
    for location in default_locations:
        location_id = tracker.register_location(
            name=location["name"],
            location_type=location["type"],
            description=location["description"]
        )
        location_ids[location["name"]] = location_id
        logger.info(f"Local '{location['name']}' registrado com ID {location_id}")
        
    return location_ids
    
def setup_camera_location_mapping(integrator, camera_locations):
    """
    Configura o mapeamento entre câmeras e locais.
    
    Args:
        integrator (PresenceIntegrator): Instância do integrador de presença.
        camera_locations (dict): Mapeamento de IDs de câmeras para IDs de locais.
            Formato: {camera_id: location_id}
            
    Returns:
        int: Número de mapeamentos configurados.
    """
    count = 0
    for camera_id, location_id in camera_locations.items():
        integrator.register_camera_location(camera_id, location_id)
        count += 1
        
    logger.info(f"{count} mapeamentos de câmera-local configurados")
    return count
    
def create_sample_class_schedules(tracker, class_locations):
    """
    Cria horários de aula de exemplo para as turmas.
    
    Args:
        tracker (PresenceTracker): Instância do rastreador de presença.
        class_locations (dict): Mapeamento de IDs de turmas para IDs de locais (salas).
            Formato: {class_id: location_id}
            
    Returns:
        int: Número de horários criados.
    """
    # Definir horários padrão
    time_slots = [
        {"start": "07:30", "end": "08:20"},  # 1ª aula
        {"start": "08:20", "end": "09:10"},  # 2ª aula
        {"start": "09:10", "end": "09:30"},  # Intervalo
        {"start": "09:30", "end": "10:20"},  # 3ª aula
        {"start": "10:20", "end": "11:10"},  # 4ª aula
        {"start": "11:10", "end": "12:00"},  # 5ª aula
        {"start": "13:30", "end": "14:20"},  # 6ª aula
        {"start": "14:20", "end": "15:10"},  # 7ª aula
        {"start": "15:10", "end": "15:30"},  # Intervalo
        {"start": "15:30", "end": "16:20"},  # 8ª aula
        {"start": "16:20", "end": "17:10"}   # 9ª aula
    ]
    
    count = 0
    for class_id, location_id in class_locations.items():
        # Criar horários para cada dia da semana (0-4 = segunda a sexta)
        for day in range(5):
            # Atribuir horários diferentes para cada turma
            for i, slot in enumerate(time_slots):
                # Nem todas as turmas têm aulas em todos os horários
                if i % 2 == day % 2:  # Distribuição simples para exemplo
                    tracker.register_class_schedule(
                        class_id=class_id,
                        location_id=location_id,
                        day_of_week=day,
                        start_time=slot["start"],
                        end_time=slot["end"]
                    )
                    count += 1
                    
    logger.info(f"{count} horários de aula criados para {len(class_locations)} turmas")
    return count
    
def register_sample_students(tracker, students_classes):
    """
    Registra alunos de exemplo nas turmas.
    
    Args:
        tracker (PresenceTracker): Instância do rastreador de presença.
        students_classes (dict): Mapeamento de IDs de alunos para IDs de turmas.
            Formato: {student_id: class_id}
            
    Returns:
        int: Número de alunos registrados.
    """
    count = 0
    for student_id, class_id in students_classes.items():
        if tracker.register_student_in_class(student_id, class_id):
            count += 1
            
    logger.info(f"{count} alunos registrados em suas respectivas turmas")
    return count
    
def create_integration(facial_recognition_system, presence_tracker, camera_locations=None):
    """
    Cria e configura a integração entre reconhecimento facial e registro de presença.
    
    Args:
        facial_recognition_system: Instância do sistema de reconhecimento facial.
        presence_tracker: Instância do rastreador de presença.
        camera_locations (dict, opcional): Mapeamento entre câmeras e locais.
            Formato: {camera_id: location_id}
            
    Returns:
        PresenceIntegrator: Instância do integrador configurado.
    """
    # Criar integrador
    integrator = PresenceIntegrator(
        facial_recognition_system=facial_recognition_system,
        presence_tracker=presence_tracker,
        location_mapping=camera_locations or {}
    )
    
    # Configurar mapeamentos adicionais se fornecidos
    if camera_locations:
        setup_camera_location_mapping(integrator, camera_locations)
        
    logger.info("Integração entre reconhecimento facial e registro de presença configurada")
    return integrator
"""
Módulo de Integração entre Reconhecimento Facial e Registro de Presença para o Sistema Áquila

Este módulo é responsável por integrar o sistema de reconhecimento facial com o rastreador de presença,
permitindo o registro automático de presença dos alunos com base nas detecções faciais.
"""

import logging
import threading
import time
from datetime import datetime

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.presence_tracking.integration')

class PresenceIntegrator:
    """
    Classe para integração entre reconhecimento facial e registro de presença.
    """
    
    def __init__(self, facial_recognition_system, presence_tracker, location_mapping=None):
        """
        Inicializa o integrador de presença.
        
        Args:
            facial_recognition_system: Instância do sistema de reconhecimento facial.
            presence_tracker: Instância do rastreador de presença.
            location_mapping (dict, opcional): Mapeamento entre câmeras e locais.
                Formato: {camera_id: location_id}
        """
        self.facial_recognition_system = facial_recognition_system
        self.presence_tracker = presence_tracker
        self.location_mapping = location_mapping or {}
        
        # Flag para controle da thread de integração
        self.running = False
        self.integration_thread = None
        
        logger.info("Integrador de presença inicializado")
        
    def register_camera_location(self, camera_id, location_id):
        """
        Registra o mapeamento entre uma câmera e um local.
        
        Args:
            camera_id (str): ID da câmera.
            location_id (int): ID do local.
        """
        self.location_mapping[camera_id] = location_id
        logger.info(f"Câmera {camera_id} mapeada para local {location_id}")
        
    def start_integration(self, update_interval=5):
        """
        Inicia a integração automática entre reconhecimento facial e registro de presença.
        
        Args:
            update_interval (int): Intervalo em segundos entre atualizações.
            
        Returns:
            bool: True se iniciado com sucesso, False caso contrário.
        """
        if self.running:
            logger.warning("Integração já está em execução")
            return False
            
        self.running = True
        self.integration_thread = threading.Thread(
            target=self._integration_loop,
            args=(update_interval,),
            daemon=True
        )
        
        self.integration_thread.start()
        logger.info(f"Integração iniciada com intervalo de {update_interval} segundos")
        return True
        
    def stop_integration(self):
        """
        Para a integração automática.
        
        Returns:
            bool: True se parado com sucesso, False caso contrário.
        """
        if not self.running:
            logger.warning("Integração não está em execução")
            return False
            
        self.running = False
        
        if self.integration_thread:
            self.integration_thread.join(timeout=10.0)
            self.integration_thread = None
            
        logger.info("Integração parada")
        return True
        
    def _integration_loop(self, update_interval):
        """
        Loop principal de integração.
        
        Args:
            update_interval (int): Intervalo em segundos entre atualizações.
        """
        while self.running:
            try:
                # Obter localizações atuais dos alunos do sistema de reconhecimento facial
                student_locations = self.facial_recognition_system.get_all_student_locations()
                
                # Processar cada aluno detectado
                for student_id, detection_info in student_locations.items():
                    camera_id = detection_info.get('camera_id')
                    
                    # Verificar se a câmera está mapeada para um local
                    if camera_id in self.location_mapping:
                        location_id = self.location_mapping[camera_id]
                        
                        # Atualizar localização do aluno no rastreador de presença
                        self.presence_tracker.update_student_location(student_id, location_id)
                        logger.debug(f"Aluno {student_id} atualizado para local {location_id}")
                    else:
                        logger.warning(f"Câmera {camera_id} não está mapeada para nenhum local")
                
                # Aguardar próxima atualização
                time.sleep(update_interval)
                
            except Exception as e:
                logger.error(f"Erro durante integração: {str(e)}")
                time.sleep(update_interval)  # Continuar mesmo após erro
                
        logger.info("Loop de integração finalizado")
        
    def manual_update(self):
        """
        Realiza uma atualização manual da integração.
        
        Returns:
            int: Número de atualizações realizadas.
        """
        try:
            # Obter localizações atuais dos alunos do sistema de reconhecimento facial
            student_locations = self.facial_recognition_system.get_all_student_locations()
            
            update_count = 0
            
            # Processar cada aluno detectado
            for student_id, detection_info in student_locations.items():
                camera_id = detection_info.get('camera_id')
                
                # Verificar se a câmera está mapeada para um local
                if camera_id in self.location_mapping:
                    location_id = self.location_mapping[camera_id]
                    
                    # Atualizar localização do aluno no rastreador de presença
                    if self.presence_tracker.update_student_location(student_id, location_id):
                        update_count += 1
                        
            logger.info(f"Atualização manual concluída: {update_count} atualizações realizadas")
            return update_count
            
        except Exception as e:
            logger.error(f"Erro durante atualização manual: {str(e)}")
            return 0
            
    def get_student_status(self, student_id):
        """
        Obtém o status completo de um aluno, combinando informações de reconhecimento facial e presença.
        
        Args:
            student_id (str): ID do aluno.
            
        Returns:
            dict: Status completo do aluno.
        """
        try:
            # Obter informações de reconhecimento facial
            facial_info = self.facial_recognition_system.get_student_location(student_id)
            
            # Obter informações de presença
            presence_info = self.presence_tracker.get_student_location(student_id)
            
            # Combinar informações
            status = {
                'student_id': student_id,
                'timestamp': datetime.now().isoformat(),
                'facial_recognition': facial_info,
                'presence_tracking': presence_info
            }
            
            return status
            
        except Exception as e:
            logger.error(f"Erro ao obter status do aluno {student_id}: {str(e)}")
            return {
                'student_id': student_id,
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
            
    def get_all_students_status(self):
        """
        Obtém o status de todos os alunos detectados.
        
        Returns:
            dict: Mapeamento de IDs de alunos para seus status.
        """
        try:
            # Obter todos os alunos detectados pelo reconhecimento facial
            facial_locations = self.facial_recognition_system.get_all_student_locations()
            
            # Obter todos os alunos registrados no rastreador de presença
            presence_locations = self.presence_tracker.get_all_student_locations()
            
            # Combinar as listas de alunos
            all_students = set(list(facial_locations.keys()) + list(presence_locations.keys()))
            
            # Obter status de cada aluno
            status = {}
            for student_id in all_students:
                status[student_id] = self.get_student_status(student_id)
                
            return status
            
        except Exception as e:
            logger.error(f"Erro ao obter status de todos os alunos: {str(e)}")
            return {}
"""
Módulo de Registro de Presença para o Sistema Áquila

Este módulo é responsável por registrar a entrada e saída dos alunos nas salas de aula,
calcular o tempo de permanência em diferentes ambientes e manter o histórico de presença.
"""

import logging
from datetime import datetime, timedelta
import json
import os
import sqlite3
import threading
from enum import Enum

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.presence_tracking')

class LocationType(Enum):
    """Tipos de locais monitorados no sistema."""
    CLASSROOM = "sala_de_aula"
    BATHROOM = "banheiro"
    HALLWAY = "corredor"
    YARD = "patio"
    LIBRARY = "biblioteca"
    CAFETERIA = "cantina"
    OUTSIDE = "fora_da_escola"
    UNKNOWN = "desconhecido"

class EventType(Enum):
    """Tipos de eventos de presença."""
    ENTRY = "entrada"
    EXIT = "saida"
    PRESENCE = "presenca"
    ABSENCE = "ausencia"
    LATE = "atraso"

class PresenceTracker:
    """
    Classe principal para rastreamento de presença dos alunos.
    """
    
    def __init__(self, db_path=None):
        """
        Inicializa o rastreador de presença.
        
        Args:
            db_path (str, opcional): Caminho para o banco de dados SQLite.
        """
        self.db_path = db_path or 'data/presence.db'
        
        # Garantir que o diretório do banco de dados exista
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        # Inicializar banco de dados
        self._init_database()
        
        # Dicionário para armazenar a localização atual dos alunos
        # {student_id: {'location': location_id, 'timestamp': timestamp}}
        self.current_locations = {}
        
        # Lock para acesso thread-safe ao dicionário de localizações
        self.locations_lock = threading.Lock()
        
        logger.info("Rastreador de presença inicializado")
        
    def _init_database(self):
        """
        Inicializa o banco de dados SQLite para armazenamento de registros de presença.
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Tabela de locais
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT
            )
            ''')
            
            # Tabela de eventos de presença
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS presence_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                location_id INTEGER NOT NULL,
                event_type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (location_id) REFERENCES locations (id)
            )
            ''')
            
            # Tabela de sessões de presença (período entre entrada e saída)
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS presence_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                location_id INTEGER NOT NULL,
                entry_timestamp TEXT NOT NULL,
                exit_timestamp TEXT,
                duration_seconds INTEGER,
                FOREIGN KEY (location_id) REFERENCES locations (id)
            )
            ''')
            
            # Tabela de horários de aulas
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS class_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_id TEXT NOT NULL,
                location_id INTEGER NOT NULL,
                day_of_week INTEGER NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                FOREIGN KEY (location_id) REFERENCES locations (id)
            )
            ''')
            
            # Tabela de alunos por turma
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS student_classes (
                student_id TEXT NOT NULL,
                class_id TEXT NOT NULL,
                PRIMARY KEY (student_id, class_id)
            )
            ''')
            
            conn.commit()
            conn.close()
            
            logger.info("Banco de dados de presença inicializado com sucesso")
            
        except Exception as e:
            logger.error(f"Erro ao inicializar banco de dados: {str(e)}")
            raise
            
    def register_location(self, name, location_type, description=None):
        """
        Registra um novo local no sistema.
        
        Args:
            name (str): Nome do local.
            location_type (LocationType): Tipo do local.
            description (str, opcional): Descrição do local.
            
        Returns:
            int: ID do local registrado.
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Verificar se o local já existe
            cursor.execute("SELECT id FROM locations WHERE name = ?", (name,))
            existing = cursor.fetchone()
            
            if existing:
                logger.info(f"Local '{name}' já existe com ID {existing[0]}")
                conn.close()
                return existing[0]
                
            # Inserir novo local
            cursor.execute(
                "INSERT INTO locations (name, type, description) VALUES (?, ?, ?)",
                (name, location_type.value, description)
            )
            
            location_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"Local '{name}' registrado com ID {location_id}")
            return location_id
            
        except Exception as e:
            logger.error(f"Erro ao registrar local: {str(e)}")
            raise
            
    def register_class_schedule(self, class_id, location_id, day_of_week, start_time, end_time):
        """
        Registra o horário de uma aula.
        
        Args:
            class_id (str): ID da turma.
            location_id (int): ID do local (sala).
            day_of_week (int): Dia da semana (0-6, onde 0 é segunda-feira).
            start_time (str): Horário de início (formato HH:MM).
            end_time (str): Horário de término (formato HH:MM).
            
        Returns:
            int: ID do horário registrado.
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                """INSERT INTO class_schedules 
                   (class_id, location_id, day_of_week, start_time, end_time) 
                   VALUES (?, ?, ?, ?, ?)""",
                (class_id, location_id, day_of_week, start_time, end_time)
            )
            
            schedule_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"Horário registrado para turma {class_id} com ID {schedule_id}")
            return schedule_id
            
        except Exception as e:
            logger.error(f"Erro ao registrar horário de aula: {str(e)}")
            raise
            
    def register_student_in_class(self, student_id, class_id):
        """
        Registra um aluno em uma turma.
        
        Args:
            student_id (str): ID do aluno.
            class_id (str): ID da turma.
            
        Returns:
            bool: True se o registro foi bem-sucedido.
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Verificar se o registro já existe
            cursor.execute(
                "SELECT 1 FROM student_classes WHERE student_id = ? AND class_id = ?",
                (student_id, class_id)
            )
            
            if cursor.fetchone():
                logger.info(f"Aluno {student_id} já está registrado na turma {class_id}")
                conn.close()
                return True
                
            # Inserir novo registro
            cursor.execute(
                "INSERT INTO student_classes (student_id, class_id) VALUES (?, ?)",
                (student_id, class_id)
            )
            
            conn.commit()
            conn.close()
            
            logger.info(f"Aluno {student_id} registrado na turma {class_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao registrar aluno em turma: {str(e)}")
            return False
            
    def record_presence_event(self, student_id, location_id, event_type):
        """
        Registra um evento de presença.
        
        Args:
            student_id (str): ID do aluno.
            location_id (int): ID do local.
            event_type (EventType): Tipo do evento.
            
        Returns:
            int: ID do evento registrado.
        """
        timestamp = datetime.now().isoformat()
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                """INSERT INTO presence_events 
                   (student_id, location_id, event_type, timestamp) 
                   VALUES (?, ?, ?, ?)""",
                (student_id, location_id, event_type.value, timestamp)
            )
            
            event_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"Evento de presença registrado: Aluno {student_id}, Local {location_id}, Evento {event_type.value}")
            
            # Atualizar localização atual do aluno
            with self.locations_lock:
                if event_type == EventType.ENTRY:
                    self.current_locations[student_id] = {
                        'location': location_id,
                        'timestamp': timestamp
                    }
                    
                    # Iniciar nova sessão de presença
                    self._start_presence_session(student_id, location_id, timestamp)
                    
                elif event_type == EventType.EXIT:
                    # Finalizar sessão de presença
                    if student_id in self.current_locations:
                        prev_location = self.current_locations[student_id]['location']
                        entry_time = self.current_locations[student_id]['timestamp']
                        
                        if prev_location == location_id:
                            self._end_presence_session(student_id, location_id, entry_time, timestamp)
                            
                        del self.current_locations[student_id]
            
            return event_id
            
        except Exception as e:
            logger.error(f"Erro ao registrar evento de presença: {str(e)}")
            raise
            
    def _start_presence_session(self, student_id, location_id, timestamp):
        """
        Inicia uma nova sessão de presença.
        
        Args:
            student_id (str): ID do aluno.
            location_id (int): ID do local.
            timestamp (str): Timestamp de entrada.
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                """INSERT INTO presence_sessions 
                   (student_id, location_id, entry_timestamp) 
                   VALUES (?, ?, ?)""",
                (student_id, location_id, timestamp)
            )
            
            session_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"Sessão de presença iniciada: Aluno {student_id}, Local {location_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"Erro ao iniciar sessão de presença: {str(e)}")
            
    def _end_presence_session(self, student_id, location_id, entry_timestamp, exit_timestamp):
        """
        Finaliza uma sessão de presença.
        
        Args:
            student_id (str): ID do aluno.
            location_id (int): ID do local.
            entry_timestamp (str): Timestamp de entrada.
            exit_timestamp (str): Timestamp de saída.
        """
        try:
            # Calcular duração
            entry_time = datetime.fromisoformat(entry_timestamp)
            exit_time = datetime.fromisoformat(exit_timestamp)
            duration_seconds = int((exit_time - entry_time).total_seconds())
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                """UPDATE presence_sessions 
                   SET exit_timestamp = ?, duration_seconds = ? 
                   WHERE student_id = ? AND location_id = ? AND entry_timestamp = ?""",
                (exit_timestamp, duration_seconds, student_id, location_id, entry_timestamp)
            )
            
            conn.commit()
            conn.close()
            
            logger.info(f"Sessão de presença finalizada: Aluno {student_id}, Local {location_id}, Duração {duration_seconds}s")
            
        except Exception as e:
            logger.error(f"Erro ao finalizar sessão de presença: {str(e)}")
            
    def update_student_location(self, student_id, location_id):
        """
        Atualiza a localização de um aluno com base em detecção facial.
        
        Args:
            student_id (str): ID do aluno.
            location_id (int): ID do local.
            
        Returns:
            bool: True se a atualização gerou um evento, False caso contrário.
        """
        current_time = datetime.now()
        timestamp = current_time.isoformat()
        
        with self.locations_lock:
            # Verificar se o aluno já está registrado em algum local
            if student_id in self.current_locations:
                prev_location = self.current_locations[student_id]['location']
                prev_timestamp = self.current_locations[student_id]['timestamp']
                
                # Se a localização mudou, registrar saída do local anterior e entrada no novo
                if prev_location != location_id:
                    # Registrar saída do local anterior
                    self.record_presence_event(student_id, prev_location, EventType.EXIT)
                    
                    # Registrar entrada no novo local
                    self.record_presence_event(student_id, location_id, EventType.ENTRY)
                    return True
                else:
                    # Mesmo local, apenas atualizar timestamp se passou tempo suficiente
                    prev_time = datetime.fromisoformat(prev_timestamp)
                    if (current_time - prev_time) > timedelta(minutes=5):
                        # Atualizar timestamp
                        self.current_locations[student_id]['timestamp'] = timestamp
                        
                        # Registrar evento de presença contínua
                        self.record_presence_event(student_id, location_id, EventType.PRESENCE)
                        return True
            else:
                # Primeira detecção do aluno, registrar entrada
                self.record_presence_event(student_id, location_id, EventType.ENTRY)
                return True
                
        return False
        
    def get_student_location(self, student_id):
        """
        Obtém a localização atual de um aluno.
        
        Args:
            student_id (str): ID do aluno.
     
(Content truncated due to size limit. Use line ranges to read in chunks)import face_recognition
import cv2
import os

# Pasta onde estão as fotos cadastradas
path = "faces"

known_encodings = []
known_names = []

# Carregar imagens cadastradas
for file in os.listdir(path):
    image = face_recognition.load_image_file(f"{path}/{file}")
    encoding = face_recognition.face_encodings(image)[0]
    known_encodings.append(encoding)
    known_names.append(os.path.splitext(file)[0])

print("Faces cadastradas:", known_names)

# Abrir câmera
video = cv2.VideoCapture(0)

while True:
    ret, frame = video.read()
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    faces = face_recognition.face_locations(rgb)
    encodings = face_recognition.face_encodings(rgb, faces)

    for (top, right, bottom, left), face_encoding in zip(faces, encodings):
        matches = face_recognition.compare_faces(known_encodings, face_encoding)
        name = "Desconhecido"

        if True in matches:
            match_index = matches.index(True)
            name = known_names[match_index]

        cv2.rectangle(frame, (left, top), (right, bottom), (0,255,0), 2)
        cv2.putText(frame, name, (left, top - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)

    cv2.imshow("Reconhecimento Facial - Aquila", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video.release()
cv2.destroyAllWindows()
``"""
Rotas para gerenciamento de relatórios na interface web do Sistema Áquila

Este módulo contém as rotas relacionadas ao gerenciamento de relatórios,
incluindo visualização, geração e download.
"""

import logging
import os
from datetime import datetime, timedelta
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app, send_from_directory
from flask_login import login_required, current_user

from ..models import db, AuditLog, SavedReport

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.web_interface.routes.reports')

# Criar blueprint
reports_bp = Blueprint('reports', __name__, url_prefix='/reports')

@reports_bp.route('/')
@login_required
def index():
    """Rota para listagem de relatórios."""
    # Obter parâmetros de filtro
    report_type = request.args.get('type', '')
    search = request.args.get('search', '')
    
    # Obter relatórios do usuário
    query = SavedReport.query.filter_by(user_id=current_user.id)
    
    if report_type:
        query = query.filter_by(report_type=report_type)
        
    if search:
        query = query.filter(SavedReport.report_name.ilike(f'%{search}%'))
        
    reports = query.order_by(SavedReport.created_at.desc()).all()
    
    # Tipos de relatório para o filtro
    report_types = [
        {'value': 'attendance', 'label': 'Frequência'},
        {'value': 'performance', 'label': 'Desempenho'},
        {'value': 'engagement', 'label': 'Engajamento'},
        {'value': 'at_risk', 'label': 'Alunos em Risco'}
    ]
    
    return render_template('reports/index.html', 
                          reports=reports,
                          report_types=report_types,
                          selected_type=report_type,
                          search=search)

@reports_bp.route('/view/<int:report_id>')
@login_required
def view(report_id):
    """Rota para visualização de um relatório."""
    # Buscar relatório
    report = SavedReport.query.get_or_404(report_id)
    
    # Verificar permissão
    if report.user_id != current_user.id and not current_user.is_admin():
        flash('Você não tem permissão para acessar este relatório.', 'danger')
        return redirect(url_for('reports.index'))
    
    # Registrar visualização
    log = AuditLog(
        user_id=current_user.id,
        action='report_viewed',
        entity_type='report',
        entity_id=str(report_id),
        ip_address=request.remote_addr,
        details=f"Visualização do relatório: {report.report_name}"
    )
    db.session.add(log)
    db.session.commit()
    
    # Redirecionar para o arquivo do relatório
    return redirect(report.file_path)

@reports_bp.route('/delete/<int:report_id>', methods=['POST'])
@login_required
def delete(report_id):
    """Rota para exclusão de um relatório."""
    # Buscar relatório
    report = SavedReport.query.get_or_404(report_id)
    
    # Verificar permissão
    if report.user_id != current_user.id and not current_user.is_admin():
        flash('Você não tem permissão para excluir este relatório.', 'danger')
        return redirect(url_for('reports.index'))
    
    # Registrar exclusão
    log = AuditLog(
        user_id=current_user.id,
        action='report_deleted',
        entity_type='report',
        entity_id=str(report_id),
        ip_address=request.remote_addr,
        details=f"Exclusão do relatório: {report.report_name}"
    )
    
    # Excluir arquivo físico se existir
    file_path = os.path.join(current_app.root_path, report.file_path.lstrip('/'))
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            logger.error(f"Erro ao excluir arquivo do relatório: {str(e)}")
    
    # Excluir registro do banco de dados
    db.session.delete(report)
    db.session.add(log)
    db.session.commit()
    
    flash('Relatório excluído com sucesso!', 'success')
    return redirect(url_for('reports.index'))

@reports_bp.route('/generate', methods=['GET', 'POST'])
@login_required
def generate():
    """Rota para geração de novos relatórios."""
    if request.method == 'POST':
        # Obter parâmetros do relatório
        report_type = request.form.get('report_type')
        entity_type = request.form.get('entity_type')
        entity_id = request.form.get('entity_id')
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        include_charts = 'include_charts' in request.form
        
        # Validar campos obrigatórios
        if not report_type or not entity_type or not start_date or not end_date:
            flash('Por favor, preencha todos os campos obrigatórios.', 'danger')
            return render_template('reports/generate.html')
            
        if entity_type != 'all' and not entity_id:
            flash('Por favor, selecione um aluno ou turma.', 'danger')
            return render_template('reports/generate.html')
        
        # Em um sistema real, geraríamos o relatório
        # Para este protótipo, apenas simulamos a geração
        
        # Definir nome do relatório
        if entity_type == 'student':
            entity_name = f"Aluno {entity_id}"
            report_name = f"Relatório de {report_type.capitalize()} - {entity_name} - {datetime.now().strftime('%d/%m/%Y')}"
            file_path = f"/reports/student_{entity_id}_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        elif entity_type == 'class':
            entity_name = f"Turma {entity_id}"
            report_name = f"Relatório de {report_type.capitalize()} - {entity_name} - {datetime.now().strftime('%d/%m/%Y')}"
            file_path = f"/reports/class_{entity_id}_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        else:  # all
            report_name = f"Relatório Geral de {report_type.capitalize()} - {datetime.now().strftime('%d/%m/%Y')}"
            file_path = f"/reports/all_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        
        # Criar registro do relatório
        saved_report = SavedReport(
            user_id=current_user.id,
            report_type=report_type,
            report_name=report_name,
            file_path=file_path,
            entity_id=entity_id if entity_type != 'all' else None
        )
        
        # Registrar ação
        log = AuditLog(
            user_id=current_user.id,
            action='report_generated',
            entity_type='report',
            entity_id=report_name,
            ip_address=request.remote_addr,
            details=f"Geração de relatório: {report_name}"
        )
        
        db.session.add(saved_report)
        db.session.add(log)
        db.session.commit()
        
        flash('Relatório gerado com sucesso!', 'success')
        return redirect(url_for('reports.index'))
    
    # Tipos de relatório para o formulário
    report_types = [
        {'value': 'attendance', 'label': 'Frequência'},
        {'value': 'performance', 'label': 'Desempenho'},
        {'value': 'engagement', 'label': 'Engajamento'},
        {'value': 'at_risk', 'label': 'Alunos em Risco'}
    ]
    
    # Lista de alunos para o formulário
    students = [
        {'id': 'ALUNO_001', 'name': 'Ana Silva'},
        {'id': 'ALUNO_002', 'name': 'Bruno Oliveira'},
        {'id': 'ALUNO_003', 'name': 'Carla Santos'},
        {'id': 'ALUNO_004', 'name': 'Daniel Lima'},
        {'id': 'ALUNO_005', 'name': 'Elena Martins'}
    ]
    
    # Lista de turmas para o formulário
    classes = [
        {'id': 'TURMA_1A', 'name': 'Turma 1A'},
        {'id': 'TURMA_1B', 'name': 'Turma 1B'},
        {'id': 'TURMA_2A', 'name': 'Turma 2A'},
        {'id': 'TURMA_2B', 'name': 'Turma 2B'},
        {'id': 'TURMA_3A', 'name': 'Turma 3A'}
    ]
    
    return render_template('reports/generate.html',
                          report_types=report_types,
                          students=students,
                          classes=classes)

@reports_bp.route('/scheduled')
@login_required
def scheduled():
    """Rota para listagem de relatórios agendados."""
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    scheduled_reports = [
        {
            'id': 1,
            'name': 'Relatório Semanal de Frequência - Todas as Turmas',
            'type': 'attendance',
            'entity_type': 'all',
            'frequency': 'weekly',
            'next_run': datetime.now() + timedelta(days=3),
            'recipients': ['coordenacao@escola.com']
        },
        {
            'id': 2,
            'name': 'Relatório Mensal de Desempenho - Turma 1A',
            'type': 'performance',
            'entity_type': 'class',
            'entity_id': 'TURMA_1A',
            'frequency': 'monthly',
            'next_run': datetime.now() + timedelta(days=15),
            'recipients': ['coordenacao@escola.com', 'diretoria@escola.com']
        },
        {
            'id': 3,
            'name': 'Relatório Diário de Alunos em Risco',
            'type': 'at_risk',
            'entity_type': 'all',
            'frequency': 'daily',
            'next_run': datetime.now() + timedelta(days=1),
            'recipients': ['coordenacao@escola.com']
        }
    ]
    
    return render_template('reports/scheduled.html', reports=scheduled_reports)

@reports_bp.route('/schedule', methods=['GET', 'POST'])
@login_required
def schedule():
    """Rota para agendamento de relatórios periódicos."""
    if request.method == 'POST':
        # Obter parâmetros do agendamento
        report_name = request.form.get('report_name')
        report_type = request.form.get('report_type')
        entity_type = request.form.get('entity_type')
        entity_id = request.form.get('entity_id')
        frequency = request.form.get('frequency')
        recipients = request.form.get('recipients')
        
        # Validar campos obrigatórios
        if not report_name or not report_type or not entity_type or not frequency or not recipients:
            flash('Por favor, preencha todos os campos obrigatórios.', 'danger')
            return render_template('reports/schedule.html')
            
        if entity_type != 'all' and not entity_id:
            flash('Por favor, selecione um aluno ou turma.', 'danger')
            return render_template('reports/schedule.html')
        
        # Em um sistema real, salvaríamos o agendamento no banco de dados
        # Para este protótipo, apenas simulamos o agendamento
        
        # Registrar ação
        log = AuditLog(
            user_id=current_user.id,
            action='report_scheduled',
            ip_address=request.remote_addr,
            details=f"Agendamento de relatório: {report_name} ({frequency})"
        )
        db.session.add(log)
        db.session.commit()
        
        flash('Relatório agendado com sucesso!', 'success')
        return redirect(url_for('reports.scheduled'))
    
    # Tipos de relatório para o formulário
    report_types = [
        {'value': 'attendance', 'label': 'Frequência'},
        {'value': 'performance', 'label': 'Desempenho'},
        {'value': 'engagement', 'label': 'Engajamento'},
        {'value': 'at_risk', 'label': 'Alunos em Risco'}
    ]
    
    # Lista de alunos para o formulário
    students = [
        {'id': 'ALUNO_001', 'name': 'Ana Silva'},
        {'id': 'ALUNO_002', 'name': 'Bruno Oliveira'},
        {'id': 'ALUNO_003', 'name': 'Carla Santos'},
        {'id': 'ALUNO_004', 'name': 'Daniel Lima'},
        {'id': 'ALUNO_005', 'name': 'Elena Martins'}
    ]
    
    # Lista de turmas para o formulário
    classes = [
        {'id': 'TURMA_1A', 'name': 'Turma 1A'},
        {'id': 'TURMA_1B', 'name': 'Turma 1B'},
        {'id': 'TURMA_2A', 'name': 'Turma 2A'},
        {'id': 'TURMA_2B', 'name': 'Turma 2B'},
        {'id': 'TURMA_3A', 'name': 'Turma 3A'}
    ]
    
    # Frequências disponíveis
    frequencies = [
        {'value': 'daily', 'label': 'Diário'},
        {'value': 'weekly', 'label': 'Semanal'},
        {'value': 'biweekly', 'label': 'Quinzenal'},
        {'value': 'monthly', 'label': 'Mensal'}
    ]
    
    return render_template('reports/schedule.html',
                          report_types=report_types,
                          students=students,
                          classes=classes,
                          frequencies=frequencies)

@reports_bp.route('/download/<int:report_id>')
@login_required
def download(report_id):
    """Rota para download de um relatório."""
    # Buscar relatório
    report = SavedReport.query.get_or_404(report_id)
    
    # Verificar permissão
    if report.user_id != current_user.id and not current_user.is_admin():
        flash('Você não tem permissão para baixar este relatório.', 'danger')
        return redirect(url_for('reports.index'))
    
    # Registrar download
    log = AuditLog(
        user_id=current_user.id,
        action='report_downloaded',
        entity_type='report',
        entity_id=str(report_id),
        ip_address=request.remote_addr,
        details=f"Download do relatório: {report.report_name}"
    )
    db.session.add(log)
    db.session.commit()
    
    # Extrair nome do arquivo do caminho
    filename = os.path.basename(report.file_path)
    
    # Retornar arquivo para download
    return send_from_directory(
        current_app.config['REPORTS_FOLDER'],
        filename,
        as_attachment=True
    )

@reports_bp.route('/share/<int:report_id>', methods=['POST'])
@login_required
def share(report_id):
    """Rota para compartilhamento de um relatório."""
    # Buscar relatório
    report = SavedReport.query.get_or_404(report_id)
    
    # Verificar permissão
    if report.user_id != current_user.id and not current_user.is_admin():
        flash('Você não tem permissão para compartilhar este relatório.', 'danger')
        return redirect(url_for('reports.index'))
    
    # Obter destinatários
    recipients = request.form.get('recipients', '')
    
    if not recipients:
        flash('Por favor, informe pelo menos um destinatário.', 'danger')
        return redirect(url_for('reports.index'))
    
    # Em um sistema real, enviaríamos o relatório por e-mail
    # Para este protótipo, apenas simulamos o compartilhamento
    
    # Registrar compartilhamento
    log = AuditLog(
        user_id=current_user.id,
        action='report_shared',
        entity_type='report',
        entity_id=str(report_id),
        ip_address=request.remote_addr,
        details=f"Compartilhamento do relatório: {report.report_name} com {recipients}"
    )
    db.session.add(log)
    db.session.commit()
    
    flash('Relatório compartilhado com sucesso!', 'success')
    return redirect(url_for('reports.index'))

@reports_bp.route('/templates')
@login_required
def templates():
    """Rota para listagem de modelos de relatório."""
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    report_templates = [
        {
            'id': 1,
            'name': 'Relatório Padrão de Frequência',
            'type': 'attendance',
            'description': 'Modelo padrão para relatórios de frequência, incluindo gráficos e tabelas.'
        },
        {
            'id': 2,
            'name': 'Relatório Detalhado de Desempenho',
            'type': 'performance',
            'description': 'Modelo detalhado para relatórios de desempenho, com análises aprofundadas e recomendações.'
        },
        {
            'id': 3,
            'name': 'Relatório Resumido de Engajamento',
            'type': 'engagement',
            'description': 'Modelo resumido para relatórios de engajamento, focado em métricas principais.'
        },
        {
            'id': 4,
            'name': 'Relatório de Alunos em Risco',
            'ty
(Content truncated due to size limit. Use line ranges to read in chunks)"""
Módulo de Relatórios para o Sistema Áquila

Este módulo é responsável por gerar relatórios formatados a partir dos dados
de análise de desempenho dos alunos.
"""

import logging
import os
import json
from datetime import datetime
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from jinja2 import Template
import pdfkit

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.performance_analysis.reports')

class ReportGenerator:
    """
    Classe para geração de relatórios formatados a partir dos dados de análise.
    """
    
    def __init__(self, performance_analyzer, output_dir=None):
        """
        Inicializa o gerador de relatórios.
        
        Args:
            performance_analyzer: Instância do analisador de desempenho.
            output_dir (str, opcional): Diretório para salvar os relatórios.
        """
        self.performance_analyzer = performance_analyzer
        self.output_dir = output_dir or 'data/reports'
        
        # Criar diretório de saída se não existir
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Diretório para templates HTML
        self.template_dir = os.path.join(os.path.dirname(__file__), 'templates')
        os.makedirs(self.template_dir, exist_ok=True)
        
        logger.info("Gerador de relatórios inicializado")
        
    def _create_html_templates(self):
        """
        Cria templates HTML para os relatórios se não existirem.
        """
        # Template para relatório de aluno
        student_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório do Aluno {{ student_id }}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2c3e50; text-align: center; }
                h2 { color: #3498db; margin-top: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 30px; }
                .metric { margin: 10px 0; }
                .metric-name { font-weight: bold; }
                .high { color: green; }
                .medium { color: orange; }
                .low { color: red; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .chart { text-align: center; margin: 20px 0; }
                .chart img { max-width: 100%; }
                .footer { text-align: center; margin-top: 50px; font-size: 0.8em; color: #7f8c8d; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Relatório de Desempenho do Aluno</h1>
                <p><strong>ID do Aluno:</strong> {{ student_id }}</p>
                <p><strong>Turma:</strong> {{ class_id }}</p>
                <p><strong>Período:</strong> {{ period_start }} a {{ period_end }}</p>
                <p><strong>Data do Relatório:</strong> {{ report_date }}</p>
            </div>
            
            <div class="section">
                <h2>Resumo de Engajamento</h2>
                <div class="metric">
                    <span class="metric-name">Score de Engajamento:</span> 
                    <span class="{{ engagement_level|lower }}">{{ engagement_score }}% ({{ engagement_level }})</span>
                </div>
                
                <h3>Fatores Contribuintes</h3>
                <table>
                    <tr>
                        <th>Fator</th>
                        <th>Valor</th>
                        <th>Score</th>
                        <th>Peso</th>
                    </tr>
                    <tr>
                        <td>Frequência</td>
                        <td>{{ attendance_rate }}%</td>
                        <td>{{ attendance_score }}</td>
                        <td>40%</td>
                    </tr>
                    <tr>
                        <td>Tempo em Sala</td>
                        <td>{{ classroom_percentage }}%</td>
                        <td>{{ classroom_score }}</td>
                        <td>30%</td>
                    </tr>
                    <tr>
                        <td>Saídas de Sala</td>
                        <td>{{ exit_count }} saídas</td>
                        <td>{{ exit_score }}</td>
                        <td>20%</td>
                    </tr>
                    <tr>
                        <td>Visitas ao Banheiro</td>
                        <td>{{ bathroom_visits }} visitas (média de {{ bathroom_duration }}min)</td>
                        <td>{{ bathroom_score }}</td>
                        <td>10%</td>
                    </tr>
                </table>
            </div>
            
            <div class="section">
                <h2>Distribuição de Tempo</h2>
                <p>Análise de como o aluno distribui seu tempo nos diferentes ambientes da escola.</p>
                
                {% if time_chart %}
                <div class="chart">
                    <img src="{{ time_chart }}" alt="Distribuição de Tempo">
                </div>
                {% endif %}
                
                <table>
                    <tr>
                        <th>Local</th>
                        <th>Tempo Total</th>
                        <th>Percentual</th>
                    </tr>
                    {% for location in time_distribution %}
                    <tr>
                        <td>{{ location.name }}</td>
                        <td>{{ location.duration }}</td>
                        <td>{{ location.percentage }}%</td>
                    </tr>
                    {% endfor %}
                </table>
            </div>
            
            <div class="section">
                <h2>Histórico de Presença</h2>
                <p>Resumo da frequência do aluno nas aulas.</p>
                
                <div class="metric">
                    <span class="metric-name">Taxa de Frequência:</span> 
                    <span class="{{ attendance_class }}">{{ attendance_rate }}%</span>
                </div>
                
                <table>
                    <tr>
                        <th>Métrica</th>
                        <th>Valor</th>
                    </tr>
                    <tr>
                        <td>Total de Aulas</td>
                        <td>{{ total_classes }}</td>
                    </tr>
                    <tr>
                        <td>Aulas Presentes</td>
                        <td>{{ attended_classes }}</td>
                    </tr>
                    <tr>
                        <td>Aulas Ausentes</td>
                        <td>{{ missed_classes }}</td>
                    </tr>
                    <tr>
                        <td>Aulas com Atraso</td>
                        <td>{{ late_classes }}</td>
                    </tr>
                </table>
            </div>
            
            <div class="section">
                <h2>Comportamento em Sala</h2>
                
                <h3>Saídas de Sala</h3>
                <p>O aluno saiu da sala de aula {{ exit_count }} vezes no período analisado.</p>
                
                <h3>Visitas ao Banheiro</h3>
                <p>O aluno visitou o banheiro {{ bathroom_visits }} vezes, com duração média de {{ bathroom_duration }} minutos por visita.</p>
                
                {% if exits_chart %}
                <div class="chart">
                    <img src="{{ exits_chart }}" alt="Saídas de Sala">
                </div>
                {% endif %}
            </div>
            
            <div class="section">
                <h2>Recomendações</h2>
                <ul>
                    {% for recommendation in recommendations %}
                    <li>{{ recommendation }}</li>
                    {% endfor %}
                </ul>
            </div>
            
            <div class="footer">
                <p>Relatório gerado pelo Sistema Áquila em {{ report_date }}</p>
            </div>
        </body>
        </html>
        """
        
        # Template para relatório de turma
        class_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório da Turma {{ class_id }}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2c3e50; text-align: center; }
                h2 { color: #3498db; margin-top: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 30px; }
                .metric { margin: 10px 0; }
                .metric-name { font-weight: bold; }
                .high { color: green; }
                .medium { color: orange; }
                .low { color: red; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .chart { text-align: center; margin: 20px 0; }
                .chart img { max-width: 100%; }
                .footer { text-align: center; margin-top: 50px; font-size: 0.8em; color: #7f8c8d; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Relatório de Desempenho da Turma</h1>
                <p><strong>Turma:</strong> {{ class_id }}</p>
                <p><strong>Total de Alunos:</strong> {{ student_count }}</p>
                <p><strong>Período:</strong> {{ period_start }} a {{ period_end }}</p>
                <p><strong>Data do Relatório:</strong> {{ report_date }}</p>
            </div>
            
            <div class="section">
                <h2>Resumo de Engajamento</h2>
                <div class="metric">
                    <span class="metric-name">Engajamento Médio:</span> {{ avg_engagement }}%
                </div>
                
                <table>
                    <tr>
                        <th>Nível de Engajamento</th>
                        <th>Número de Alunos</th>
                        <th>Percentual</th>
                    </tr>
                    <tr>
                        <td class="high">Alto</td>
                        <td>{{ high_engagement_count }}</td>
                        <td>{{ high_engagement_percent }}%</td>
                    </tr>
                    <tr>
                        <td class="medium">Médio</td>
                        <td>{{ medium_engagement_count }}</td>
                        <td>{{ medium_engagement_percent }}%</td>
                    </tr>
                    <tr>
                        <td class="low">Baixo</td>
                        <td>{{ low_engagement_count }}</td>
                        <td>{{ low_engagement_percent }}%</td>
                    </tr>
                </table>
                
                {% if engagement_chart %}
                <div class="chart">
                    <img src="{{ engagement_chart }}" alt="Engajamento da Turma">
                </div>
                {% endif %}
            </div>
            
            <div class="section">
                <h2>Frequência</h2>
                <div class="metric">
                    <span class="metric-name">Frequência Média:</span> {{ avg_attendance }}%
                </div>
                
                <p>{{ below_threshold_count }} alunos ({{ below_threshold_percent }}%) estão com frequência abaixo de 75%.</p>
                
                {% if attendance_chart %}
                <div class="chart">
                    <img src="{{ attendance_chart }}" alt="Frequência da Turma">
                </div>
                {% endif %}
                
                {% if students_at_risk %}
                <h3>Alunos em Risco por Baixa Frequência</h3>
                <table>
                    <tr>
                        <th>ID do Aluno</th>
                        <th>Frequência</th>
                    </tr>
                    {% for student in students_at_risk %}
                    <tr>
                        <td>{{ student.id }}</td>
                        <td class="low">{{ student.attendance }}%</td>
                    </tr>
                    {% endfor %}
                </table>
                {% endif %}
            </div>
            
            <div class="section">
                <h2>Distribuição de Tempo</h2>
                <p>Análise de como os alunos distribuem seu tempo nos diferentes ambientes da escola.</p>
                
                {% if time_chart %}
                <div class="chart">
                    <img src="{{ time_chart }}" alt="Distribuição de Tempo">
                </div>
                {% endif %}
                
                <table>
                    <tr>
                        <th>Local</th>
                        <th>Tempo Médio</th>
                        <th>Percentual Médio</th>
                    </tr>
                    {% for location in time_distribution %}
                    <tr>
                        <td>{{ location.type }}</td>
                        <td>{{ location.avg_duration }}</td>
                        <td>{{ location.avg_percentage }}%</td>
                    </tr>
                    {% endfor %}
                </table>
            </div>
            
            <div class="section">
                <h2>Comportamento em Sala</h2>
                
                <h3>Saídas de Sala</h3>
                <p>Em média, cada aluno saiu da sala de aula {{ avg_exits }} vezes no período analisado.</p>
                
                <h3>Visitas ao Banheiro</h3>
                <p>Em média, cada aluno visitou o banheiro {{ avg_bathroom_visits }} vezes, com duração média de {{ avg_bathroom_duration }} minutos por visita.</p>
                
                {% if exits_chart %}
                <div class="chart">
                    <img src="{{ exits_chart }}" alt="Saídas de Sala">
                </div>
                {% endif %}
                
                {% if frequent_exiters %}
                <h3>Alunos com Saídas Frequentes</h3>
                <table>
                    <tr>
                        <th>ID do Aluno</th>
                        <th>Número de Saídas</th>
                    </tr>
                    {% for student in frequent_exiters %}
                    <tr>
                        <td>{{ student.id }}</td>
                        <td>{{ student.exits }}</td>
                    </tr>
                    {% endfor %}
                </table>
                {% endif %}
            </div>
            
            <div class="section">
                <h2>Recomendações</h2>
                <ul>
                    {% for recommendation in recommendations %}
                    <li>{{ recommendation }}</li>
                    {% endfor %}
                </ul>
            </div>
            
            <div class="footer">
                <p>Relatório gerado pelo Sistema Áquila em {{ report_date }}</p>
            </div>
        </body>
        </html>
        """
        
        # Salvar templates
        student_template_path = os.path.join(self.template_dir, 'student_report_template.html')
        class_template_path = os.path.join(self.template_dir, 'class_report_template.html')
        
        if not os.path.exists(student_template_path):
            with open(student_template_path, 'w') as f:
                f.write(student_templat
(Content truncated due to size limit. Use line ranges to read in chunks)import cv2

def test_rtsp_stream(rtsp_url):
    """
    Testa a conexão e captura de um stream RTSP usando OpenCV.
    Pressione 'q' para sair.
    """
    print(f"Tentando conectar ao stream RTSP: {rtsp_url}")
    cap = cv2.VideoCapture(rtsp_url)

    if not cap.isOpened():
        print(f"Erro: Não foi possível abrir o stream RTSP de {rtsp_url}")
        return

    print("Conexão bem-sucedida. Pressione 'q' para sair da visualização.")
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Erro: Não foi possível ler o frame do stream.")
            break

        cv2.imshow('RTSP Stream', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("Stream RTSP encerrado.")

if __name__ == '__main__':
    # Exemplo de URL RTSP. Você precisará substituir por uma URL real da sua câmera IP.
    # Formatos comuns:
    # - rtsp://user:password@ip_address:port/stream_path
    # - rtsp://ip_address:port/stream_path
    # Consulte a documentação da sua câmera para a URL exata.
    sample_rtsp_url = "rtsp://admin:admin123@192.168.1.100:554/stream1"
    print("\n--- Teste de Conexão RTSP ---")
    print("Por favor, edite o script 'rtsp_test.py' com a URL RTSP da sua câmera IP real.")
    print("URL de exemplo atual: ", sample_rtsp_url)
    print("\nPara executar, use: python3 /home/ubuntu/aquila/src/camera_integration/rtsp_test.py")
    # test_rtsp_stream(sample_rtsp_url) # Descomente para testar após configurar a URL
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

from ..models import db, User, SystemSettings, NotificationPreference, AuditLog

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
(Content truncated due to size limit. Use line ranges to read in chunks)"""
Rotas para gerenciamento de alunos na interface web do Sistema Áquila

Este módulo contém as rotas relacionadas ao gerenciamento de alunos,
incluindo visualização, cadastro, edição e análise de desempenho.
"""

import logging
import os
from datetime import datetime, timedelta
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from ..models import db, AuditLog, SavedReport

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.web_interface.routes.students')

# Criar blueprint
students_bp = Blueprint('students', __name__, url_prefix='/students')

@students_bp.route('/')
@login_required
def index():
    """Rota para listagem de alunos."""
    # Obter parâmetros de filtro
    class_filter = request.args.get('class', '')
    status_filter = request.args.get('status', '')
    search = request.args.get('search', '')
    
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    students = [
        {
            'id': 'ALUNO_001',
            'name': 'Ana Silva',
            'class': 'Turma 1A',
            'status': 'present',
            'attendance_rate': 95,
            'engagement_score': 88,
            'last_seen': 'Sala 101 - 10:15'
        },
        {
            'id': 'ALUNO_002',
            'name': 'Bruno Oliveira',
            'class': 'Turma 1A',
            'status': 'present',
            'attendance_rate': 92,
            'engagement_score': 85,
            'last_seen': 'Sala 101 - 10:15'
        },
        {
            'id': 'ALUNO_003',
            'name': 'Carla Santos',
            'class': 'Turma 1B',
            'status': 'absent',
            'attendance_rate': 78,
            'engagement_score': 72,
            'last_seen': 'N/A'
        },
        {
            'id': 'ALUNO_004',
            'name': 'Daniel Lima',
            'class': 'Turma 1B',
            'status': 'present',
            'attendance_rate': 88,
            'engagement_score': 80,
            'last_seen': 'Biblioteca - 10:10'
        },
        {
            'id': 'ALUNO_005',
            'name': 'Elena Martins',
            'class': 'Turma 2A',
            'status': 'present',
            'attendance_rate': 90,
            'engagement_score': 82,
            'last_seen': 'Sala 201 - 10:15'
        }
    ]
    
    # Aplicar filtros
    filtered_students = students
    
    if class_filter:
        filtered_students = [s for s in filtered_students if s['class'] == class_filter]
        
    if status_filter:
        filtered_students = [s for s in filtered_students if s['status'] == status_filter]
        
    if search:
        filtered_students = [s for s in filtered_students if search.lower() in s['name'].lower() or search in s['id']]
    
    # Lista de turmas para o filtro
    classes = ['Turma 1A', 'Turma 1B', 'Turma 2A', 'Turma 2B', 'Turma 3A']
    
    return render_template('students/index.html', 
                          students=filtered_students,
                          classes=classes,
                          class_filter=class_filter,
                          status_filter=status_filter,
                          search=search)

@students_bp.route('/<student_id>')
@login_required
def view(student_id):
    """Rota para visualização detalhada de um aluno."""
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    if student_id == 'ALUNO_001':
        student = {
            'id': 'ALUNO_001',
            'name': 'Ana Silva',
            'class': 'Turma 1A',
            'status': 'present',
            'attendance_rate': 95,
            'engagement_score': 88,
            'last_seen': 'Sala 101 - 10:15',
            'photo': '/static/img/student_placeholder.png',
            'details': {
                'age': 15,
                'grade': '9º Ano',
                'enrollment_date': '01/02/2025',
                'parent_name': 'Roberto Silva',
                'parent_contact': '(11) 98765-4321',
                'address': 'Rua das Flores, 123'
            },
            'attendance': {
                'present_days': 57,
                'absent_days': 3,
                'late_days': 2,
                'attendance_history': [
                    {'date': '01/04/2025', 'status': 'present', 'time': '07:45', 'location': 'Entrada Principal'},
                    {'date': '31/03/2025', 'status': 'present', 'time': '07:50', 'location': 'Entrada Principal'},
                    {'date': '30/03/2025', 'status': 'present', 'time': '07:40', 'location': 'Entrada Principal'},
                    {'date': '29/03/2025', 'status': 'present', 'time': '07:45', 'location': 'Entrada Principal'},
                    {'date': '28/03/2025', 'status': 'late', 'time': '08:10', 'location': 'Entrada Principal'}
                ]
            },
            'performance': {
                'classroom_time': 85,
                'exit_count': 1.2,
                'bathroom_visits': 1.5,
                'engagement_history': [
                    {'week': 'Semana 1', 'score': 82},
                    {'week': 'Semana 2', 'score': 85},
                    {'week': 'Semana 3', 'score': 88},
                    {'week': 'Semana 4', 'score': 90},
                    {'week': 'Semana 5', 'score': 88}
                ]
            },
            'location_history': [
                {'time': '10:15', 'location': 'Sala 101', 'duration': '45 min'},
                {'time': '09:30', 'location': 'Sala 101', 'duration': '45 min'},
                {'time': '09:15', 'location': 'Banheiro', 'duration': '5 min'},
                {'time': '08:30', 'location': 'Sala 101', 'duration': '45 min'},
                {'time': '07:45', 'location': 'Entrada Principal', 'duration': '10 min'}
            ]
        }
    else:
        # Aluno genérico para outros IDs
        student = {
            'id': student_id,
            'name': f'Aluno {student_id}',
            'class': 'Turma 1A',
            'status': 'present',
            'attendance_rate': 90,
            'engagement_score': 85,
            'last_seen': 'Sala 101 - 10:15',
            'photo': '/static/img/student_placeholder.png',
            'details': {
                'age': 15,
                'grade': '9º Ano',
                'enrollment_date': '01/02/2025',
                'parent_name': 'Responsável',
                'parent_contact': '(11) 98765-4321',
                'address': 'Endereço do aluno'
            },
            'attendance': {
                'present_days': 55,
                'absent_days': 5,
                'late_days': 2,
                'attendance_history': [
                    {'date': '01/04/2025', 'status': 'present', 'time': '07:45', 'location': 'Entrada Principal'},
                    {'date': '31/03/2025', 'status': 'present', 'time': '07:50', 'location': 'Entrada Principal'},
                    {'date': '30/03/2025', 'status': 'present', 'time': '07:40', 'location': 'Entrada Principal'},
                    {'date': '29/03/2025', 'status': 'absent', 'time': 'N/A', 'location': 'N/A'},
                    {'date': '28/03/2025', 'status': 'present', 'time': '07:45', 'location': 'Entrada Principal'}
                ]
            },
            'performance': {
                'classroom_time': 80,
                'exit_count': 1.5,
                'bathroom_visits': 2.0,
                'engagement_history': [
                    {'week': 'Semana 1', 'score': 80},
                    {'week': 'Semana 2', 'score': 82},
                    {'week': 'Semana 3', 'score': 85},
                    {'week': 'Semana 4', 'score': 85},
                    {'week': 'Semana 5', 'score': 85}
                ]
            },
            'location_history': [
                {'time': '10:15', 'location': 'Sala 101', 'duration': '45 min'},
                {'time': '09:30', 'location': 'Sala 101', 'duration': '45 min'},
                {'time': '09:15', 'location': 'Banheiro', 'duration': '5 min'},
                {'time': '08:30', 'location': 'Sala 101', 'duration': '45 min'},
                {'time': '07:45', 'location': 'Entrada Principal', 'duration': '10 min'}
            ]
        }
    
    # Registrar visualização
    log = AuditLog(
        user_id=current_user.id,
        action='student_viewed',
        entity_type='student',
        entity_id=student_id,
        ip_address=request.remote_addr,
        details=f"Visualização do aluno: {student_id}"
    )
    db.session.add(log)
    db.session.commit()
    
    return render_template('students/view.html', student=student)

@students_bp.route('/new', methods=['GET', 'POST'])
@login_required
def new():
    """Rota para cadastro de novo aluno."""
    if request.method == 'POST':
        # Obter dados do formulário
        student_id = request.form.get('student_id')
        name = request.form.get('name')
        class_id = request.form.get('class_id')
        age = request.form.get('age')
        grade = request.form.get('grade')
        parent_name = request.form.get('parent_name')
        parent_contact = request.form.get('parent_contact')
        address = request.form.get('address')
        
        # Validar campos obrigatórios
        if not student_id or not name or not class_id:
            flash('Por favor, preencha todos os campos obrigatórios.', 'danger')
            return render_template('students/new.html')
        
        # Processar foto do aluno, se enviada
        photo = None
        if 'photo' in request.files:
            file = request.files['photo']
            if file and file.filename:
                filename = secure_filename(f"{student_id}_{file.filename}")
                filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                photo = filepath
        
        # Em um sistema real, salvaríamos no banco de dados
        # Para este protótipo, apenas simulamos o cadastro
        
        # Registrar ação
        log = AuditLog(
            user_id=current_user.id,
            action='student_created',
            entity_type='student',
            entity_id=student_id,
            ip_address=request.remote_addr,
            details=f"Novo aluno cadastrado: {name} ({student_id})"
        )
        db.session.add(log)
        db.session.commit()
        
        flash(f'Aluno {name} cadastrado com sucesso!', 'success')
        return redirect(url_for('students.view', student_id=student_id))
    
    # Lista de turmas para o formulário
    classes = ['Turma 1A', 'Turma 1B', 'Turma 2A', 'Turma 2B', 'Turma 3A']
    
    return render_template('students/new.html', classes=classes)

@students_bp.route('/<student_id>/edit', methods=['GET', 'POST'])
@login_required
def edit(student_id):
    """Rota para edição de aluno."""
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    if student_id == 'ALUNO_001':
        student = {
            'id': 'ALUNO_001',
            'name': 'Ana Silva',
            'class': 'Turma 1A',
            'photo': '/static/img/student_placeholder.png',
            'details': {
                'age': 15,
                'grade': '9º Ano',
                'enrollment_date': '01/02/2025',
                'parent_name': 'Roberto Silva',
                'parent_contact': '(11) 98765-4321',
                'address': 'Rua das Flores, 123'
            }
        }
    else:
        student = {
            'id': student_id,
            'name': f'Aluno {student_id}',
            'class': 'Turma 1A',
            'photo': '/static/img/student_placeholder.png',
            'details': {
                'age': 15,
                'grade': '9º Ano',
                'enrollment_date': '01/02/2025',
                'parent_name': 'Responsável',
                'parent_contact': '(11) 98765-4321',
                'address': 'Endereço do aluno'
            }
        }
    
    if request.method == 'POST':
        # Obter dados do formulário
        name = request.form.get('name')
        class_id = request.form.get('class_id')
        age = request.form.get('age')
        grade = request.form.get('grade')
        parent_name = request.form.get('parent_name')
        parent_contact = request.form.get('parent_contact')
        address = request.form.get('address')
        
        # Validar campos obrigatórios
        if not name or not class_id:
            flash('Por favor, preencha todos os campos obrigatórios.', 'danger')
            return render_template('students/edit.html', student=student)
        
        # Processar foto do aluno, se enviada
        if 'photo' in request.files:
            file = request.files['photo']
            if file and file.filename:
                filename = secure_filename(f"{student_id}_{file.filename}")
                filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
        
        # Em um sistema real, atualizaríamos no banco de dados
        # Para este protótipo, apenas simulamos a atualização
        
        # Registrar ação
        log = AuditLog(
            user_id=current_user.id,
            action='student_updated',
            entity_type='student',
            entity_id=student_id,
            ip_address=request.remote_addr,
            details=f"Aluno atualizado: {name} ({student_id})"
        )
        db.session.add(log)
        db.session.commit()
        
        flash(f'Aluno {name} atualizado com sucesso!', 'success')
        return redirect(url_for('students.view', student_id=student_id))
    
    # Lista de turmas para o formulário
    classes = ['Turma 1A', 'Turma 1B', 'Turma 2A', 'Turma 2B', 'Turma 3A']
    
    return render_template('students/edit.html', student=student, classes=classes)

@students_bp.route('/<student_id>/report', methods=['GET', 'POST'])
@login_required
def generate_report(student_id):
    """Rota para geração de relatório de desempenho do aluno."""
    # Em um sistema real, estes dados seriam obtidos do banco de dados
    # Para este protótipo, usamos dados fictícios
    if student_id == 'ALUNO_001':
        student = {
            'id': 'ALUNO_001',
            'name': 'Ana Silva',
            'class': 'Turma 1A'
        }
    else:
        student = {
            'id': student_id,
            'name': f'Aluno {student_id}',
            'class': 'Turma 1A'
        }
    
    if request.method == 'POST':
        # Obter parâmetros do relatório
        report_type = request.form.get('report_type')
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        include_charts = 'include_charts' in request.form
        
        # Validar campos
        if not report_type or not start_date or not end_date:
            flash('Por favor, preencha todos os campos obrigatórios.', 'danger')
            return render_template('students/report.html', student=student)
        
        # Em um sistema real, geraríamos o relatório
        # Para este protótipo, apenas simulamos a geração
        
        # Criar registro do relatório
        report_name = f"Relatório de {report_type.capitalize()} - {student['name']} - {datetime.now().strftime('%d/%m/%Y')}"
        report_path = f"/reports/student_{student_id}_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        
        saved_report = SavedReport(
            user_id=current_user.id,
            report_type=report_type,
            report_name=report_name,
            file_path=report_path,
            entity_id=student_id
        )
        
        # Registrar ação
        log = AuditLog(
            user_i
(Content truncated due to size limit. Use line ranges to read in chunks)Python
import cv2
import time

CAMERA_INDEX = 0
LINE_X = 320
MIN_FACE_AREA = 2500

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

cap = cv2.VideoCapture(CAMERA_INDEX)

if not cap.isOpened():
    raise RuntimeError("Não consegui abrir a câmera. Verifique"""
Script de teste para o módulo de reconhecimento facial do sistema Áquila

Este script realiza testes unitários para o módulo de reconhecimento facial,
verificando se todas as funcionalidades estão operando corretamente.
"""

import os
import sys
import logging
import unittest
import numpy as np
import cv2
from unittest.mock import MagicMock, patch

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.tests.facial_recognition')

# Adicionar diretório pai ao path para importar os módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importar módulos do sistema
from src.facial_recognition.face_detector import FaceDetector
from src.facial_recognition.face_recognizer import FaceRecognizer
from src.facial_recognition.facial_recognition_system import FacialRecognitionSystem

class FacialRecognitionTest(unittest.TestCase):
    """Testes unitários para o módulo de reconhecimento facial."""
    
    def setUp(self):
        """Configuração inicial para os testes."""
        logger.info("Iniciando testes do módulo de reconhecimento facial")
        
        # Criar instâncias dos componentes
        self.face_detector = FaceDetector()
        self.face_recognizer = FaceRecognizer()
        self.facial_recognition_system = FacialRecognitionSystem()
        
        # Criar imagem de teste (matriz preta 300x300)
        self.test_image = np.zeros((300, 300, 3), dtype=np.uint8)
        
        # Simular um rosto na imagem (retângulo branco)
        self.test_image[100:200, 100:200] = 255
        
    @patch('cv2.CascadeClassifier.detectMultiScale')
    def test_face_detection(self, mock_detect):
        """Testa a detecção de faces em uma imagem."""
        logger.info("Testando detecção de faces")
        
        # Configurar o mock para retornar um rosto detectado
        mock_detect.return_value = np.array([[100, 100, 100, 100]])
        
        # Detectar faces na imagem de teste
        faces = self.face_detector.detect_faces(self.test_image)
        
        # Verificar se uma face foi detectada
        self.assertEqual(len(faces), 1)
        self.assertEqual(faces[0][0], 100)  # x
        self.assertEqual(faces[0][1], 100)  # y
        self.assertEqual(faces[0][2], 100)  # width
        self.assertEqual(faces[0][3], 100)  # height
        
        logger.info("Detecção de faces testada com sucesso")
        
    @patch('src.facial_recognition.face_recognizer.FaceRecognizer.recognize_face')
    def test_face_recognition(self, mock_recognize):
        """Testa o reconhecimento de faces."""
        logger.info("Testando reconhecimento de faces")
        
        # Configurar o mock para retornar um aluno reconhecido
        mock_recognize.return_value = {
            'student_id': 'ALUNO_001',
            'confidence': 0.95,
            'name': 'Ana Silva'
        }
        
        # Reconhecer face na imagem de teste
        face_region = self.test_image[100:200, 100:200]
        recognition_result = self.face_recognizer.recognize_face(face_region)
        
        # Verificar se o aluno foi reconhecido corretamente
        self.assertEqual(recognition_result['student_id'], 'ALUNO_001')
        self.assertEqual(recognition_result['name'], 'Ana Silva')
        self.assertAlmostEqual(recognition_result['confidence'], 0.95)
        
        logger.info("Reconhecimento de faces testado com sucesso")
        
    @patch('src.facial_recognition.face_detector.FaceDetector.detect_faces')
    @patch('src.facial_recognition.face_recognizer.FaceRecognizer.recognize_face')
    def test_facial_recognition_system(self, mock_recognize, mock_detect):
        """Testa o sistema completo de reconhecimento facial."""
        logger.info("Testando sistema completo de reconhecimento facial")
        
        # Configurar mocks
        mock_detect.return_value = np.array([[100, 100, 100, 100]])
        mock_recognize.return_value = {
            'student_id': 'ALUNO_001',
            'confidence': 0.95,
            'name': 'Ana Silva'
        }
        
        # Processar imagem no sistema completo
        results = self.facial_recognition_system.process_image(
            self.test_image, 
            location='Sala 101'
        )
        
        # Verificar resultados
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['student_id'], 'ALUNO_001')
        self.assertEqual(results[0]['name'], 'Ana Silva')
        self.assertEqual(results[0]['location'], 'Sala 101')
        self.assertAlmostEqual(results[0]['confidence'], 0.95)
        self.assertIn('timestamp', results[0])
        
        logger.info("Sistema completo de reconhecimento facial testado com sucesso")
        
    def test_face_detection_no_faces(self):
        """Testa a detecção quando não há faces na imagem."""
        logger.info("Testando detecção sem faces")
        
        # Criar imagem sem faces (totalmente preta)
        no_face_image = np.zeros((300, 300, 3), dtype=np.uint8)
        
        # Detectar faces
        faces = self.face_detector.detect_faces(no_face_image)
        
        # Verificar que nenhuma face foi detectada
        self.assertEqual(len(faces), 0)
        
        logger.info("Detecção sem faces testada com sucesso")
        
    def test_multiple_faces_detection(self):
        """Testa a detecção de múltiplas faces."""
        logger.info("Testando detecção de múltiplas faces")
        
        # Configurar o detector para retornar múltiplas faces
        self.face_detector.detector.detectMultiScale = MagicMock(
            return_value=np.array([
                [50, 50, 100, 100],
                [200, 50, 100, 100]
            ])
        )
        
        # Detectar faces
        faces = self.face_detector.detect_faces(self.test_image)
        
        # Verificar que duas faces foram detectadas
        self.assertEqual(len(faces), 2)
        
        logger.info("Detecção de múltiplas faces testada com sucesso")
        
    def tearDown(self):
        """Limpeza após os testes."""
        logger.info("Finalizando testes do módulo de reconhecimento facial")
        
        # Limpar objetos
        self.face_detector = None
        self.face_recognizer = None
        self.facial_recognition_system = None
        self.test_image = None

if __name__ == '__main__':
    unittest.main()
"""
Script de teste para o sistema Áquila

Este script realiza testes de integração entre os diferentes módulos do sistema Áquila,
verificando se todos os componentes funcionam corretamente juntos.
"""

import os
import sys
import logging
import unittest
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.tests')

# Adicionar diretório pai ao path para importar os módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importar módulos do sistema
from src.facial_recognition.facial_recognition_system import FacialRecognitionSystem
from src.presence_tracking.presence_tracker import PresenceTracker
from src.performance_analysis.performance_analyzer import PerformanceAnalyzer

class AquilaIntegrationTest(unittest.TestCase):
    """Testes de integração para o sistema Áquila."""
    
    def setUp(self):
        """Configuração inicial para os testes."""
        logger.info("Iniciando testes de integração do sistema Áquila")
        
        # Criar instâncias dos módulos principais
        self.facial_recognition = FacialRecognitionSystem()
        self.presence_tracker = PresenceTracker()
        self.performance_analyzer = PerformanceAnalyzer()
        
        # Dados de teste
        self.test_student_id = "ALUNO_TEST_001"
        self.test_class_id = "TURMA_TEST_1A"
        self.test_location = "Sala 101"
        
    def test_facial_recognition_to_presence_tracking(self):
        """Testa a integração entre reconhecimento facial e rastreamento de presença."""
        logger.info("Testando integração entre reconhecimento facial e rastreamento de presença")
        
        # Simular detecção de um aluno pelo sistema de reconhecimento facial
        detection_result = {
            'student_id': self.test_student_id,
            'confidence': 0.95,
            'timestamp': datetime.now(),
            'location': self.test_location
        }
        
        # Registrar a presença com base na detecção
        presence_result = self.presence_tracker.register_presence(
            student_id=detection_result['student_id'],
            location=detection_result['location'],
            timestamp=detection_result['timestamp']
        )
        
        # Verificar se o registro de presença foi bem-sucedido
        self.assertTrue(presence_result['success'])
        self.assertEqual(presence_result['student_id'], self.test_student_id)
        self.assertEqual(presence_result['location'], self.test_location)
        
        logger.info("Integração entre reconhecimento facial e rastreamento de presença testada com sucesso")
        
    def test_presence_tracking_to_performance_analysis(self):
        """Testa a integração entre rastreamento de presença e análise de desempenho."""
        logger.info("Testando integração entre rastreamento de presença e análise de desempenho")
        
        # Simular registros de presença para um aluno
        presence_records = [
            {
                'student_id': self.test_student_id,
                'location': 'Sala 101',
                'timestamp': datetime.now(),
                'event_type': 'entry'
            },
            {
                'student_id': self.test_student_id,
                'location': 'Banheiro',
                'timestamp': datetime.now(),
                'event_type': 'exit'
            },
            {
                'student_id': self.test_student_id,
                'location': 'Sala 101',
                'timestamp': datetime.now(),
                'event_type': 'entry'
            }
        ]
        
        # Analisar os registros de presença
        analysis_result = self.performance_analyzer.analyze_presence_records(
            student_id=self.test_student_id,
            presence_records=presence_records
        )
        
        # Verificar se a análise foi bem-sucedida
        self.assertTrue(analysis_result['success'])
        self.assertEqual(analysis_result['student_id'], self.test_student_id)
        self.assertIn('classroom_time', analysis_result)
        self.assertIn('exit_count', analysis_result)
        self.assertIn('bathroom_visits', analysis_result)
        
        logger.info("Integração entre rastreamento de presença e análise de desempenho testada com sucesso")
        
    def test_full_system_integration(self):
        """Testa a integração completa do sistema."""
        logger.info("Testando integração completa do sistema")
        
        # Simular detecção de um aluno pelo sistema de reconhecimento facial
        detection_result = {
            'student_id': self.test_student_id,
            'confidence': 0.95,
            'timestamp': datetime.now(),
            'location': self.test_location
        }
        
        # Registrar a presença com base na detecção
        presence_result = self.presence_tracker.register_presence(
            student_id=detection_result['student_id'],
            location=detection_result['location'],
            timestamp=detection_result['timestamp']
        )
        
        # Obter registros de presença para o aluno
        presence_records = self.presence_tracker.get_student_records(self.test_student_id)
        
        # Analisar os registros de presença
        analysis_result = self.performance_analyzer.analyze_presence_records(
            student_id=self.test_student_id,
            presence_records=presence_records
        )
        
        # Verificar se todo o fluxo foi bem-sucedido
        self.assertTrue(presence_result['success'])
        self.assertTrue(analysis_result['success'])
        self.assertEqual(analysis_result['student_id'], self.test_student_id)
        
        # Verificar se o aluno está em risco com base na análise
        at_risk_result = self.performance_analyzer.check_student_at_risk(self.test_student_id)
        self.assertIn('is_at_risk', at_risk_result)
        self.assertIn('risk_factors', at_risk_result)
        
        logger.info("Integração completa do sistema testada com sucesso")
        
    def test_class_performance_analysis(self):
        """Testa a análise de desempenho de uma turma."""
        logger.info("Testando análise de desempenho de turma")
        
        # Simular análise de desempenho para uma turma
        class_analysis = self.performance_analyzer.analyze_class_performance(self.test_class_id)
        
        # Verificar se a análise foi bem-sucedida
        self.assertTrue(class_analysis['success'])
        self.assertEqual(class_analysis['class_id'], self.test_class_id)
        self.assertIn('attendance_rate', class_analysis)
        self.assertIn('avg_classroom_time', class_analysis)
        self.assertIn('avg_exit_count', class_analysis)
        self.assertIn('at_risk_count', class_analysis)
        
        logger.info("Análise de desempenho de turma testada com sucesso")
        
    def tearDown(self):
        """Limpeza após os testes."""
        logger.info("Finalizando testes de integração do sistema Áquila")
        
        # Limpar dados de teste
        self.facial_recognition = None
        self.presence_tracker = None
        self.performance_analyzer = None

if __name__ == '__main__':
    unittest.main()
"""
Script de teste para o módulo de análise de desempenho do sistema Áquila

Este script realiza testes unitários para o módulo de análise de desempenho,
verificando se todas as funcionalidades estão operando corretamente.
"""

import os
import sys
import logging
import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.tests.performance_analysis')

# Adicionar diretório pai ao path para importar os módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importar módulos do sistema
from src.performance_analysis.performance_analyzer import PerformanceAnalyzer
from src.performance_analysis.report_generator import ReportGenerator

class PerformanceAnalysisTest(unittest.TestCase):
    """Testes unitários para o módulo de análise de desempenho."""
    
    def setUp(self):
        """Configuração inicial para os testes."""
        logger.info("Iniciando testes do módulo de análise de desempenho")
        
        # Criar instâncias dos componentes
        self.performance_analyzer = PerformanceAnalyzer()
        self.report_generator = ReportGenerator()
        
        # Dados de teste
        self.test_student_id = "ALUNO_TEST_001"
        self.test_class_id = "TURMA_TEST_1A"
        
        # Simular registros de presença
        self.test_presence_records = [
            {
                'student_id': self.test_student_id,
                'location': 'Sala 101',
                'timestamp': datetime.now() - timedelta(hours=4),
                'event_type': 'entry'
            },
            {
                'student_id': self.test_student_id,
                'location': 'Banheiro',
                'timestamp': datetime.now() - timedelta(hours=3),
                'event_type': 'exit',
                'duration': 60  # 60 minutos
            },
            {
                'student_id': self.test_student_id,
                'location': 'Sala 101',
                'timestamp': datetime.now() - timedelta(hours=2, minutes=50),
                'event_type': 'entry'
            },
            {
                'student_id': self.test_student_id,
                'location': 'Corredor',
                'timestamp': datetime.now() - timedelta(hours=2),
                'event_type': 'exit',
                'duration': 50  # 50 minutos
            },
            {
                'student_id': self.test_student_id,
                'location': 'Sala 101',
                'timestamp': datetime.now() - timedelta(hours=1, minutes=50),
                'event_type': 'entry'
            }
        ]
        
    def test_analyze_presence_records(self):
        """Testa a análise de registros de presença."""
        logger.info("Testando análise de registros de presença")
        
        # Analisar registros de presença
        analysis_result = self.performance_analyzer.analyze_presence_records(
            student_id=self.test_student_id,
            presence_records=self.test_presence_records
        )
        
        # Verificar resultado
        self.assertTrue(analysis_result['success'])
        self.assertEqual(analysis_result['student_id'], self.test_student_id)
        self.assertIn('classroom_time', analysis_result)
        self.assertIn('exit_count', analysis_result)
        self.assertIn('bathroom_visits', analysis_result)
        
        logger.info("Análise de registros de presença testada com sucesso")
        
    def test_calculate_engagement_score(self):
        """Testa o cálculo do score de engajamento."""
        logger.info("Testando cálculo de score de engajamento")
        
        # Configurar dados de teste
        attendance_rate = 90
        classroom_time_percentage = 85
        exit_count = 1.5
        bathroom_visits = 2.0
        
        # Calcular score de engajamento
        engagement_score = self.performance_analyzer.calculate_engagement_score(
            attendance_rate=attendance_rate,
            classroom_time_percentage=classroom_time_percentage,
            exit_count=exit_count,
            bathroom_visits=bathroom_visits
        )
        
        # Verificar resultado
        self.assertIsInstance(engagement_score, (int, float))
        self.assertTrue(0 <= engagement_score <= 100)
        
        logger.info("Cálculo de score de engajamento testado com sucesso")
        
    def test_check_student_at_risk(self):
        """Testa a verificação de alunos em situação de risco."""
        logger.info("Testando verificação de alunos em situação de risco")
        
        # Configurar mocks
        self.performance_analyzer.get_student_metrics = MagicMock(
            return_value={
                'attendance_rate': 65,  # Abaixo do limiar de 75%
                'classroom_time_percentage': 60,  # Abaixo do limiar de 70%
                'exit_count': 3.5,  # Acima do limiar de 3
                'bathroom_visits': 2.0,
                'engagement_score': 55  # Abaixo do limiar de 60
            }
        )
        
        # Verificar se o aluno está em risco
        at_risk_result = self.performance_analyzer.check_student_at_risk(self.test_student_id)
        
        # Verificar resultado
        self.assertTrue(at_risk_result['is_at_risk'])
        self.assertIsInstance(at_risk_result['risk_factors'], list)
        self.assertTrue(len(at_risk_result['risk_factors']) > 0)
        
        logger.info("Verificação de alunos em situação de risco testada com sucesso")
        
    def test_analyze_class_performance(self):
        """Testa a análise de desempenho de uma turma."""
        logger.info("Testando análise de desempenho de turma")
        
        # Configurar mocks
        self.performance_analyzer.get_class_students = MagicMock(
            return_value=[
                'ALUNO_001', 'ALUNO_002', 'ALUNO_003', 'ALUNO_004', 'ALUNO_005'
            ]
        )
        
        self.performance_analyzer.get_student_metrics = MagicMock(
            side_effect=[
                {
                    'attendance_rate': 95,
                    'classroom_time_percentage': 90,
                    'exit_count': 1.0,
                    'bathroom_visits': 1.5,
                    'engagement_score': 92
                },
                {
                    'attendance_rate': 88,
                    'classroom_time_percentage': 85,
                    'exit_count': 1.2,
                    'bathroom_visits': 1.8,
                    'engagement_score': 85
                },
                {
                    'attendance_rate': 65,
                    'classroom_time_percentage': 60,
                    'exit_count': 3.5,
                    'bathroom_visits': 2.0,
                    'engagement_score': 55
                },
                {
                    'attendance_rate': 92,
                    'classroom_time_percentage': 88,
                    'exit_count': 1.1,
                    'bathroom_visits': 1.2,
                    'engagement_score': 90
                },
                {
                    'attendance_rate': 78,
                    'classroom_time_percentage': 75,
                    'exit_count': 2.0,
                    'bathroom_visits': 1.5,
                    'engagement_score': 75
                }
            ]
        )
        
        self.performance_analyzer.check_student_at_risk = MagicMock(
            side_effect=[
                {'is_at_risk': False, 'risk_factors': []},
                {'is_at_risk': False, 'risk_factors': []},
                {'is_at_risk': True, 'risk_factors': ['Frequência abaixo de 75%', 'Menos de 70% do tempo em sala de aula']},
                {'is_at_risk': False, 'risk_factors': []},
                {'is_at_risk': False, 'risk_factors': []}
            ]
        )
        
        # Analisar desempenho da turma
        class_analysis = self.performance_analyzer.analyze_class_performance(self.test_class_id)
        
        # Verificar resultado
        self.assertTrue(class_analysis['success'])
        self.assertEqual(class_analysis['class_id'], self.test_class_id)
        self.assertIn('attendance_rate', class_analysis)
        self.assertIn('avg_classroom_time', class_analysis)
        self.assertIn('avg_exit_count', class_analysis)
        self.assertIn('at_risk_count', class_analysis)
        self.assertEqual(class_analysis['at_risk_count'], 1)  # Um aluno em risco
        
        logger.info("Análise de desempenho de turma testada com sucesso")
        
    def test_identify_attendance_patterns(self):
        """Testa a identificação de padrões de frequência."""
        logger.info("Testando identificação de padrões de frequência")
        
        # Configurar dados de teste
        attendance_history = [
            {'date': datetime.now() - timedelta(days=10), 'status': 'present'},
            {'date': datetime.now() - timedelta(days=9), 'status': 'present'},
            {'date': datetime.now() - timedelta(days=8), 'status': 'absent'},
            {'date': datetime.now() - timedelta(days=7), 'status': 'present'},
            {'date': datetime.now() - timedelta(days=6), 'status': 'present'},
            {'date': datetime.now() - timedelta(days=5), 'status': 'absent'},
            {'date': datetime.now() - timedelta(days=4), 'status': 'present'},
            {'date': datetime.now() - timedelta(days=3), 'status': 'present'},
            {'date': datetime.now() - timedelta(days=2), 'status': 'absent'},
            {'date': datetime.now() - timedelta(days=1), 'status': 'present'}
        ]
        
        # Identificar padrões
        patterns = self.performance_analyzer.identify_attendance_patterns(attendance_history)
        
        # Verificar resultado
        self.assertIsInstance(patterns, dict)
        self.assertIn('absence_pattern', patterns)
        self.assertIn('consecutive_absences', patterns)
        self.assertIn('weekday_absences', patterns)
        
        logger.info("Identificação de padrões de frequência testada com sucesso")
        
    def test_generate_performance_report(self):
        """Testa a geração de relatório de desempenho."""
        logger.info("Testando geração de relatório de desempenho")
        
        # Configurar mocks
        self.performance_analyzer.get_student_metrics = MagicMock(
            return_value={
                'attendance_rate': 88,
                'classroom_time_percentage': 85,
                'exit_count': 1.2,
                'bathroom_visits': 1.8,
                'engagement_score': 85
            }
        )
        
        self.performance_analyzer.check_student_at_risk = MagicMock(
            return_value={
                'is_at_risk': False,
                'risk_factors': []
            }
        )
        
        # Gerar relatório
        report = self.report_generator.generate_student_performance_report(
            student_id=self.test_student_id,
            start_date=datetime.now() - timedelta(days=30),
            end_date=datetime.now()
        )
        
        # Verificar resultado
        self.assertIsInstance(report, dict)
        self.assertEqual(report['student_id'], self.test_student_id)
        self.assertIn('metrics', report)
        self.assertIn('recommendations', report)
        self.assertIn('generated_at', report)
        
        logger.info("Geração de relatório de desempenho testada com sucesso")
        
    def tearDown(self):
        """Limpeza após os testes."""
        logger.info("Finalizando testes do módulo de análise de desempenho")
        
        # Limpar objetos
        self.performance_analyzer = None
        self.report_generator = None
        self.test_presence_records = None

if __name__ == '__main__':
    unittest.main()
"""
Script de teste para o módulo de registro de presença do sistema Áquila

Este script realiza testes unitários para o módulo de registro de presença,
verificando se todas as funcionalidades estão operando corretamente.
"""

import os
import sys
import logging
import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.tests.presence_tracking')

# Adicionar diretório pai ao path para importar os módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importar módulos do sistema
from src.presence_tracking.presence_tracker import PresenceTracker
from src.presence_tracking.presence_integrator import PresenceIntegrator

class PresenceTrackingTest(unittest.TestCase):
    """Testes unitários para o módulo de registro de presença."""
    
    def setUp(self):
        """Configuração inicial para os testes."""
        logger.info("Iniciando testes do módulo de registro de presença")
        
        # Criar instâncias dos componentes
        self.presence_tracker = PresenceTracker()
        self.presence_integrator = PresenceIntegrator()
        
        # Dados de teste
        self.test_student_id = "ALUNO_TEST_001"
        self.test_class_id = "TURMA_TEST_1A"
        self.test_location = "Sala 101"
        self.test_timestamp = datetime.now()
        
    def test_register_presence(self):
        """Testa o registro de presença de um aluno."""
        logger.info("Testando registro de presença")
        
        # Registrar presença
        result = self.presence_tracker.register_presence(
            student_id=self.test_student_id,
            location=self.test_location,
            timestamp=self.test_timestamp
        )
        
        # Verificar resultado
        self.assertTrue(result['success'])
        self.assertEqual(result['student_id'], self.test_student_id)
        self.assertEqual(result['location'], self.test_location)
        self.assertEqual(result['event_type'], 'entry')
        
        logger.info("Registro de presença testado com sucesso")
        
    def test_register_exit(self):
        """Testa o registro de saída de um aluno."""
        logger.info("Testando registro de saída")
        
        # Registrar entrada primeiro
        self.presence_tracker.register_presence(
            student_id=self.test_student_id,
            location=self.test_location,
            timestamp=self.test_timestamp - timedelta(minutes=30)
        )
        
        # Registrar saída
        result = self.presence_tracker.register_exit(
            student_id=self.test_student_id,
            location="Corredor",
            timestamp=self.test_timestamp
        )
        
        # Verificar resultado
        self.assertTrue(result['success'])
        self.assertEqual(result['student_id'], self.test_student_id)
        self.assertEqual(result['location'], "Corredor")
        self.assertEqual(result['event_type'], 'exit')
        self.assertIn('duration', result)
        
        logger.info("Registro de saída testado com sucesso")
        
    def test_get_student_records(self):
        """Testa a obtenção de registros de um aluno."""
        logger.info("Testando obtenção de registros de aluno")
        
        # Registrar alguns eventos
        self.presence_tracker.register_presence(
            student_id=self.test_student_id,
            location=self.test_location,
            timestamp=self.test_timestamp - timedelta(hours=2)
        )
        
        self.presence_tracker.register_exit(
            student_id=self.test_student_id,
            location="Banheiro",
            timestamp=self.test_timestamp - timedelta(hours=1, minutes=30)
        )
        
        self.presence_tracker.register_presence(
            student_id=self.test_student_id,
            location=self.test_location,
            timestamp=self.test_timestamp - timedelta(hours=1)
        )
        
        # Obter registros
        records = self.presence_tracker.get_student_records(self.test_student_id)
        
        # Verificar registros
        self.assertIsInstance(records, list)
        self.assertEqual(len(records), 3)
        self.assertEqual(records[0]['student_id'], self.test_student_id)
        self.assertEqual(records[0]['location'], self.test_location)
        
        logger.info("Obtenção de registros de aluno testada com sucesso")
        
    def test_calculate_attendance_rate(self):
        """Testa o cálculo da taxa de frequência de um aluno."""
        logger.info("Testando cálculo de taxa de frequência")
        
        # Configurar dados de teste
        self.presence_tracker.get_student_attendance_days = MagicMock(
            return_value={
                'present_days': 18,
                'absent_days': 2,
                'total_days': 20
            }
        )
        
        # Calcular taxa de frequência
        attendance_rate = self.presence_tracker.calculate_attendance_rate(self.test_student_id)
        
        # Verificar resultado
        self.assertEqual(attendance_rate, 90)  # (18/20) * 100 = 90%
        
        logger.info("Cálculo de taxa de frequência testado com sucesso")
        
    def test_calculate_classroom_time(self):
        """Testa o cálculo do tempo em sala de aula."""
        logger.info("Testando cálculo de tempo em sala de aula")
        
        # Configurar dados de teste
        test_records = [
            {
                'student_id': self.test_student_id,
                'location': self.test_location,
                'timestamp': self.test_timestamp - timedelta(hours=3),
                'event_type': 'entry',
                'duration': None
            },
            {
                'student_id': self.test_student_id,
                'location': 'Banheiro',
                'timestamp': self.test_timestamp - timedelta(hours=2),
                'event_type': 'exit',
                'duration': 60  # 60 minutos
            },
            {
                'student_id': self.test_student_id,
                'location': self.test_location,
                'timestamp': self.test_timestamp - timedelta(hours=1, minutes=50),
                'event_type': 'entry',
                'duration': None
            },
            {
                'student_id': self.test_student_id,
                'location': 'Corredor',
                'timestamp': self.test_timestamp - timedelta(minutes=50),
                'event_type': 'exit',
                'duration': 60  # 60 minutos
            }
        ]
        
        self.presence_tracker.get_student_records = MagicMock(return_value=test_records)
        
        # Calcular tempo em sala de aula
        classroom_time = self.presence_tracker.calculate_classroom_time(
            self.test_student_id,
            start_date=self.test_timestamp - timedelta(days=1),
            end_date=self.test_timestamp
        )
        
        # Verificar resultado
        self.assertEqual(classroom_time, 120)  # 2 horas (120 minutos) em sala
        
        logger.info("Cálculo de tempo em sala de aula testado com sucesso")
        
    def test_detect_bathroom_pattern(self):
        """Testa a detecção de padrões de visitas ao banheiro."""
        logger.info("Testando detecção de padrões de visitas ao banheiro")
        
        # Configurar dados de teste
        test_records = [
            {
                'student_id': self.test_student_id,
                'location': self.test_location,
                'timestamp': self.test_timestamp - timedelta(hours=4),
                'event_type': 'entry'
            },
            {
                'student_id': self.test_student_id,
                'location': 'Banheiro',
                'timestamp': self.test_timestamp - timedelta(hours=3),
                'event_type': 'exit'
            },
            {
                'student_id': self.test_student_id,
                'location': self.test_location,
                'timestamp': self.test_timestamp - timedelta(hours=2, minutes=50),
                'event_type': 'entry'
            },
            {
                'student_id': self.test_student_id,
                'location': 'Banheiro',
                'timestamp': self.test_timestamp - timedelta(hours=2),
                'event_type': 'exit'
            },
            {
                'student_id': self.test_student_id,
                'location': self.test_location,
                'timestamp': self.test_timestamp - timedelta(hours=1, minutes=50),
                'event_type': 'entry'
            },
            {
                'student_id': self.test_student_id,
                'location': 'Banheiro',
                'timestamp': self.test_timestamp - timedelta(hours=1),
                'event_type': 'exit'
            },
            {
                'student_id': self.test_student_id,
                'location': self.test_location,
                'timestamp': self.test_timestamp - timedelta(minutes=50),
                'event_type': 'entry'
            }
        ]
        
        self.presence_tracker.get_student_records = MagicMock(return_value=test_records)
        
        # Detectar padrões de visitas ao banheiro
        bathroom_visits = self.presence_tracker.detect_bathroom_pattern(
            self.test_student_id,
            start_date=self.test_timestamp - timedelta(days=1),
            end_date=self.test_timestamp
        )
        
        # Verificar resultado
        self.assertEqual(bathroom_visits['count'], 3)
        self.assertEqual(bathroom_visits['average_duration'], 10)  # Valor fictício para o teste
        
        logger.info("Detecção de padrões de visitas ao banheiro testada com sucesso")
        
    @patch('src.presence_tracking.presence_tracker.PresenceTracker.register_presence')
    def test_presence_integrator(self, mock_register):
        """Testa o integrador de presença."""
        logger.info("Testando integrador de presença")
        
        # Configurar mock
        mock_register.return_value = {
            'success': True,
            'student_id': self.test_student_id,
            'location': self.test_location,
            'event_type': 'entry'
        }
        
        # Simular detecção de reconhecimento facial
        detection = {
            'student_id': self.test_student_id,
            'confidence': 0.95,
            'timestamp': self.test_timestamp,
            'location': self.test_location
        }
        
        # Processar detecção
        result = self.presence_integrator.process_detection(detection)
        
        # Verificar resultado
        self.assertTrue(result['success'])
        self.assertEqual(result['student_id'], self.test_student_id)
        self.assertEqual(result['location'], self.test_location)
        
        logger.info("Integrador de presença testado com sucesso")
        
    def tearDown(self):
        """Limpeza após os testes."""
        logger.info("Finalizando testes do módulo de registro de presença")
        
        # Limpar objetos
        self.presence_tracker = None
        self.presence_integrator = None

if __name__ == '__main__':
    unittest.main()
