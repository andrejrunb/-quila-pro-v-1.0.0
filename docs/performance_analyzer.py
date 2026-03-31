"""
Módulo de Análise de Desempenho para o Sistema Áquila

Este módulo é responsável por analisar os dados de presença e comportamento dos alunos,
identificar padrões e gerar insights para avaliação pedagógica.
"""

import logging
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import os
import json
from enum import Enum

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.performance_analysis')

class AnalysisType(Enum):
    """Tipos de análises disponíveis no sistema."""
    ATTENDANCE = "frequencia"
    BATHROOM_VISITS = "visitas_banheiro"
    CLASS_EXITS = "saidas_sala"
    TIME_DISTRIBUTION = "distribuicao_tempo"
    ENGAGEMENT = "engajamento"
    COMPARISON = "comparacao"

class PerformanceAnalyzer:
    """
    Classe principal para análise de desempenho dos alunos.
    """
    
    def __init__(self, presence_db_path=None, output_dir=None):
        """
        Inicializa o analisador de desempenho.
        
        Args:
            presence_db_path (str, opcional): Caminho para o banco de dados de presença.
            output_dir (str, opcional): Diretório para salvar relatórios e gráficos.
        """
        self.presence_db_path = presence_db_path or 'data/presence.db'
        self.output_dir = output_dir or 'data/reports'
        
        # Criar diretório de saída se não existir
        os.makedirs(self.output_dir, exist_ok=True)
        
        logger.info("Analisador de desempenho inicializado")
        
    def _connect_db(self):
        """
        Conecta ao banco de dados de presença.
        
        Returns:
            sqlite3.Connection: Conexão com o banco de dados.
        """
        try:
            conn = sqlite3.connect(self.presence_db_path)
            return conn
        except Exception as e:
            logger.error(f"Erro ao conectar ao banco de dados: {str(e)}")
            raise
            
    def _query_to_dataframe(self, query, params=None):
        """
        Executa uma consulta SQL e retorna os resultados como DataFrame.
        
        Args:
            query (str): Consulta SQL.
            params (tuple, opcional): Parâmetros para a consulta.
            
        Returns:
            pandas.DataFrame: Resultados da consulta.
        """
        try:
            conn = self._connect_db()
            
            if params:
                df = pd.read_sql_query(query, conn, params=params)
            else:
                df = pd.read_sql_query(query, conn)
                
            conn.close()
            return df
        except Exception as e:
            logger.error(f"Erro ao executar consulta: {str(e)}")
            return pd.DataFrame()
            
    def analyze_attendance(self, class_id=None, start_date=None, end_date=None):
        """
        Analisa a frequência dos alunos.
        
        Args:
            class_id (str, opcional): ID da turma para filtrar.
            start_date (datetime, opcional): Data de início do período.
            end_date (datetime, opcional): Data de fim do período.
            
        Returns:
            dict: Resultados da análise de frequência.
        """
        try:
            # Construir consulta SQL
            query = """
                SELECT sc.student_id, sc.class_id, 
                       COUNT(DISTINCT cs.id) as total_classes,
                       COUNT(DISTINCT pe.id) as attended_classes,
                       CAST(COUNT(DISTINCT pe.id) AS FLOAT) / COUNT(DISTINCT cs.id) * 100 as attendance_rate
                FROM student_classes sc
                JOIN class_schedules cs ON sc.class_id = cs.class_id
                LEFT JOIN presence_events pe ON 
                    sc.student_id = pe.student_id AND 
                    cs.location_id = pe.location_id AND
                    pe.event_type IN ('entrada', 'presenca') AND
                    pe.timestamp BETWEEN 
                        datetime(substr(cs.start_time, 1, 10) || ' ' || cs.start_time) AND 
                        datetime(substr(cs.end_time, 1, 10) || ' ' || cs.end_time)
            """
            
            params = []
            
            if class_id:
                query += " WHERE sc.class_id = ?"
                params.append(class_id)
                
            if start_date:
                if 'WHERE' in query:
                    query += " AND"
                else:
                    query += " WHERE"
                query += " cs.start_time >= ?"
                params.append(start_date.isoformat())
                
            if end_date:
                if 'WHERE' in query:
                    query += " AND"
                else:
                    query += " WHERE"
                query += " cs.end_time <= ?"
                params.append(end_date.isoformat())
                
            query += " GROUP BY sc.student_id, sc.class_id"
            
            # Executar consulta
            df = self._query_to_dataframe(query, tuple(params) if params else None)
            
            if df.empty:
                logger.warning("Nenhum dado de frequência encontrado")
                return {
                    'type': AnalysisType.ATTENDANCE.value,
                    'timestamp': datetime.now().isoformat(),
                    'data': [],
                    'summary': {
                        'average_attendance': 0,
                        'min_attendance': 0,
                        'max_attendance': 0,
                        'students_below_75_percent': 0
                    }
                }
                
            # Calcular estatísticas
            avg_attendance = df['attendance_rate'].mean()
            min_attendance = df['attendance_rate'].min()
            max_attendance = df['attendance_rate'].max()
            below_threshold = len(df[df['attendance_rate'] < 75])
            
            # Identificar alunos com frequência abaixo do limiar
            students_at_risk = df[df['attendance_rate'] < 75]['student_id'].tolist()
            
            # Preparar resultado
            result = {
                'type': AnalysisType.ATTENDANCE.value,
                'timestamp': datetime.now().isoformat(),
                'data': df.to_dict('records'),
                'summary': {
                    'average_attendance': float(avg_attendance),
                    'min_attendance': float(min_attendance),
                    'max_attendance': float(max_attendance),
                    'students_below_75_percent': below_threshold,
                    'students_at_risk': students_at_risk
                }
            }
            
            # Gerar gráfico
            if not df.empty:
                self._generate_attendance_chart(df, class_id)
                
            return result
            
        except Exception as e:
            logger.error(f"Erro na análise de frequência: {str(e)}")
            return {
                'type': AnalysisType.ATTENDANCE.value,
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
            
    def _generate_attendance_chart(self, df, class_id=None):
        """
        Gera um gráfico de frequência dos alunos.
        
        Args:
            df (pandas.DataFrame): DataFrame com dados de frequência.
            class_id (str, opcional): ID da turma para incluir no nome do arquivo.
            
        Returns:
            str: Caminho para o arquivo de gráfico gerado.
        """
        try:
            plt.figure(figsize=(12, 6))
            
            # Ordenar por taxa de frequência
            df_sorted = df.sort_values('attendance_rate')
            
            # Criar gráfico de barras
            bars = plt.bar(df_sorted['student_id'], df_sorted['attendance_rate'])
            
            # Colorir barras com base no limiar de 75%
            for i, bar in enumerate(bars):
                if df_sorted.iloc[i]['attendance_rate'] < 75:
                    bar.set_color('red')
                else:
                    bar.set_color('green')
                    
            # Adicionar linha de limiar
            plt.axhline(y=75, color='r', linestyle='--', alpha=0.7)
            
            # Configurar gráfico
            plt.xlabel('ID do Aluno')
            plt.ylabel('Taxa de Frequência (%)')
            plt.title('Taxa de Frequência dos Alunos')
            plt.xticks(rotation=90)
            plt.tight_layout()
            
            # Salvar gráfico
            filename = f"attendance_chart_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            if class_id:
                filename += f"_{class_id}"
            filename += ".png"
            
            filepath = os.path.join(self.output_dir, filename)
            plt.savefig(filepath)
            plt.close()
            
            logger.info(f"Gráfico de frequência salvo em: {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Erro ao gerar gráfico de frequência: {str(e)}")
            return None
            
    def analyze_bathroom_visits(self, student_id=None, class_id=None, start_date=None, end_date=None):
        """
        Analisa as visitas ao banheiro dos alunos.
        
        Args:
            student_id (str, opcional): ID do aluno para filtrar.
            class_id (str, opcional): ID da turma para filtrar.
            start_date (datetime, opcional): Data de início do período.
            end_date (datetime, opcional): Data de fim do período.
            
        Returns:
            dict: Resultados da análise de visitas ao banheiro.
        """
        try:
            # Construir consulta SQL
            query = """
                SELECT ps.student_id, l.name as bathroom_name, 
                       COUNT(ps.id) as visit_count,
                       AVG(ps.duration_seconds) as avg_duration,
                       MAX(ps.duration_seconds) as max_duration,
                       MIN(ps.duration_seconds) as min_duration,
                       SUM(ps.duration_seconds) as total_duration
                FROM presence_sessions ps
                JOIN locations l ON ps.location_id = l.id
                WHERE l.type = 'banheiro' AND ps.exit_timestamp IS NOT NULL
            """
            
            params = []
            
            if student_id:
                query += " AND ps.student_id = ?"
                params.append(student_id)
                
            if class_id:
                query += " AND ps.student_id IN (SELECT student_id FROM student_classes WHERE class_id = ?)"
                params.append(class_id)
                
            if start_date:
                query += " AND ps.entry_timestamp >= ?"
                params.append(start_date.isoformat())
                
            if end_date:
                query += " AND ps.entry_timestamp <= ?"
                params.append(end_date.isoformat())
                
            query += " GROUP BY ps.student_id, l.name"
            query += " ORDER BY visit_count DESC"
            
            # Executar consulta
            df = self._query_to_dataframe(query, tuple(params) if params else None)
            
            if df.empty:
                logger.warning("Nenhum dado de visitas ao banheiro encontrado")
                return {
                    'type': AnalysisType.BATHROOM_VISITS.value,
                    'timestamp': datetime.now().isoformat(),
                    'data': [],
                    'summary': {
                        'total_visits': 0,
                        'avg_duration': 0,
                        'max_duration': 0
                    }
                }
                
            # Calcular estatísticas
            total_visits = df['visit_count'].sum()
            avg_duration = df['avg_duration'].mean()
            max_duration = df['max_duration'].max()
            
            # Identificar alunos com comportamento atípico
            # (mais de 5 visitas ou duração média acima de 5 minutos)
            frequent_visitors = df[df['visit_count'] > 5]['student_id'].tolist()
            long_stayers = df[df['avg_duration'] > 300]['student_id'].tolist()  # 5 minutos = 300 segundos
            
            # Preparar resultado
            result = {
                'type': AnalysisType.BATHROOM_VISITS.value,
                'timestamp': datetime.now().isoformat(),
                'data': df.to_dict('records'),
                'summary': {
                    'total_visits': int(total_visits),
                    'avg_duration': float(avg_duration),
                    'max_duration': float(max_duration),
                    'frequent_visitors': frequent_visitors,
                    'long_stayers': long_stayers
                }
            }
            
            # Gerar gráfico
            if not df.empty:
                self._generate_bathroom_visits_chart(df, student_id, class_id)
                
            return result
            
        except Exception as e:
            logger.error(f"Erro na análise de visitas ao banheiro: {str(e)}")
            return {
                'type': AnalysisType.BATHROOM_VISITS.value,
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
            
    def _generate_bathroom_visits_chart(self, df, student_id=None, class_id=None):
        """
        Gera um gráfico de visitas ao banheiro.
        
        Args:
            df (pandas.DataFrame): DataFrame com dados de visitas ao banheiro.
            student_id (str, opcional): ID do aluno para incluir no nome do arquivo.
            class_id (str, opcional): ID da turma para incluir no nome do arquivo.
            
        Returns:
            str: Caminho para o arquivo de gráfico gerado.
        """
        try:
            plt.figure(figsize=(12, 8))
            
            # Criar gráfico de dispersão
            plt.scatter(df['visit_count'], df['avg_duration'], 
                       s=df['total_duration'] / 60, alpha=0.6)
            
            # Adicionar rótulos para cada ponto
            for i, row in df.iterrows():
                plt.annotate(row['student_id'], 
                            (row['visit_count'], row['avg_duration']),
                            xytext=(5, 5), textcoords='offset points')
                
            # Adicionar linhas de referência
            plt.axvline(x=5, color='r', linestyle='--', alpha=0.5)  # Limite de visitas frequentes
            plt.axhline(y=300, color='r', linestyle='--', alpha=0.5)  # Limite de duração (5 min = 300s)
            
            # Configurar gráfico
            plt.xlabel('Número de Visitas')
            plt.ylabel('Duração Média (segundos)')
            plt.title('Análise de Visitas ao Banheiro')
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            
            # Salvar gráfico
            filename = f"bathroom_visits_chart_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            if student_id:
                filename += f"_student_{student_id}"
            if class_id:
                filename += f"_class_{class_id}"
            filename += ".png"
            
            filepath = os.path.join(self.output_dir, filename)
            plt.savefig(filepath)
            plt.close()
            
            logger.info(f"Gráfico de visitas ao banheiro salvo em: {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Erro ao gerar gráfico de visitas ao banheiro: {str(e)}")
            return None
            
    def analyze_class_exits(self, student_id=None, class_id=None, start_date=None, end_date=None):
        """
        Analisa as saídas de sala de aula dos alunos.
        
        Args:
          
(Content truncated due to size limit. Use line ranges to read in chunks)