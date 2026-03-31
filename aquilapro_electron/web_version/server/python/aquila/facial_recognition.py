"""
Sistema de Reconhecimento Facial para Áquila Pro

Implementa detecção e reconhecimento de rostos usando face_recognition library.
"""

import cv2
import face_recognition
import numpy as np
import os
import logging
import pickle
import threading
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class FaceDetection:
    """Representa uma detecção de rosto em um frame."""
    face_id: str
    name: str
    confidence: float
    location: Tuple[int, int, int, int]
    timestamp: str
    embedding: Optional[np.ndarray] = None


class FacialRecognitionSystem:
    """Sistema avançado de reconhecimento facial."""
    
    def __init__(
        self,
        model_path: str = "aquila_face_model.pkl",
        dataset_path: str = "./dataset",
        confidence_threshold: float = 0.6,
        model_type: str = "hog"
    ):
        self.model_path = model_path
        self.dataset_path = dataset_path
        self.confidence_threshold = confidence_threshold
        self.model_type = model_type
        
        self.known_face_encodings: List[np.ndarray] = []
        self.known_face_names: List[str] = []
        self.known_face_ids: List[str] = []
        self.embedding_cache: Dict[str, np.ndarray] = {}
        self.lock = threading.Lock()
        
        logger.info(f"FacialRecognitionSystem inicializado (modelo: {model_type})")
        
        if os.path.exists(model_path):
            self._load_model()
    
    def load_known_faces(self, dataset_path: Optional[str] = None) -> int:
        """Carrega rostos conhecidos do dataset."""
        dataset_path = dataset_path or self.dataset_path
        
        if not os.path.exists(dataset_path):
            logger.warning(f"Dataset path {dataset_path} não encontrado")
            return 0
        
        logger.info(f"Carregando rostos do dataset: {dataset_path}")
        
        with self.lock:
            self.known_face_encodings = []
            self.known_face_names = []
            self.known_face_ids = []
            self.embedding_cache = {}
        
        total_faces = 0
        
        for person_dir in os.listdir(dataset_path):
            person_path = os.path.join(dataset_path, person_dir)
            
            if not os.path.isdir(person_path):
                continue
            
            person_id = person_dir
            faces_loaded = 0
            
            for img_name in os.listdir(person_path):
                img_path = os.path.join(person_path, img_name)
                
                if not img_name.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
                    continue
                
                try:
                    image = face_recognition.load_image_file(img_path)
                    face_locations = face_recognition.face_locations(
                        image,
                        model=self.model_type
                    )
                    face_encodings = face_recognition.face_encodings(image, face_locations)
                    
                    if len(face_encodings) == 0:
                        logger.warning(f"Nenhum rosto detectado em: {img_path}")
                        continue
                    
                    face_encoding = face_encodings[0]
                    
                    with self.lock:
                        self.known_face_encodings.append(face_encoding)
                        self.known_face_names.append(person_dir)
                        self.known_face_ids.append(person_id)
                    
                    faces_loaded += 1
                    total_faces += 1
                    
                except Exception as e:
                    logger.error(f"Erro ao processar {img_path}: {str(e)}")
                    continue
            
            if faces_loaded > 0:
                logger.info(f"✓ {person_dir}: {faces_loaded} rosto(s) carregado(s)")
        
        logger.info(f"Total: {total_faces} rosto(s) carregado(s)")
        
        if total_faces > 0:
            self._save_model()
        
        return total_faces
    
    def process_frame(
        self,
        frame: np.ndarray,
        scale_factor: float = 0.25
    ) -> List[FaceDetection]:
        """Processa um frame de vídeo e detecta/reconhece rostos."""
        small_frame = cv2.resize(frame, (0, 0), fx=scale_factor, fy=scale_factor)
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        
        face_locations = face_recognition.face_locations(
            rgb_small_frame,
            model=self.model_type
        )
        
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
        
        results = []
        
        for face_encoding, face_location in zip(face_encodings, face_locations):
            matches = face_recognition.compare_faces(
                self.known_face_encodings,
                face_encoding,
                tolerance=1 - self.confidence_threshold
            )
            
            distances = face_recognition.face_distance(
                self.known_face_encodings,
                face_encoding
            )
            
            name = "Desconhecido"
            confidence = 0.0
            face_id = None
            
            if len(distances) > 0:
                best_match_index = np.argmin(distances)
                
                if matches[best_match_index]:
                    name = self.known_face_names[best_match_index]
                    face_id = self.known_face_ids[best_match_index]
                    confidence = 1 - distances[best_match_index]
            
            top, right, bottom, left = face_location
            top = int(top / scale_factor)
            right = int(right / scale_factor)
            bottom = int(bottom / scale_factor)
            left = int(left / scale_factor)
            
            detection = FaceDetection(
                face_id=face_id or "unknown",
                name=name,
                confidence=float(confidence),
                location=(top, right, bottom, left),
                timestamp=datetime.now().isoformat(),
                embedding=face_encoding
            )
            
            results.append(detection)
        
        return results
    
    def draw_detections(
        self,
        frame: np.ndarray,
        detections: List[FaceDetection],
        show_confidence: bool = True
    ) -> np.ndarray:
        """Desenha retângulos e labels nos rostos detectados."""
        for detection in detections:
            top, right, bottom, left = detection.location
            
            if detection.name == "Desconhecido":
                color = (0, 0, 255)
            elif detection.confidence > 0.8:
                color = (0, 255, 0)
            else:
                color = (0, 255, 255)
            
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            
            label = detection.name
            if show_confidence:
                label += f" ({detection.confidence:.2f})"
            
            cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
            cv2.putText(
                frame,
                label,
                (left + 6, bottom - 6),
                cv2.FONT_HERSHEY_DUPLEX,
                0.6,
                (255, 255, 255),
                1
            )
        
        return frame
    
    def add_face_to_dataset(
        self,
        person_id: str,
        image_path: str
    ) -> bool:
        """Adiciona um novo rosto ao dataset."""
        try:
            person_dir = os.path.join(self.dataset_path, person_id)
            os.makedirs(person_dir, exist_ok=True)
            
            filename = os.path.basename(image_path)
            dest_path = os.path.join(person_dir, filename)
            
            image = face_recognition.load_image_file(image_path)
            face_locations = face_recognition.face_locations(image, model=self.model_type)
            
            if len(face_locations) == 0:
                logger.warning(f"Nenhum rosto detectado em: {image_path}")
                return False
            
            import shutil
            shutil.copy(image_path, dest_path)
            
            logger.info(f"Rosto adicionado ao dataset: {person_id}/{filename}")
            
            self.load_known_faces()
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao adicionar rosto ao dataset: {str(e)}")
            return False
    
    def _save_model(self):
        """Salva o modelo treinado em arquivo."""
        try:
            model_data = {
                'encodings': self.known_face_encodings,
                'names': self.known_face_names,
                'ids': self.known_face_ids
            }
            
            with open(self.model_path, 'wb') as f:
                pickle.dump(model_data, f)
            
            logger.info(f"Modelo salvo em: {self.model_path}")
            
        except Exception as e:
            logger.error(f"Erro ao salvar modelo: {str(e)}")
    
    def _load_model(self):
        """Carrega o modelo treinado do arquivo."""
        try:
            with open(self.model_path, 'rb') as f:
                model_data = pickle.load(f)
            
            with self.lock:
                self.known_face_encodings = model_data['encodings']
                self.known_face_names = model_data['names']
                self.known_face_ids = model_data['ids']
            
            logger.info(f"Modelo carregado de: {self.model_path}")
            
        except Exception as e:
            logger.error(f"Erro ao carregar modelo: {str(e)}")
    
    def get_statistics(self) -> Dict:
        """Retorna estatísticas do modelo."""
        return {
            'total_encodings': len(self.known_face_encodings),
            'total_people': len(set(self.known_face_ids)),
            'model_type': self.model_type,
            'confidence_threshold': self.confidence_threshold
        }
