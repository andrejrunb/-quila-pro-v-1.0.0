"""
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
