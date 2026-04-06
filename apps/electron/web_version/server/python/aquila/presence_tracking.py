"""
Sistema de Rastreamento de Presença para Áquila Pro

Gerencia eventos de presença, localização de alunos e análise de comportamento.
"""

import sqlite3
import logging
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class LocationType(Enum):
    """Tipos de localizações na escola."""
    SALA_DE_AULA = "sala_de_aula"
    BANHEIRO = "banheiro"
    CORREDOR = "corredor"
    REFEITORIO = "refeitorio"
    BIBLIOTECA = "biblioteca"
    QUADRA = "quadra"
    ENTRADA = "entrada"
    SAIDA = "saida"


class EventType(Enum):
    """Tipos de eventos de presença."""
    ENTRADA = "entrada"
    SAIDA = "saida"
    PRESENCA = "presenca"
    AUSENCIA = "ausencia"
    ATRASO = "atraso"
    SAIDA_SALA = "saida_sala"
    RETORNO_SALA = "retorno_sala"
    SAIDA_ESCOLA = "saida_escola"


@dataclass
class PresenceEvent:
    """Representa um evento de presença."""
    event_id: int
    student_id: str
    location_id: int
    event_type: str
    timestamp: str
    duration_minutes: Optional[int] = None


class PresenceTracker:
    """Gerencia rastreamento de presença de alunos."""
    
    def __init__(self, db_path: str = "data/presence.db"):
        """
        Inicializa o rastreador de presença.
        
        Args:
            db_path: Caminho para o banco de dados SQLite
        """
        self.db_path = db_path
        self.lock = threading.RLock()
        
        # Criar diretório se não existir
        import os
        os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
        
        # Inicializar banco de dados
        self._init_db()
        
        logger.info(f"PresenceTracker inicializado (DB: {db_path})")
    
    def _init_db(self):
        """Inicializa o banco de dados com as tabelas necessárias."""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Tabela de localizações
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS locations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Tabela de alunos
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS students (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    class_id TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Tabela de eventos de presença
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS presence_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id TEXT NOT NULL,
                    location_id INTEGER NOT NULL,
                    event_type TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    duration_minutes INTEGER,
                    FOREIGN KEY (student_id) REFERENCES students(id),
                    FOREIGN KEY (location_id) REFERENCES locations(id)
                )
            ''')
            
            # Tabela de sessões de presença
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS presence_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id TEXT NOT NULL,
                    location_id INTEGER NOT NULL,
                    start_time TIMESTAMP NOT NULL,
                    end_time TIMESTAMP,
                    duration_minutes INTEGER,
                    FOREIGN KEY (student_id) REFERENCES students(id),
                    FOREIGN KEY (location_id) REFERENCES locations(id)
                )
            ''')
            
            # Tabela de horários de aula
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS class_schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    class_id TEXT NOT NULL,
                    location_id INTEGER NOT NULL,
                    day_of_week INTEGER,
                    start_time TEXT,
                    end_time TEXT,
                    FOREIGN KEY (location_id) REFERENCES locations(id)
                )
            ''')
            
            conn.commit()
            conn.close()
    
    def register_location(
        self,
        name: str,
        location_type: LocationType,
        description: Optional[str] = None
    ) -> int:
        """
        Registra uma nova localização.
        
        Args:
            name: Nome da localização
            location_type: Tipo de localização
            description: Descrição opcional
            
        Returns:
            ID da localização registrada
        """
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                '''INSERT INTO locations (name, type, description)
                   VALUES (?, ?, ?)''',
                (name, location_type.value, description)
            )
            
            location_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"Localização registrada: {name} (ID: {location_id})")
            
            return location_id
    
    def register_student_in_class(
        self,
        student_id: str,
        class_id: str
    ) -> bool:
        """
        Registra um aluno em uma turma.
        
        Args:
            student_id: ID do aluno
            class_id: ID da turma
            
        Returns:
            True se registrado com sucesso
        """
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            try:
                cursor.execute(
                    '''INSERT OR REPLACE INTO students (id, class_id)
                       VALUES (?, ?)''',
                    (student_id, class_id)
                )
                
                conn.commit()
                logger.info(f"Aluno registrado: {student_id} em turma {class_id}")
                return True
                
            except Exception as e:
                logger.error(f"Erro ao registrar aluno: {str(e)}")
                return False
            finally:
                conn.close()
    
    def record_presence_event(
        self,
        student_id: str,
        location_id: int,
        event_type: EventType
    ) -> int:
        """
        Registra um evento de presença.
        
        Args:
            student_id: ID do aluno
            location_id: ID da localização
            event_type: Tipo de evento
            
        Returns:
            ID do evento registrado
        """
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            cursor.execute(
                '''INSERT INTO presence_events (student_id, location_id, event_type, timestamp)
                   VALUES (?, ?, ?, ?)''',
                (student_id, location_id, event_type.value, timestamp)
            )
            
            event_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"Evento registrado: {student_id} - {event_type.value}")
            
            return event_id
    
    def start_session(
        self,
        student_id: str,
        location_id: int
    ) -> int:
        """
        Inicia uma sessão de presença.
        
        Args:
            student_id: ID do aluno
            location_id: ID da localização
            
        Returns:
            ID da sessão
        """
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            cursor.execute(
                '''INSERT INTO presence_sessions (student_id, location_id, start_time)
                   VALUES (?, ?, ?)''',
                (student_id, location_id, start_time)
            )
            
            session_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return session_id
    
    def end_session(self, session_id: int) -> bool:
        """
        Finaliza uma sessão de presença.
        
        Args:
            session_id: ID da sessão
            
        Returns:
            True se finalizado com sucesso
        """
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Obter tempo de início
            cursor.execute(
                'SELECT start_time FROM presence_sessions WHERE id = ?',
                (session_id,)
            )
            result = cursor.fetchone()
            
            if result:
                start_time = datetime.strptime(result[0], "%Y-%m-%d %H:%M:%S")
                end_time_dt = datetime.now()
                duration = int((end_time_dt - start_time).total_seconds() / 60)
                
                cursor.execute(
                    '''UPDATE presence_sessions 
                       SET end_time = ?, duration_minutes = ?
                       WHERE id = ?''',
                    (end_time, duration, session_id)
                )
                
                conn.commit()
                conn.close()
                return True
            
            conn.close()
            return False
    
    def get_student_daily_summary(
        self,
        student_id: str,
        date: Optional[str] = None
    ) -> Dict:
        """
        Obtém um resumo diário de um aluno.
        
        Args:
            student_id: ID do aluno
            date: Data no formato YYYY-MM-DD (hoje se None)
            
        Returns:
            Dicionário com resumo do dia
        """
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")
        
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Contar eventos por tipo
            cursor.execute(
                '''SELECT event_type, COUNT(*) as count
                   FROM presence_events
                   WHERE student_id = ? AND DATE(timestamp) = ?
                   GROUP BY event_type''',
                (student_id, date)
            )
            
            events = {row[0]: row[1] for row in cursor.fetchall()}
            
            # Calcular tempo total em sala
            cursor.execute(
                '''SELECT SUM(duration_minutes) as total
                   FROM presence_sessions
                   WHERE student_id = ? AND DATE(start_time) = ?''',
                (student_id, date)
            )
            
            result = cursor.fetchone()
            total_time = result[0] or 0 if result else 0
            
            conn.close()
            
            return {
                'student_id': student_id,
                'date': date,
                'events': events,
                'total_time_minutes': total_time
            }
    
    def get_time_in_location(
        self,
        student_id: str,
        location_id: int
    ) -> int:
        """
        Obtém o tempo total em uma localização.
        
        Args:
            student_id: ID do aluno
            location_id: ID da localização
            
        Returns:
            Tempo em minutos
        """
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                '''SELECT SUM(duration_minutes) as total
                   FROM presence_sessions
                   WHERE student_id = ? AND location_id = ?''',
                (student_id, location_id)
            )
            
            result = cursor.fetchone()
            conn.close()
            
            return result[0] or 0 if result else 0
    
    def get_last_presence_event(
        self,
        student_id: str,
        location_id: Optional[int] = None
    ) -> Optional[Dict]:
        """
        Obtém o último evento de presença.
        
        Args:
            student_id: ID do aluno
            location_id: ID da localização (opcional)
            
        Returns:
            Dicionário com informações do evento
        """
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if location_id:
                cursor.execute(
                    '''SELECT id, event_type, timestamp
                       FROM presence_events
                       WHERE student_id = ? AND location_id = ?
                       ORDER BY timestamp DESC LIMIT 1''',
                    (student_id, location_id)
                )
            else:
                cursor.execute(
                    '''SELECT id, event_type, timestamp
                       FROM presence_events
                       WHERE student_id = ?
                       ORDER BY timestamp DESC LIMIT 1''',
                    (student_id,)
                )
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                return {
                    'event_id': result[0],
                    'event_type': result[1],
                    'timestamp': result[2]
                }
            
            return None
    
    def generate_attendance_report(
        self,
        class_id: str,
        start_date: str,
        end_date: str
    ) -> List[Dict]:
        """
        Gera relatório de presença de uma turma.
        
        Args:
            class_id: ID da turma
            start_date: Data inicial (YYYY-MM-DD)
            end_date: Data final (YYYY-MM-DD)
            
        Returns:
            Lista com dados de presença
        """
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                '''SELECT s.id, s.name, COUNT(pe.id) as total_events,
                          SUM(CASE WHEN pe.event_type = 'presenca' THEN 1 ELSE 0 END) as presencas,
                          SUM(CASE WHEN pe.event_type = 'ausencia' THEN 1 ELSE 0 END) as ausencias,
                          SUM(CASE WHEN pe.event_type = 'atraso' THEN 1 ELSE 0 END) as atrasos
                   FROM students s
                   LEFT JOIN presence_events pe ON s.id = pe.student_id
                   WHERE s.class_id = ? AND DATE(pe.timestamp) BETWEEN ? AND ?
                   GROUP BY s.id, s.name''',
                (class_id, start_date, end_date)
            )
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    'student_id': row[0],
                    'name': row[1],
                    'total_events': row[2] or 0,
                    'presencas': row[3] or 0,
                    'ausencias': row[4] or 0,
                    'atrasos': row[5] or 0
                })
            
            conn.close()
            
            return results
    
    def detect_left_school_early(
        self,
        student_id: str,
        expected_end_time: str
    ) -> bool:
        """
        Detecta se um aluno saiu da escola mais cedo.
        
        Args:
            student_id: ID do aluno
            expected_end_time: Hora esperada de saída (HH:MM)
            
        Returns:
            True se saiu mais cedo
        """
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            today = datetime.now().strftime("%Y-%m-%d")
            
            cursor.execute(
                '''SELECT timestamp FROM presence_events
                   WHERE student_id = ? AND event_type = 'saida_escola'
                   AND DATE(timestamp) = ?
                   ORDER BY timestamp DESC LIMIT 1''',
                (student_id, today)
            )
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                actual_time = datetime.strptime(result[0], "%Y-%m-%d %H:%M:%S").time()
                expected = datetime.strptime(expected_end_time, "%H:%M").time()
                return actual_time < expected
            
            return False
