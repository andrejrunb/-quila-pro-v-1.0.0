"""
Sistema Avançado de Reconhecimento Facial para Áquila Pro

Este módulo implementa reconhecimento facial de alta precisão usando a biblioteca face_recognition,
que utiliza deep learning (dlib) para detecção e reconhecimento de rostos.

Características:
- Detecção de múltiplos rostos por frame
- Reconhecimento com alta precisão (99.38% em dataset LFW)
- Cache de embeddings para performance
- Suporte a múltiplas imagens por pessoa
- Threshold de confiança configurável
- Processamento de vídeo em tempo real
- Logging detalhado
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
import json

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.facial_recognition')


@dataclass
class FaceDetection:
    """Representa uma detecção de rosto em um frame."""
    face_id: str
    name: str
    confidence: float
    location: Tuple[int, int, int, int]  # (top, right, bottom, left)
    timestamp: str
    embedding: Optional[np.ndarray] = None


class FacialRecognitionSystem:
    """
    Sistema avançado de reconhecimento facial usando face_recognition library.
    """
    
    def __init__(
        self,
        model_path: str = "aquila_face_model.pkl",
        dataset_path: str = "./dataset",
        confidence_threshold: float = 0.6,
        model_type: str = "hog"  # "hog" (rápido) ou "cnn" (preciso)
    ):
        """
        Inicializa o sistema de reconhecimento facial.
        
        Args:
            model_path: Caminho para salvar/carregar o modelo treinado
            dataset_path: Caminho para o dataset de treinamento
            confidence_threshold: Limiar de confiança para reconhecimento (0-1)
            model_type: Tipo de modelo ("hog" ou "cnn")
        """
        self.model_path = model_path
        self.dataset_path = dataset_path
        self.confidence_threshold = confidence_threshold
        self.model_type = model_type
        
        # Dicionários para armazenar embeddings e nomes
        self.known_face_encodings: List[np.ndarray] = []
        self.known_face_names: List[str] = []
        self.known_face_ids: List[str] = []
        
        # Cache de embeddings para performance
        self.embedding_cache: Dict[str, np.ndarray] = {}
        
        # Lock para thread-safety
        self.lock = threading.Lock()
        
        logger.info(f"Sistema de reconhecimento facial inicializado (modelo: {model_type})")
        
        # Carregar modelo existente ou criar novo
        if os.path.exists(model_path):
            self._load_model()
        else:
            logger.info("Nenhum modelo encontrado. Crie um novo com load_known_faces()")
    
    def load_known_faces(self, dataset_path: Optional[str] = None) -> int:
        """
        Carrega rostos conhecidos do dataset para treinamento.
        
        Estrutura esperada do dataset:
        dataset/
        ├── student_001/
        │   ├── face_1.jpg
        │   ├── face_2.jpg
        │   └── face_3.jpg
        ├── student_002/
        │   └── face_1.jpg
        └── ...
        
        Args:
            dataset_path: Caminho para o dataset (usa self.dataset_path se None)
            
        Returns:
            Número de rostos carregados
        """
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
        
        # Iterar sobre cada pessoa no dataset
        for person_dir in os.listdir(dataset_path):
            person_path = os.path.join(dataset_path, person_dir)
            
            if not os.path.isdir(person_path):
                continue
            
            person_id = person_dir  # ID é o nome do diretório
            faces_loaded = 0
            
            # Iterar sobre cada imagem da pessoa
            for img_name in os.listdir(person_path):
                img_path = os.path.join(person_path, img_name)
                
                # Suportar apenas imagens
                if not img_name.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
                    continue
                
                try:
                    # Carregar imagem
                    image = face_recognition.load_image_file(img_path)
                    
                    # Detectar rostos na imagem
                    face_locations = face_recognition.face_locations(
                        image,
                        model=self.model_type
                    )
                    
                    # Gerar embeddings para cada rosto
                    face_encodings = face_recognition.face_encodings(image, face_locations)
                    
                    if len(face_encodings) == 0:
                        logger.warning(f"Nenhum rosto detectado em: {img_path}")
                        continue
                    elif len(face_encodings) > 1:
                        logger.warning(f"Múltiplos rostos detectados em: {img_path}. Usando o primeiro.")
                    
                    # Usar o primeiro rosto detectado
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
        
        logger.info(f"Total: {total_faces} rosto(s) carregado(s) para {len(set(self.known_face_ids))} pessoa(s)")
        
        # Salvar modelo
        if total_faces > 0:
            self._save_model()
        
        return total_faces
    
    def process_frame(
        self,
        frame: np.ndarray,
        scale_factor: float = 0.25
    ) -> List[FaceDetection]:
        """
        Processa um frame de vídeo e detecta/reconhece rostos.
        
        Args:
            frame: Frame de vídeo (BGR)
            scale_factor: Fator de escala para performance (0.25 = 25% do tamanho)
            
        Returns:
            Lista de FaceDetection com rostos detectados e reconhecidos
        """
        # Redimensionar frame para performance
        small_frame = cv2.resize(frame, (0, 0), fx=scale_factor, fy=scale_factor)
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        
        # Detectar rostos
        face_locations = face_recognition.face_locations(
            rgb_small_frame,
            model=self.model_type
        )
        
        # Gerar embeddings
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
        
        results = []
        
        for face_encoding, face_location in zip(face_encodings, face_locations):
            # Comparar com rostos conhecidos
            matches = face_recognition.compare_faces(
                self.known_face_encodings,
                face_encoding,
                tolerance=1 - self.confidence_threshold
            )
            
            # Calcular distâncias
            distances = face_recognition.face_distance(
                self.known_face_encodings,
                face_encoding
            )
            
            # Encontrar o melhor match
            name = "Desconhecido"
            confidence = 0.0
            face_id = None
            
            if len(distances) > 0:
                best_match_index = np.argmin(distances)
                
                if matches[best_match_index]:
                    name = self.known_face_names[best_match_index]
                    face_id = self.known_face_ids[best_match_index]
                    confidence = 1 - distances[best_match_index]
            
            # Converter coordenadas de volta para tamanho original
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
        """
        Desenha retângulos e labels nos rostos detectados.
        
        Args:
            frame: Frame de vídeo
            detections: Lista de detecções
            show_confidence: Se deve mostrar a confiança
            
        Returns:
            Frame com desenhos
        """
        for detection in detections:
            top, right, bottom, left = detection.location
            
            # Cor baseada na confiança
            if detection.name == "Desconhecido":
                color = (0, 0, 255)  # Vermelho
            elif detection.confidence > 0.8:
                color = (0, 255, 0)  # Verde
            else:
                color = (0, 255, 255)  # Amarelo
            
            # Desenhar retângulo
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            
            # Preparar label
            label = detection.name
            if show_confidence:
                label += f" ({detection.confidence:.2f})"
            
            # Desenhar label
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
        """
        Adiciona um novo rosto ao dataset.
        
        Args:
            person_id: ID da pessoa (usado como nome do diretório)
            image_path: Caminho para a imagem do rosto
            
        Returns:
            True se adicionado com sucesso
        """
        try:
            # Criar diretório se não existir
            person_dir = os.path.join(self.dataset_path, person_id)
            os.makedirs(person_dir, exist_ok=True)
            
            # Copiar imagem para dataset
            filename = os.path.basename(image_path)
            dest_path = os.path.join(person_dir, filename)
            
            # Validar que há um rosto na imagem
            image = face_recognition.load_image_file(image_path)
            face_locations = face_recognition.face_locations(image, model=self.model_type)
            
            if len(face_locations) == 0:
                logger.warning(f"Nenhum rosto detectado em: {image_path}")
                return False
            
            # Copiar arquivo
            import shutil
            shutil.copy(image_path, dest_path)
            
            logger.info(f"Rosto adicionado ao dataset: {person_id}/{filename}")
            
            # Recarregar modelo
            self.load_known_faces()
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao adicionar rosto ao dataset: {str(e)}")
            return False
    
    def capture_face_from_camera(
        self,
        person_id: str,
        num_captures: int = 5,
        camera_index: int = 0
    ) -> bool:
        """
        Captura múltiplas imagens de um rosto usando a câmera.
        
        Args:
            person_id: ID da pessoa
            num_captures: Número de imagens a capturar
            camera_index: Índice da câmera
            
        Returns:
            True se capturado com sucesso
        """
        try:
            cap = cv2.VideoCapture(camera_index)
            
            if not cap.isOpened():
                logger.error("Não foi possível abrir a câmera")
                return False
            
            # Criar diretório
            person_dir = os.path.join(self.dataset_path, person_id)
            os.makedirs(person_dir, exist_ok=True)
            
            captured = 0
            
            while captured < num_captures:
                ret, frame = cap.read()
                
                if not ret:
                    logger.error("Erro ao capturar frame")
                    break
                
                # Detectar rostos
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                face_locations = face_recognition.face_locations(rgb_frame, model=self.model_type)
                
                # Desenhar retângulos
                for top, right, bottom, left in face_locations:
                    cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
                
                # Mostrar instruções
                cv2.putText(
                    frame,
                    f"Capturando: {captured + 1}/{num_captures}",
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 0),
                    2
                )
                cv2.putText(
                    frame,
                    "Pressione ESPACO para capturar, ESC para sair",
                    (10, 70),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 255),
                    1
                )
                
                cv2.imshow(f"Capturando rosto de {person_id}", frame)
                
                key = cv2.waitKey(1) & 0xFF
                
                if key == 27:  # ESC
                    break
                elif key == 32:  # ESPACO
                    if len(face_locations) > 0:
                        # Salvar imagem
                        filename = f"{person_id}_{captured + 1}.jpg"
                        filepath = os.path.join(person_dir, filename)
                        cv2.imwrite(filepath, frame)
                        logger.info(f"Imagem capturada: {filepath}")
                        captured += 1
            
            cap.release()
            cv2.destroyAllWindows()
            
            if captured > 0:
                logger.info(f"Total de {captured} imagens capturadas para {person_id}")
                self.load_known_faces()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Erro ao capturar rosto da câmera: {str(e)}")
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
            logger.info(f"Total de {len(self.known_face_encodings)} rostos carregados")
            
        except Exception as e:
            logger.error(f"Erro ao carregar modelo: {str(e)}")
    
    def get_statistics(self) -> Dict:
        """Retorna estatísticas do modelo."""
        return {
            'total_encodings': len(self.known_face_encodings),
            'total_people': len(set(self.known_face_ids)),
            'model_type': self.model_type,
            'confidence_threshold': self.confidence_threshold,
            'people': {
                person_id: self.known_face_names.count(person_id)
                for person_id in set(self.known_face_ids)
            }
        }


if __name__ == '__main__':
    """
    Exemplo de uso do sistema de reconhecimento facial avançado.
    """
    
    # Criar sistema
    fr_system = FacialRecognitionSystem(
        model_path="aquila_face_model.pkl",
        dataset_path="./dataset",
        confidence_threshold=0.6,
        model_type="hog"  # Use "cnn" para maior precisão
    )
    
    # Opção 1: Capturar rostos da câmera
    print("\n=== Captura de Rosto ===")
    fr_system.capture_face_from_camera("student_001", num_captures=5)
    
    # Opção 2: Carregar dataset existente
    print("\n=== Carregamento de Dataset ===")
    num_faces = fr_system.load_known_faces()
    print(f"✓ {num_faces} rostos carregados")
    
    # Opção 3: Processar vídeo em tempo real
    print("\n=== Processamento de Vídeo ===")
    cap = cv2.VideoCapture(0)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Processar frame
        detections = fr_system.process_frame(frame, scale_factor=0.25)
        
        # Desenhar detecções
        frame = fr_system.draw_detections(frame, detections)
        
        # Mostrar estatísticas
        cv2.putText(
            frame,
            f"Detectados: {len(detections)}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )
        
        cv2.imshow("Áquila Pro - Reconhecimento Facial", frame)
        
        if cv2.waitKey(1) & 0xFF == 27:  # ESC
            break
    
    cap.release()
    cv2.destroyAllWindows()
    
    # Mostrar estatísticas
    print("\n=== Estatísticas ===")
    stats = fr_system.get_statistics()
    print(json.dumps(stats, indent=2, ensure_ascii=False))
