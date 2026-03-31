"""
Módulo de Registro de Presença para o Sistema Áquila

Este módulo registra eventos de entrada/saída/presença dos alunos, mantém
a localização atual em memória e grava histórico em um banco SQLite.
"""

from __future__ import annotations

import logging
import os
import sqlite3
import threading
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Any

# Logging
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
    SCHOOL_EXIT = "saida_escola"  # saída da escola (opcional, mas útil)


@dataclass(frozen=True)
class CurrentLocation:
    location: int
    timestamp: str  # "YYYY-MM-DD HH:MM:SS"


class PresenceTracker:
    """
    Classe principal para rastreamento de presença dos alunos.
    """

    def __init__(self, db_path: Optional[str] = None) -> None:
        """
        Args:
            db_path: caminho para o banco SQLite de presença.
        """
        self.db_path = db_path or "data/presence.db"

        db_dir = os.path.dirname(self.db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

        # localização atual (memória)
        self.current_locations: dict[str, CurrentLocation] = {}

        # lock reentrante (evita deadlock se métodos se chamarem)
        self.locations_lock = threading.RLock()

        self._init_database()
        logger.info("Rastreador de presença inicializado (db=%s)", self.db_path)

    # -----------------------
    # DB helpers
    # -----------------------
    def _connect(self) -> sqlite3.Connection:
        # conexão curta por operação é mais robusta em multi-thread
        return sqlite3.connect(self.db_path)

    def _init_database(self) -> None:
        """
        Inicializa tabelas do SQLite para armazenamento de registros.
        """
        conn = self._connect()
        try:
            cur = conn.cursor()

            cur.execute("""
            CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT
            )
            """)

            cur.execute("""
            CREATE TABLE IF NOT EXISTS presence_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                location_id INTEGER NOT NULL,
                event_type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (location_id) REFERENCES locations (id)
            )
            """)

            cur.execute("""
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

            cur.execute("""
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

            cur.execute("""
            CREATE TABLE IF NOT EXISTS student_classes (
                student_id TEXT NOT NULL,
                class_id TEXT NOT NULL,
                PRIMARY KEY (student_id, class_id)
            )
            """)

            conn.commit()
            logger.info("Banco de dados de presença inicializado com sucesso")
        finally:
            conn.close()

    # -----------------------
    # Cadastro / Config
    # -----------------------
    def register_location(self, name: str, location_type: LocationType, description: Optional[str] = None) -> int:
        """
        Registra um novo local (se não existir) e retorna o ID.

        Returns:
            location_id (int)
        """
        conn = self._connect()
        try:
            cur = conn.cursor()

            cur.execute("SELECT id FROM locations WHERE name = ?", (name,))
            row = cur.fetchone()
            if row:
                return int(row[0])

            cur.execute(
                "INSERT INTO locations (name, type, description) VALUES (?, ?, ?)",
                (name, location_type.value, description),
            )
            conn.commit()
            return int(cur.lastrowid)
        finally:
            conn.close()

    def register_class_schedule(
        self,
        class_id: str,
        location_id: int,
        day_of_week: int,
        start_time: str,
        end_time: str,
    ) -> int:
        """
        Registra o horário de uma aula.

        day_of_week: 0-6 (0=segunda)
        start_time/end_time: "HH:MM" (ou outro padrão que você use)
        """
        conn = self._connect()
        try:
            cur = conn.cursor()
            cur.execute(
                """INSERT INTO class_schedules
                   (class_id, location_id, day_of_week, start_time, end_time)
                   VALUES (?, ?, ?, ?, ?)""",
                (class_id, location_id, day_of_week, start_time, end_time),
            )
            conn.commit()
            return int(cur.lastrowid)
        finally:
            conn.close()

    def register_student_in_class(self, student_id: str, class_id: str) -> bool:
        """
        Registra um aluno em uma turma.
        """
        conn = self._connect()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT 1 FROM student_classes WHERE student_id = ? AND class_id = ?",
                (student_id, class_id),
            )
            if cur.fetchone():
                return True

            cur.execute(
                "INSERT INTO student_classes (student_id, class_id) VALUES (?, ?)",
                (student_id, class_id),
            )
            conn.commit()
            return True
        except Exception:
            logger.exception("Erro ao registrar aluno em turma")
            return False
        finally:
            conn.close()

    # -----------------------
    # Eventos / Sessões
    # -----------------------
    def record_presence_event(self, student_id: str, location_id: int, event_type: EventType) -> int:
        """
        Registra um evento de presença e atualiza estado em memória (current_locations).

        Returns:
            event_id (int)
        """
        # IMPORTANTE: usar espaço ao invés de "T" melhora compatibilidade com DATE(timestamp) no SQLite
        timestamp = datetime.now().isoformat(sep=" ", timespec="seconds")

        conn = self._connect()
        try:
            cur = conn.cursor()
            cur.execute(
                """INSERT INTO presence_events (student_id, location_id, event_type, timestamp)
                   VALUES (?, ?, ?, ?)""",
                (student_id, location_id, event_type.value, timestamp),
            )
            event_id = int(cur.lastrowid)
            conn.commit()
        finally:
            conn.close()

        # Atualizar memória + sessões
        with self.locations_lock:
            if event_type == EventType.ENTRY:
                self.current_locations[student_id] = CurrentLocation(location=location_id, timestamp=timestamp)
                self._start_presence_session(student_id, location_id, timestamp)

            elif event_type in (EventType.EXIT, EventType.SCHOOL_EXIT):
                prev = self.current_locations.get(student_id)
                if prev and prev.location == location_id:
                    self._end_presence_session(student_id, location_id, prev.timestamp, timestamp)
                # ao sair, remove a localização atual
                if student_id in self.current_locations:
                    del self.current_locations[student_id]

            elif event_type == EventType.PRESENCE:
                # atualiza timestamp de presença (mantém no local)
                prev = self.current_locations.get(student_id)
                if prev:
                    self.current_locations[student_id] = CurrentLocation(location=prev.location, timestamp=timestamp)

        return event_id

    def _start_presence_session(self, student_id: str, location_id: int, entry_timestamp: str) -> Optional[int]:
        conn = self._connect()
        try:
            cur = conn.cursor()
            cur.execute(
                """INSERT INTO presence_sessions (student_id, location_id, entry_timestamp)
                   VALUES (?, ?, ?)""",
                (student_id, location_id, entry_timestamp),
            )
            conn.commit()
            return int(cur.lastrowid)
        except Exception:
            logger.exception("Erro ao iniciar sessão de presença")
            return None
        finally:
            conn.close()

    def _end_presence_session(
        self,
        student_id: str,
        location_id: int,
        entry_timestamp: str,
        exit_timestamp: str,
    ) -> None:
        try:
            entry_time = datetime.fromisoformat(entry_timestamp)
            exit_time = datetime.fromisoformat(exit_timestamp)
            duration_seconds = int((exit_time - entry_time).total_seconds())
        except Exception:
            logger.exception("Erro ao calcular duração da sessão")
            duration_seconds = None  # type: ignore[assignment]

        conn = self._connect()
        try:
            cur = conn.cursor()
            cur.execute(
                """UPDATE presence_sessions
                   SET exit_timestamp = ?, duration_seconds = ?
                   WHERE student_id = ?
                     AND location_id = ?
                     AND entry_timestamp = ?""",
                (exit_timestamp, duration_seconds, student_id, location_id, entry_timestamp),
            )
            conn.commit()
        except Exception:
            logger.exception("Erro ao finalizar sessão de presença")
        finally:
            conn.close()

    def update_student_location(self, student_id: str, location_id: int) -> bool:
        """
        Atualiza a localização do aluno (ex.: via reconhecimento facial).

        Regras:
        - Se mudou de local: EXIT do local anterior e ENTRY no novo.
        - Se permaneceu no mesmo local por >5 min desde o último timestamp: PRESENCE.

        Returns:
            True se gerou eventos; False caso contrário.
        """
        now = datetime.now()
        now_ts = now.isoformat(sep=" ", timespec="seconds")

        events_to_emit: list[tuple[int, EventType]] = []

        with self.locations_lock:
            prev = self.current_locations.get(student_id)

            if prev is None:
                events_to_emit.append((location_id, EventType.ENTRY))
            else:
                if prev.location != location_id:
                    events_to_emit.append((prev.location, EventType.EXIT))
                    events_to_emit.append((location_id, EventType.ENTRY))
                else:
                    prev_time = datetime.fromisoformat(prev.timestamp)
                    if (now - prev_time) > timedelta(minutes=5):
                        # atualiza o timestamp local (para evitar spam)
                        self.current_locations[student_id] = CurrentLocation(location=prev.location, timestamp=now_ts)
                        events_to_emit.append((location_id, EventType.PRESENCE))

        # Emite fora do lock (evita reentrância pesada)
        for loc, ev in events_to_emit:
            self.record_presence_event(student_id, loc, ev)

        return bool(events_to_emit)

    # -----------------------
    # Consultas / Relatórios
    # -----------------------
    def get_student_location(self, student_id: str) -> Optional[dict[str, Any]]:
        """
        Obtém a localização atual de um aluno.

        Returns:
            dict com keys: location, timestamp; ou None.
        """
        with self.locations_lock:
            loc = self.current_locations.get(student_id)
            if not loc:
                return None
            return {"location": loc.location, "timestamp": loc.timestamp}

    def get_student_daily_summary(self, student_id: str, date: Optional[str] = None) -> dict[str, Any]:
        """
        Resumo diário baseado em presence_events.

        Args:
            date: "YYYY-MM-DD" (se None, usa hoje)
        """
        if date is None:
            date = datetime.now().date().isoformat()

        conn = self._connect()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT event_type, timestamp
                FROM presence_events
                WHERE student_id = ?
                  AND DATE(timestamp) = ?
                ORDER BY timestamp ASC
                """,
                (student_id, date),
            )
            rows = cur.fetchall()
        finally:
            conn.close()

        summary = {
            "student_id": student_id,
            "date": date,
            "entered": False,
            "left_school": False,
            "total_time_minutes": 0.0,
            "events": rows,
        }

        last_entry_time: Optional[datetime] = None

        for event_type, ts in rows:
            t = datetime.fromisoformat(ts)

            if event_type == EventType.ENTRY.value:
                summary["entered"] = True
                last_entry_time = t

            elif event_type in (EventType.EXIT.value, EventType.SCHOOL_EXIT.value):
                if last_entry_time is not None:
                    summary["total_time_minutes"] += (t - last_entry_time).total_seconds() / 60.0
                    last_entry_time = None

                if event_type == EventType.SCHOOL_EXIT.value:
                    summary["left_school"] = True

        return summary

    def generate_attendance_report(self, student_id: str, date: Optional[str] = None) -> str:
        """
        Gera relatório textual simples do aluno no dia.
        """
        summary = self.get_student_daily_summary(student_id, date)

        report: list[str] = []
        report.append("RELATÓRIO DE PRESENÇA")
        report.append(f"Aluno: {summary['student_id']}")
        report.append(f"Data: {summary['date']}")
        report.append("-" * 40)

        report.append("Situação: AUSENTE" if not summary["entered"] else "Situação: PRESENTE")
        report.append(f"Saiu da escola: {'SIM' if summary['left_school'] else 'NÃO'}")
        report.append(f"Tempo total (estimado): {int(summary['total_time_minutes'])} minutos")
        report.append("")
        report.append("Eventos:")

        for event_type, ts in summary["events"]:
            report.append(f"{ts} → {event_type}")

        return "\n".join(report)

    def detect_left_school_early(self, student_id: str, expected_end_hour: int = 12, date: Optional[str] = None) -> bool:
        """
        Detecta saída antecipada (requer que você registre EventType.SCHOOL_EXIT).

        Returns:
            True se houver saida_escola antes de expected_end_hour.
        """
        if date is None:
            date = datetime.now().date().isoformat()

        summary = self.get_student_daily_summary(student_id, date)
        if not summary["left_school"]:
            return False

        last_school_exit_time: Optional[datetime] = None
        for event_type, ts in summary["events"]:
            if event_type == EventType.SCHOOL_EXIT.value:
                last_school_exit_time = datetime.fromisoformat(ts)

        return bool(last_school_exit_time and last_school_exit_time.hour < expected_end_hour)


if __name__ == "__main__":
    # Teste rápido opcional
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