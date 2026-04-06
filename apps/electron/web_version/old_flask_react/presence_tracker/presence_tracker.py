"""
Módulo de Registro de Presença para o Sistema Áquila

Este módulo é responsável por registrar a entrada e saída dos alunos nas salas de aula,
calcular o tempo de permanência em diferentes ambientes e manter o histórico de presença.
"""

import logging
from datetime import datetime, timedelta
import os
import sqlite3
import threading
from enum import Enum

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("aquila.presence_tracking")


class LocationType(Enum):
    """Tipos de locais monitorados no sistema."""
    CLASSROOM = "sala_de_aula"
    BATHROOM = "banheiro"
    HALLWAY = "corredor"
    YARD = "patio"
    LIBRARY = "biblioteca"
    CAFETERIA = "cantina"
    OUTSIDE = "fora_da_escola"
    UNKNOWN = "desconhecido"


class EventType(Enum):
    """Tipos de eventos de presença."""
    ENTRY = "entrada"
    EXIT = "saida"
    PRESENCE = "presenca"
    ABSENCE = "ausencia"
    LATE = "atraso"
    SCHOOL_EXIT = "saida_escola"  # opcional: usado para "saiu da escola"


class PresenceTracker:
    """
    Classe principal para rastreamento de presença dos alunos.
    """

    def __init__(self, db_path=None):
        """
        Inicializa o rastreador de presença.

        Args:
            db_path (str, opcional): Caminho para o banco de dados SQLite.
        """
        self.db_path = db_path or "data/presence.db"

        # Garantir que o diretório do banco de dados exista (se houver diretório)
        db_dir = os.path.dirname(self.db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

        # Inicializar banco de dados
        self._init_database()

        # {student_id: {'location': location_id, 'timestamp': timestamp_iso}}
        self.current_locations = {}

        # Lock reentrante para acesso thread-safe (evita deadlock em chamadas encadeadas)
        self.locations_lock = threading.RLock()

        logger.info("Rastreador de presença inicializado")

    def _connect(self):
        # Conexão curta por operação (mais seguro em cenário multi-thread)
        return sqlite3.connect(self.db_path)

    def _init_database(self):
        """
        Inicializa o banco de dados SQLite para armazenamento de registros de presença.
        """
        try:
            conn = self._connect()
            cursor = conn.cursor()

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT
            )
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS presence_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                location_id INTEGER NOT NULL,
                event_type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (location_id) REFERENCES locations (id)
            )
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS presence_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                location_id INTEGER NOT NULL,
                entry_timestamp TEXT NOT NULL,
                exit_timestamp TEXT,
                duration_seconds INTEGER,
                FOREIGN KEY (location_id) REFERENCES locations (id)
            )
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS class_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_id TEXT NOT NULL,
                location_id INTEGER NOT NULL,
                day_of_week INTEGER NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                FOREIGN KEY (location_id) REFERENCES locations (id)
            )
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS student_classes (
                student_id TEXT NOT NULL,
                class_id TEXT NOT NULL,
                PRIMARY KEY (student_id, class_id)
            )
            """)

            conn.commit()
            conn.close()

            logger.info("Banco de dados de presença inicializado com sucesso")

        except Exception as e:
            logger.error(f"Erro ao inicializar banco de dados: {str(e)}")
            raise

    def register_location(self, name, location_type, description=None):
        """
        Registra um novo local no sistema.

        Args:
            name (str): Nome do local.
            location_type (LocationType): Tipo do local.
            description (str, opcional): Descrição do local.

        Returns:
            int: ID do local registrado.
        """
        try:
            conn = self._connect()
            cursor = conn.cursor()

            cursor.execute("SELECT id FROM locations WHERE name = ?", (name,))
            existing = cursor.fetchone()

            if existing:
                logger.info(f"Local '{name}' já existe com ID {existing[0]}")
                conn.close()
                return existing[0]

            cursor.execute(
                "INSERT INTO locations (name, type, description) VALUES (?, ?, ?)",
                (name, location_type.value, description),
            )

            location_id = cursor.lastrowid
            conn.commit()
            conn.close()

            logger.info(f"Local '{name}' registrado com ID {location_id}")
            return location_id

        except Exception as e:
            logger.error(f"Erro ao registrar local: {str(e)}")
            raise

    def register_class_schedule(self, class_id, location_id, day_of_week, start_time, end_time):
        """
        Registra o horário de uma aula.
        """
        try:
            conn = self._connect()
            cursor = conn.cursor()

            cursor.execute(
                """INSERT INTO class_schedules
                   (class_id, location_id, day_of_week, start_time, end_time)
                   VALUES (?, ?, ?, ?, ?)""",
                (class_id, location_id, day_of_week, start_time, end_time),
            )

            schedule_id = cursor.lastrowid
            conn.commit()
            conn.close()

            logger.info(f"Horário registrado para turma {class_id} com ID {schedule_id}")
            return schedule_id

        except Exception as e:
            logger.error(f"Erro ao registrar horário de aula: {str(e)}")
            raise

    def register_student_in_class(self, student_id, class_id):
        """
        Registra um aluno em uma turma.
        """
        try:
            conn = self._connect()
            cursor = conn.cursor()

            cursor.execute(
                "SELECT 1 FROM student_classes WHERE student_id = ? AND class_id = ?",
                (student_id, class_id),
            )

            if cursor.fetchone():
                logger.info(f"Aluno {student_id} já está registrado na turma {class_id}")
                conn.close()
                return True

            cursor.execute(
                "INSERT INTO student_classes (student_id, class_id) VALUES (?, ?)",
                (student_id, class_id),
            )

            conn.commit()
            conn.close()

            logger.info(f"Aluno {student_id} registrado na turma {class_id}")
            return True

        except Exception as e:
            logger.error(f"Erro ao registrar aluno em turma: {str(e)}")
            return False

    def record_presence_event(self, student_id, location_id, event_type: EventType):
        """
        Registra um evento de presença.

        Args:
            student_id (str): ID do aluno.
            location_id (int): ID do local.
            event_type (EventType): Tipo do evento.

        Returns:
            int: ID do evento registrado.
        """
        # Use sep=" " para facilitar DATE(timestamp) no SQLite
        timestamp = datetime.now().isoformat(sep=" ", timespec="seconds")

        try:
            conn = self._connect()
            cursor = conn.cursor()

            cursor.execute(
                """INSERT INTO presence_events
                   (student_id, location_id, event_type, timestamp)
                   VALUES (?, ?, ?, ?)""",
                (student_id, location_id, event_type.value, timestamp),
            )

            event_id = cursor.lastrowid
            conn.commit()
            conn.close()

            logger.info(
                f"Evento de presença registrado: Aluno {student_id}, Local {location_id}, Evento {event_type.value}"
            )

            # Atualizar localização atual + sessões
            with self.locations_lock:
                if event_type == EventType.ENTRY:
                    self.current_locations[student_id] = {"location": location_id, "timestamp": timestamp}
                    self._start_presence_session(student_id, location_id, timestamp)

                elif event_type in (EventType.EXIT, EventType.SCHOOL_EXIT):
                    # Finalizar sessão para o local atual (se bater)
                    if student_id in self.current_locations:
                        prev_location = self.current_locations[student_id]["location"]
                        entry_time = self.current_locations[student_id]["timestamp"]

                        # Só encerra a sessão se o EXIT estiver referenciando o mesmo local atual
                        if prev_location == location_id:
                            self._end_presence_session(student_id, location_id, entry_time, timestamp)

                        # remove localização atual ao sair (inclusive "saida_escola")
                        del self.current_locations[student_id]

                elif event_type == EventType.PRESENCE:
                    # Mantém aluno no local atual; aqui não mexe com sessões
                    if student_id in self.current_locations:
                        self.current_locations[student_id]["timestamp"] = timestamp

            return event_id

        except Exception as e:
            logger.error(f"Erro ao registrar evento de presença: {str(e)}")
            raise

    def _start_presence_session(self, student_id, location_id, timestamp):
        """
        Inicia uma nova sessão de presença.
        """
        try:
            conn = self._connect()
            cursor = conn.cursor()

            cursor.execute(
                """INSERT INTO presence_sessions
                   (student_id, location_id, entry_timestamp)
                   VALUES (?, ?, ?)""",
                (student_id, location_id, timestamp),
            )

            session_id = cursor.lastrowid
            conn.commit()
            conn.close()

            logger.info(f"Sessão de presença iniciada: Aluno {student_id}, Local {location_id}")
            return session_id

        except Exception as e:
            logger.error(f"Erro ao iniciar sessão de presença: {str(e)}")
            return None

    def _end_presence_session(self, student_id, location_id, entry_timestamp, exit_timestamp):
        """
        Finaliza uma sessão de presença.
        """
        try:
            entry_time = datetime.fromisoformat(entry_timestamp)
            exit_time = datetime.fromisoformat(exit_timestamp)
            duration_seconds = int((exit_time - entry_time).total_seconds())

            conn = self._connect()
            cursor = conn.cursor()

            cursor.execute(
                """UPDATE presence_sessions
                   SET exit_timestamp = ?, duration_seconds = ?
                   WHERE student_id = ?
                     AND location_id = ?
                     AND entry_timestamp = ?""",
                (exit_timestamp, duration_seconds, student_id, location_id, entry_timestamp),
            )

            conn.commit()
            conn.close()

            logger.info(
                f"Sessão de presença finalizada: Aluno {student_id}, Local {location_id}, Duração {duration_seconds}s"
            )

        except Exception as e:
            logger.error(f"Erro ao finalizar sessão de presença: {str(e)}")

    def update_student_location(self, student_id, location_id):
        """
        Atualiza a localização de um aluno com base em detecção facial.

        Retorna:
            bool: True se gerou algum evento; False se não gerou.
        """
        current_time = datetime.now()
        timestamp = current_time.isoformat(sep=" ", timespec="seconds")

        # Decide os eventos com lock, mas grava eventos fora do lock
        events_to_emit: list[tuple[int, EventType]] = []

        with self.locations_lock:
            if student_id in self.current_locations:
                prev_location = self.current_locations[student_id]["location"]
                prev_timestamp = self.current_locations[student_id]["timestamp"]

                if prev_location != location_id:
                    # mudou de local: sair do anterior e entrar no novo
                    events_to_emit.append((prev_location, EventType.EXIT))
                    events_to_emit.append((location_id, EventType.ENTRY))
                else:
                    # mesmo local: registra PRESENCE se já passou tempo suficiente
                    prev_time = datetime.fromisoformat(prev_timestamp)
                    if (current_time - prev_time) > timedelta(minutes=5):
                        # atualiza timestamp local (para evitar spam)
                        self.current_locations[student_id]["timestamp"] = timestamp
                        events_to_emit.append((location_id, EventType.PRESENCE))
            else:
                # primeira detecção
                events_to_emit.append((location_id, EventType.ENTRY))

        for loc, ev in events_to_emit:
            self.record_presence_event(student_id, loc, ev)

        return bool(events_to_emit)

       def get_student_location(self, student_id):
        """
        Obtém a localização atual de um aluno.

        Args:
            student_id (str): ID do aluno.

        Returns:
            dict | None: {'location': location_id, 'timestamp': iso_timestamp} ou None.
        """
        with self.locations_lock:
            return self.current_locations.get(student_id, None)

    def get_student_daily_summary(self, student_id, date=None):
        """
        Retorna um resumo diário da presença do aluno.

        Args:
            student_id (str): ID do aluno.
            date (str|None): Data no formato YYYY-MM-DD. Se None, usa hoje.
        """
        if date is None:
            date = datetime.now().date().isoformat()

        conn = self._connect()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT event_type, timestamp
            FROM presence_events
            WHERE student_id = ?
              AND DATE(timestamp) = ?
            ORDER BY timestamp ASC
            """,
            (student_id, date),
        )

        rows = cursor.fetchall()
        conn.close()

        summary = {
            "student_id": student_id,
            "date": date,
            "entered": False,
            "left_school": False,
            "total_time_minutes": 0.0,
            "events": rows,
        }

        last_entry_time = None

        for event_type, ts in rows:
            t = datetime.fromisoformat(ts)

            if event_type == EventType.ENTRY.value:
                summary["entered"] = True
                last_entry_time = t

            elif event_type in (EventType.EXIT.value, EventType.SCHOOL_EXIT.value):
                if last_entry_time:
                    summary["total_time_minutes"] += (t - last_entry_time).total_seconds() / 60.0
                    last_entry_time = None

                if event_type == EventType.SCHOOL_EXIT.value:
                    summary["left_school"] = True

        return summary

    def generate_attendance_report(self, student_id, date=None):
        """
        Gera relatório textual de presença do aluno.
        """
        summary = self.get_student_daily_summary(student_id, date)

        report = []
        report.append("RELATÓRIO DE PRESENÇA")
        report.append(f"Aluno: {summary['student_id']}")
        report.append(f"Data: {summary['date']}")
        report.append("-" * 40)

        if not summary["entered"]:
            report.append("Situação: AUSENTE")
        else:
            report.append("Situação: PRESENTE")

        report.append(f"Saiu da escola: {'SIM' if summary['left_school'] else 'NÃO'}")
        report.append(f"Tempo total (estimado): {int(summary['total_time_minutes'])} minutos")
        report.append("")
        report.append("Eventos:")

        for event_type, ts in summary["events"]:
            report.append(f"{ts} → {event_type}")

        return "\n".join(report)

    def detect_left_school_early(self, student_id, expected_end_hour=12, date=None):
        """
        Verifica se o aluno saiu da escola antes do horário esperado (usa EventType.SCHOOL_EXIT).

        Retorna:
            bool
        """
        if date is None:
            date = datetime.now().date().isoformat()

        summary = self.get_student_daily_summary(student_id, date)
        if not summary["left_school"]:
            return False

        last_school_exit_time = None
        for event_type, ts in summary["events"]:
            if event_type == EventType.SCHOOL_EXIT.value:
                last_school_exit_time = datetime.fromisoformat(ts)

        return bool(last_school_exit_time and last_school_exit_time.hour < expected_end_hour)


if __name__ == "__main__":
    tracker = PresenceTracker()

    sala_101 = tracker.register_location("Sala 101", LocationType.CLASSROOM, "Sala do 9º ano")
    banheiro = tracker.register_location("Banheiro A", LocationType.BATHROOM)

    student = "ALUNO_001"

    tracker.record_presence_event(student, sala_101, EventType.ENTRY)
    tracker.update_student_location(student, sala_101)
    tracker.record_presence_event(student, sala_101, EventType.EXIT)

    tracker.record_presence_event(student, banheiro, EventType.ENTRY)
    tracker.record_presence_event(student, banheiro, EventType.EXIT)

    tracker.record_presence_event(student, sala_101, EventType.SCHOOL_EXIT)

    print(tracker.generate_attendance_report(student))