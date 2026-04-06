"""
Motor de Rastreamento Integrado para Áquila Pro

Integra reconhecimento facial com rastreamento de presença.
"""

import cv2
import logging
import threading
from datetime import datetime
from typing import Dict, List, Optional
import queue

from .facial_recognition import FacialRecognitionSystem
from .presence_tracking import PresenceTracker, LocationType, EventType

logger = logging.getLogger(__name__)


class AquilaTrackingEngine:
    """Motor de rastreamento integrado."""
    
    def __init__(
        self,
        fr_model_path: str = "aquila_face_model.pkl",
        dataset_path: str = "./dataset",
        db_path: str = "data/presence.db",
        confidence_threshold: float = 0.6,
        model_type: str = "hog"
    ):
        """Inicializa o motor de rastreamento."""
        self.fr_system = FacialRecognitionSystem(
            model_path=fr_model_path,
            dataset_path=dataset_path,
            confidence_threshold=confidence_threshold,
            model_type=model_type
        )
        
        self.presence_tracker = PresenceTracker(db_path=db_path)
        
        self.event_queue = queue.Queue()
        self.last_detections: Dict[str, Dict] = {}
        self.duplicate_threshold = 5
        self.lock = threading.Lock()
        self.running = False
        
        logger.info("AquilaTrackingEngine inicializado")
    
    def setup_locations(self, locations_config: Dict) -> bool:
        """Configura as localizações."""
        try:
            for location_key, config in locations_config.items():
                loc_type = LocationType(config['type'])
                
                location_id = self.presence_tracker.register_location(
                    name=config['name'],
                    location_type=loc_type,
                    description=config.get('description')
                )
                
                logger.info(f"✓ Localização registrada: {config['name']} (ID: {location_id})")
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao configurar localizações: {str(e)}")
            return False
    
    def register_students(self, students: List[Dict]) -> bool:
        """Registra alunos no sistema."""
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
        frame,
        location_id: int,
        scale_factor: float = 0.25
    ) -> List[Dict]:
        """Processa um frame de vídeo e registra eventos."""
        detections = self.fr_system.process_frame(frame, scale_factor=scale_factor)
        
        events = []
        current_time = datetime.now()
        
        for detection in detections:
            if detection.name == "Desconhecido":
                continue
            
            if self._is_duplicate_detection(detection.face_id, location_id, current_time):
                continue
            
            event_id = self.presence_tracker.record_presence_event(
                student_id=detection.face_id,
                location_id=location_id,
                event_type=EventType.PRESENCA
            )
            
            with self.lock:
                self.last_detections[detection.face_id] = {
                    'timestamp': current_time,
                    'location_id': location_id
                }
            
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
        """Processa um stream de vídeo contínuo."""
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
                
                if frame_count % 5 == 0:
                    events = self.process_frame(frame, location_id, scale_factor)
                
                if display:
                    detections = self.fr_system.process_frame(frame, scale_factor)
                    frame = self.fr_system.draw_detections(frame, detections)
                    
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
                    
                    if cv2.waitKey(1) & 0xFF == 27:
                        break
            
            cap.release()
            if display:
                cv2.destroyAllWindows()
            
            logger.info(f"Processamento de vídeo finalizado ({frame_count} frames)")
            
        except Exception as e:
            logger.error(f"Erro ao processar stream de vídeo: {str(e)}")
    
    def get_student_status(self, student_id: str, location_id: int) -> Dict:
        """Obtém o status atual de um aluno."""
        try:
            last_detection = self.presence_tracker.get_last_presence_event(
                student_id=student_id,
                location_id=location_id
            )
            
            time_in_location = self.presence_tracker.get_time_in_location(
                student_id=student_id,
                location_id=location_id
            )
            
            return {
                'student_id': student_id,
                'location_id': location_id,
                'last_detection': last_detection,
                'time_in_location_seconds': time_in_location * 60,
                'status': 'present' if time_in_location > 0 else 'absent'
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter status do aluno: {str(e)}")
            return {}
    
    def _is_duplicate_detection(
        self,
        student_id: str,
        location_id: int,
        current_time: datetime
    ) -> bool:
        """Verifica se é uma detecção duplicada."""
        if student_id not in self.last_detections:
            return False
        
        last = self.last_detections[student_id]
        
        if (last['location_id'] == location_id and
            (current_time - last['timestamp']).total_seconds() < self.duplicate_threshold):
            return True
        
        return False
    
    def stop(self):
        """Para o processamento."""
        self.running = False
        logger.info("Motor de rastreamento parado")
