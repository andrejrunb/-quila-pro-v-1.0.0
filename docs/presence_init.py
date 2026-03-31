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
