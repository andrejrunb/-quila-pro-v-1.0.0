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
