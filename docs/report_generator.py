"""
Módulo de Relatórios para o Sistema Áquila

Este módulo é responsável por gerar relatórios formatados a partir dos dados
de análise de desempenho dos alunos.
"""

import logging
import os
import json
from datetime import datetime
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from jinja2 import Template
import pdfkit

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.performance_analysis.reports')

class ReportGenerator:
    """
    Classe para geração de relatórios formatados a partir dos dados de análise.
    """
    
    def __init__(self, performance_analyzer, output_dir=None):
        """
        Inicializa o gerador de relatórios.
        
        Args:
            performance_analyzer: Instância do analisador de desempenho.
            output_dir (str, opcional): Diretório para salvar os relatórios.
        """
        self.performance_analyzer = performance_analyzer
        self.output_dir = output_dir or 'data/reports'
        
        # Criar diretório de saída se não existir
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Diretório para templates HTML
        self.template_dir = os.path.join(os.path.dirname(__file__), 'templates')
        os.makedirs(self.template_dir, exist_ok=True)
        
        logger.info("Gerador de relatórios inicializado")
        
    def _create_html_templates(self):
        """
        Cria templates HTML para os relatórios se não existirem.
        """
        # Template para relatório de aluno
        student_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório do Aluno {{ student_id }}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2c3e50; text-align: center; }
                h2 { color: #3498db; margin-top: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 30px; }
                .metric { margin: 10px 0; }
                .metric-name { font-weight: bold; }
                .high { color: green; }
                .medium { color: orange; }
                .low { color: red; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .chart { text-align: center; margin: 20px 0; }
                .chart img { max-width: 100%; }
                .footer { text-align: center; margin-top: 50px; font-size: 0.8em; color: #7f8c8d; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Relatório de Desempenho do Aluno</h1>
                <p><strong>ID do Aluno:</strong> {{ student_id }}</p>
                <p><strong>Turma:</strong> {{ class_id }}</p>
                <p><strong>Período:</strong> {{ period_start }} a {{ period_end }}</p>
                <p><strong>Data do Relatório:</strong> {{ report_date }}</p>
            </div>
            
            <div class="section">
                <h2>Resumo de Engajamento</h2>
                <div class="metric">
                    <span class="metric-name">Score de Engajamento:</span> 
                    <span class="{{ engagement_level|lower }}">{{ engagement_score }}% ({{ engagement_level }})</span>
                </div>
                
                <h3>Fatores Contribuintes</h3>
                <table>
                    <tr>
                        <th>Fator</th>
                        <th>Valor</th>
                        <th>Score</th>
                        <th>Peso</th>
                    </tr>
                    <tr>
                        <td>Frequência</td>
                        <td>{{ attendance_rate }}%</td>
                        <td>{{ attendance_score }}</td>
                        <td>40%</td>
                    </tr>
                    <tr>
                        <td>Tempo em Sala</td>
                        <td>{{ classroom_percentage }}%</td>
                        <td>{{ classroom_score }}</td>
                        <td>30%</td>
                    </tr>
                    <tr>
                        <td>Saídas de Sala</td>
                        <td>{{ exit_count }} saídas</td>
                        <td>{{ exit_score }}</td>
                        <td>20%</td>
                    </tr>
                    <tr>
                        <td>Visitas ao Banheiro</td>
                        <td>{{ bathroom_visits }} visitas (média de {{ bathroom_duration }}min)</td>
                        <td>{{ bathroom_score }}</td>
                        <td>10%</td>
                    </tr>
                </table>
            </div>
            
            <div class="section">
                <h2>Distribuição de Tempo</h2>
                <p>Análise de como o aluno distribui seu tempo nos diferentes ambientes da escola.</p>
                
                {% if time_chart %}
                <div class="chart">
                    <img src="{{ time_chart }}" alt="Distribuição de Tempo">
                </div>
                {% endif %}
                
                <table>
                    <tr>
                        <th>Local</th>
                        <th>Tempo Total</th>
                        <th>Percentual</th>
                    </tr>
                    {% for location in time_distribution %}
                    <tr>
                        <td>{{ location.name }}</td>
                        <td>{{ location.duration }}</td>
                        <td>{{ location.percentage }}%</td>
                    </tr>
                    {% endfor %}
                </table>
            </div>
            
            <div class="section">
                <h2>Histórico de Presença</h2>
                <p>Resumo da frequência do aluno nas aulas.</p>
                
                <div class="metric">
                    <span class="metric-name">Taxa de Frequência:</span> 
                    <span class="{{ attendance_class }}">{{ attendance_rate }}%</span>
                </div>
                
                <table>
                    <tr>
                        <th>Métrica</th>
                        <th>Valor</th>
                    </tr>
                    <tr>
                        <td>Total de Aulas</td>
                        <td>{{ total_classes }}</td>
                    </tr>
                    <tr>
                        <td>Aulas Presentes</td>
                        <td>{{ attended_classes }}</td>
                    </tr>
                    <tr>
                        <td>Aulas Ausentes</td>
                        <td>{{ missed_classes }}</td>
                    </tr>
                    <tr>
                        <td>Aulas com Atraso</td>
                        <td>{{ late_classes }}</td>
                    </tr>
                </table>
            </div>
            
            <div class="section">
                <h2>Comportamento em Sala</h2>
                
                <h3>Saídas de Sala</h3>
                <p>O aluno saiu da sala de aula {{ exit_count }} vezes no período analisado.</p>
                
                <h3>Visitas ao Banheiro</h3>
                <p>O aluno visitou o banheiro {{ bathroom_visits }} vezes, com duração média de {{ bathroom_duration }} minutos por visita.</p>
                
                {% if exits_chart %}
                <div class="chart">
                    <img src="{{ exits_chart }}" alt="Saídas de Sala">
                </div>
                {% endif %}
            </div>
            
            <div class="section">
                <h2>Recomendações</h2>
                <ul>
                    {% for recommendation in recommendations %}
                    <li>{{ recommendation }}</li>
                    {% endfor %}
                </ul>
            </div>
            
            <div class="footer">
                <p>Relatório gerado pelo Sistema Áquila em {{ report_date }}</p>
            </div>
        </body>
        </html>
        """
        
        # Template para relatório de turma
        class_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório da Turma {{ class_id }}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2c3e50; text-align: center; }
                h2 { color: #3498db; margin-top: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 30px; }
                .metric { margin: 10px 0; }
                .metric-name { font-weight: bold; }
                .high { color: green; }
                .medium { color: orange; }
                .low { color: red; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .chart { text-align: center; margin: 20px 0; }
                .chart img { max-width: 100%; }
                .footer { text-align: center; margin-top: 50px; font-size: 0.8em; color: #7f8c8d; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Relatório de Desempenho da Turma</h1>
                <p><strong>Turma:</strong> {{ class_id }}</p>
                <p><strong>Total de Alunos:</strong> {{ student_count }}</p>
                <p><strong>Período:</strong> {{ period_start }} a {{ period_end }}</p>
                <p><strong>Data do Relatório:</strong> {{ report_date }}</p>
            </div>
            
            <div class="section">
                <h2>Resumo de Engajamento</h2>
                <div class="metric">
                    <span class="metric-name">Engajamento Médio:</span> {{ avg_engagement }}%
                </div>
                
                <table>
                    <tr>
                        <th>Nível de Engajamento</th>
                        <th>Número de Alunos</th>
                        <th>Percentual</th>
                    </tr>
                    <tr>
                        <td class="high">Alto</td>
                        <td>{{ high_engagement_count }}</td>
                        <td>{{ high_engagement_percent }}%</td>
                    </tr>
                    <tr>
                        <td class="medium">Médio</td>
                        <td>{{ medium_engagement_count }}</td>
                        <td>{{ medium_engagement_percent }}%</td>
                    </tr>
                    <tr>
                        <td class="low">Baixo</td>
                        <td>{{ low_engagement_count }}</td>
                        <td>{{ low_engagement_percent }}%</td>
                    </tr>
                </table>
                
                {% if engagement_chart %}
                <div class="chart">
                    <img src="{{ engagement_chart }}" alt="Engajamento da Turma">
                </div>
                {% endif %}
            </div>
            
            <div class="section">
                <h2>Frequência</h2>
                <div class="metric">
                    <span class="metric-name">Frequência Média:</span> {{ avg_attendance }}%
                </div>
                
                <p>{{ below_threshold_count }} alunos ({{ below_threshold_percent }}%) estão com frequência abaixo de 75%.</p>
                
                {% if attendance_chart %}
                <div class="chart">
                    <img src="{{ attendance_chart }}" alt="Frequência da Turma">
                </div>
                {% endif %}
                
                {% if students_at_risk %}
                <h3>Alunos em Risco por Baixa Frequência</h3>
                <table>
                    <tr>
                        <th>ID do Aluno</th>
                        <th>Frequência</th>
                    </tr>
                    {% for student in students_at_risk %}
                    <tr>
                        <td>{{ student.id }}</td>
                        <td class="low">{{ student.attendance }}%</td>
                    </tr>
                    {% endfor %}
                </table>
                {% endif %}
            </div>
            
            <div class="section">
                <h2>Distribuição de Tempo</h2>
                <p>Análise de como os alunos distribuem seu tempo nos diferentes ambientes da escola.</p>
                
                {% if time_chart %}
                <div class="chart">
                    <img src="{{ time_chart }}" alt="Distribuição de Tempo">
                </div>
                {% endif %}
                
                <table>
                    <tr>
                        <th>Local</th>
                        <th>Tempo Médio</th>
                        <th>Percentual Médio</th>
                    </tr>
                    {% for location in time_distribution %}
                    <tr>
                        <td>{{ location.type }}</td>
                        <td>{{ location.avg_duration }}</td>
                        <td>{{ location.avg_percentage }}%</td>
                    </tr>
                    {% endfor %}
                </table>
            </div>
            
            <div class="section">
                <h2>Comportamento em Sala</h2>
                
                <h3>Saídas de Sala</h3>
                <p>Em média, cada aluno saiu da sala de aula {{ avg_exits }} vezes no período analisado.</p>
                
                <h3>Visitas ao Banheiro</h3>
                <p>Em média, cada aluno visitou o banheiro {{ avg_bathroom_visits }} vezes, com duração média de {{ avg_bathroom_duration }} minutos por visita.</p>
                
                {% if exits_chart %}
                <div class="chart">
                    <img src="{{ exits_chart }}" alt="Saídas de Sala">
                </div>
                {% endif %}
                
                {% if frequent_exiters %}
                <h3>Alunos com Saídas Frequentes</h3>
                <table>
                    <tr>
                        <th>ID do Aluno</th>
                        <th>Número de Saídas</th>
                    </tr>
                    {% for student in frequent_exiters %}
                    <tr>
                        <td>{{ student.id }}</td>
                        <td>{{ student.exits }}</td>
                    </tr>
                    {% endfor %}
                </table>
                {% endif %}
            </div>
            
            <div class="section">
                <h2>Recomendações</h2>
                <ul>
                    {% for recommendation in recommendations %}
                    <li>{{ recommendation }}</li>
                    {% endfor %}
                </ul>
            </div>
            
            <div class="footer">
                <p>Relatório gerado pelo Sistema Áquila em {{ report_date }}</p>
            </div>
        </body>
        </html>
        """
        
        # Salvar templates
        student_template_path = os.path.join(self.template_dir, 'student_report_template.html')
        class_template_path = os.path.join(self.template_dir, 'class_report_template.html')
        
        if not os.path.exists(student_template_path):
            with open(student_template_path, 'w') as f:
                f.write(student_templat
(Content truncated due to size limit. Use line ranges to read in chunks)