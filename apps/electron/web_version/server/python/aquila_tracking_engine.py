"""
Motor de Rastreamento Integrado para Áquila Pro

Este módulo integra reconhecimento facial com rastreamento de presença,
criando um sistema completo de monitoramento de alunos em tempo real.
"""

import cv2
import logging
import threading
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import asdict
import queue

from facial_recognition_system import FacialRecognitionSystem, FaceDetection
from presence_tracker import PresenceTracker, LocationType, EventType

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.tracking_engine')


class AquilaTrackingEngine:
    """
    Motor de rastreamento integrado que combina reconhecimento facial com presença.
    """
    
    def __init__(
        self,
        fr_model_path: str = "aquila_face_model.pkl",
        dataset_path: str = "./dataset",
        db_path: str = "data/presence.db",
        confidence_threshold: float = 0.6,
        model_type: str = "hog"
    ):
        """
        Inicializa o motor de rastreamento.
        
        Args:
            fr_model_path: Caminho para o modelo de reconhecimento facial
            dataset_path: Caminho para o dataset de rostos
            db_path: Caminho para o banco de dados de presença
            confidence_threshold: Limiar de confiança para reconhecimento
            model_type: Tipo de modelo ("hog" ou "cnn")
        """
        # Inicializar sistemas
        self.fr_system = FacialRecognitionSystem(
            model_path=fr_model_path,
            dataset_path=dataset_path,
            confidence_threshold=confidence_threshold,
            model_type=model_type
        )
        
        self.presence_tracker = PresenceTracker(db_path=db_path)
        
        # Fila para processar eventos de forma assíncrona
        self.event_queue = queue.Queue()
        
        # Dicionário para rastrear última detecção de cada aluno
        # {student_id: {'timestamp': datetime, 'location_id': int}}
        self.last_detections: Dict[str, Dict] = {}
        
        # Limiar de tempo para evitar duplicatas (em segundos)
        self.duplicate_threshold = 5
        
        # Lock para thread-safety
        self.lock = threading.Lock()
        
        # Flag para parar o processamento
        self.running = False
        
        logger.info("Motor de rastreamento Áquila inicializado")
    
    def setup_locations(self, locations_config: Dict) -> bool:
        """
        Configura as localizações (salas, corredores, etc).
        
        Args:
            locations_config: Dicionário com configurações de localizações
            Exemplo:
            {
                "classroom_101": {
                    "name": "Sala 101",
                    "type": "sala_de_aula",
                    "camera_id": "cam_001"
                },
                "hallway": {
                    "name": "Corredor Principal",
                    "type": "corredor",
                    "camera_id": "cam_002"
                }
            }
            
        Returns:
            True se configurado com sucesso
        """
        try:
            for location_key, config in locations_config.items():
                location_type = LocationType(config['type'])
                
                location_id = self.presence_tracker.register_location(
                    name=config['name'],
                    location_type=location_type,
                    description=config.get('description')
                )
                
                logger.info(f"✓ Localização registrada: {config['name']} (ID: {location_id})")
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao configurar localizações: {str(e)}")
            return False
    
    def setup_class_schedule(self, class_id: str, location_id: int, schedule: Dict) -> bool:
        """
        Configura o horário de uma turma.
        
        Args:
            class_id: ID da turma
            location_id: ID da sala
            schedule: Dicionário com horários
            Exemplo:
            {
                0: {"start": "07:30", "end": "12:00"},  # Segunda
                1: {"start": "07:30", "end": "12:00"},  # Terça
                ...
            }
            
        Returns:
            True se configurado com sucesso
        """
        try:
            for day_of_week, times in schedule.items():
                self.presence_tracker.register_class_schedule(
                    class_id=class_id,
                    location_id=location_id,
                    day_of_week=day_of_week,
                    start_time=times['start'],
                    end_time=times['end']
                )
            
            logger.info(f"✓ Horário configurado para turma {class_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao configurar horário: {str(e)}")
            return False
    
    def register_students(self, students: List[Dict]) -> bool:
        """
        Registra alunos no sistema.
        
        Args:
            students: Lista de alunos
            Exemplo:
            [
                {
                    "student_id": "2026001",
                    "name": "João Silva",
                    "class_id": "7A"
                },
                ...
            ]
            
        Returns:
            True se todos registrados com sucesso
        """
        try:
            for student in students:
                self.presence_tracker.register_student_in_class(
                    student_id=student['student_id'],
                    class_id=student['class_id']
                )
            
            logger.info(f"✓ {len(students)} aluno(s) registrado(s)")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao registrar alunos: {str(e)}")
            return False
    
    def process_frame(
        self,
        frame: np.ndarray,
        location_id: int,
        scale_factor: float = 0.25
    ) -> List[Dict]:
        """
        Processa um frame de vídeo e registra eventos de presença.
        
        Args:
            frame: Frame de vídeo
            location_id: ID da localização/câmera
            scale_factor: Fator de escala para performance
            
        Returns:
            Lista de eventos registrados
        """
        # Detectar rostos
        detections = self.fr_system.process_frame(frame, scale_factor=scale_factor)
        
        events = []
        current_time = datetime.now()
        
        for detection in detections:
            # Ignorar rostos desconhecidos
            if detection.name == "Desconhecido":
                continue
            
            # Verificar se é uma detecção duplicada
            if self._is_duplicate_detection(detection.face_id, location_id, current_time):
                continue
            
            # Registrar evento de presença
            event_id = self.presence_tracker.record_presence_event(
                student_id=detection.face_id,
                location_id=location_id,
                event_type=EventType.PRESENCE
            )
            
            # Atualizar última detecção
            with self.lock:
                self.last_detections[detection.face_id] = {
                    'timestamp': current_time,
                    'location_id': location_id
                }
            
            # Preparar evento para retorno
            event = {
                'event_id': event_id,
                'student_id': detection.face_id,
                'name': detection.name,
                'location_id': location_id,
                'confidence': detection.confidence,
                'timestamp': detection.timestamp
            }
            
            events.append(event)
            
            logger.info(f"✓ Evento registrado: {detection.name} em localização {location_id}")
        
        return events
    
    def process_video_stream(
        self,
        camera_source: str,
        location_id: int,
        scale_factor: float = 0.25,
        display: bool = True
    ) -> None:
        """
        Processa um stream de vídeo contínuo.
        
        Args:
            camera_source: Fonte de vídeo (0 para webcam, URL para IP camera)
            location_id: ID da localização
            scale_factor: Fator de escala para performance
            display: Se deve exibir o vídeo
        """
        try:
            cap = cv2.VideoCapture(camera_source)
            
            if not cap.isOpened():
                logger.error(f"Não foi possível abrir a câmera: {camera_source}")
                return
            
            logger.info(f"Iniciando processamento de vídeo: {camera_source}")
            
            self.running = True
            frame_count = 0
            
            while self.running:
                ret, frame = cap.read()
                
                if not ret:
                    logger.warning("Erro ao capturar frame")
                    break
                
                frame_count += 1
                
                # Processar frame a cada N frames (para performance)
                if frame_count % 5 == 0:
                    events = self.process_frame(frame, location_id, scale_factor)
                
                # Desenhar detecções
                if display:
                    detections = self.fr_system.process_frame(frame, scale_factor)
                    frame = self.fr_system.draw_detections(frame, detections)
                    
                    # Adicionar informações
                    cv2.putText(
                        frame,
                        f"Localização: {location_id} | Detecções: {len(detections)}",
                        (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 255, 0),
                        2
                    )
                    
                    cv2.imshow("Áquila Pro - Rastreamento", frame)
                    
                    if cv2.waitKey(1) & 0xFF == 27:  # ESC
                        break
            
            cap.release()
            if display:
                cv2.destroyAllWindows()
            
            logger.info(f"Processamento de vídeo finalizado ({frame_count} frames)")
            
        except Exception as e:
            logger.error(f"Erro ao processar stream de vídeo: {str(e)}")
    
    def get_student_status(self, student_id: str, location_id: int) -> Dict:
        """
        Obtém o status atual de um aluno.
        
        Args:
            student_id: ID do aluno
            location_id: ID da localização
            
        Returns:
            Dicionário com informações de status
        """
        try:
            # Obter última detecção
            last_detection = self.presence_tracker.get_last_presence_event(
                student_id=student_id,
                location_id=location_id
            )
            
            # Obter tempo em localização
            time_in_location = self.presence_tracker.get_time_in_location(
                student_id=student_id,
                location_id=location_id
            )
            
            return {
                'student_id': student_id,
                'location_id': location_id,
                'last_detection': last_detection,
                'time_in_location_seconds': time_in_location,
                'status': 'present' if time_in_location > 0 else 'absent'
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter status do aluno: {str(e)}")
            return {}
    
    def get_location_summary(self, location_id: int) -> Dict:
        """
        Obtém um resumo da localização (quantos alunos estão presentes).
        
        Args:
            location_id: ID da localização
            
        Returns:
            Dicionário com resumo
        """
        try:
            summary = self.presence_tracker.get_location_summary(location_id)
            return summary
            
        except Exception as e:
            logger.error(f"Erro ao obter resumo da localização: {str(e)}")
            return {}
    
    def _is_duplicate_detection(
        self,
        student_id: str,
        location_id: int,
        current_time: datetime
    ) -> bool:
        """
        Verifica se é uma detecção duplicada (mesmo aluno, mesma localização, tempo próximo).
        
        Args:
            student_id: ID do aluno
            location_id: ID da localização
            current_time: Hora atual
            
        Returns:
            True se é duplicata
        """
        if student_id not in self.last_detections:
            return False
        
        last = self.last_detections[student_id]
        
        # Verificar se é mesma localização e tempo próximo
        if (last['location_id'] == location_id and
            (current_time - last['timestamp']).total_seconds() < self.duplicate_threshold):
            return True
        
        return False
    
    def stop(self):
        """Para o processamento."""
        self.running = False
        logger.info("Motor de rastreamento parado")


if __name__ == '__main__':
    """
    Exemplo de uso do motor de rastreamento integrado.
    """
    import numpy as np
    
    # Criar motor
    engine = AquilaTrackingEngine(
        fr_model_path="aquila_face_model.pkl",
        dataset_path="./dataset",
        db_path="data/presence.db"
    )
    
    # Configurar localizações
    locations = {
        "classroom_101": {
            "name": "Sala 101",
            "type": "sala_de_aula",
            "description": "Sala de aula 7º Ano A"
        },
        "hallway": {
            "name": "Corredor Principal",
            "type": "corredor",
            "description": "Corredor principal da escola"
        }
    }
    engine.setup_locations(locations)
    
    # Configurar horários
    schedule = {
        0: {"start": "07:30", "end": "12:00"},  # Segunda
        1: {"start": "07:30", "end": "12:00"},  # Terça
        2: {"start": "07:30", "end": "12:00"},  # Quarta
        3: {"start": "07:30", "end": "12:00"},  # Quinta
        4: {"start": "07:30", "end": "12:00"},  # Sexta
    }
    engine.setup_class_schedule("7A", location_id=1, schedule=schedule)
    
    # Registrar alunos
    students = [
        {"student_id": "2026001", "name": "João Silva", "class_id": "7A"},
        {"student_id": "2026002", "name": "Maria Santos", "class_id": "7A"},
    ]
    engine.register_students(students)
    
    # Processar vídeo em tempo real
    print("\n=== Iniciando Rastreamento ===")
    engine.process_video_stream(
        camera_source=0,  # Webcam
        location_id=1,    # Sala 101
        display=True
    )
