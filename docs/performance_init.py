"""
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
