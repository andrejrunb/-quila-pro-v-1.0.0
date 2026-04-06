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
