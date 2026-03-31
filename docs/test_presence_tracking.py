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
