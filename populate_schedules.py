import sqlite3
import os
import uuid
import random

# Mapping of classes to standardized names and IDs
CLASSES = [
    {"id": "cls_1ano_a", "name": "1º Ano A", "grade": "1º Ano"},
    {"id": "cls_1ano_b", "name": "1º Ano B", "grade": "1º Ano"},
    {"id": "cls_2ano_a", "name": "2º Ano A", "grade": "2º Ano"},
    {"id": "cls_2ano_b", "name": "2º Ano B", "grade": "2º Ano"},
    {"id": "cls_3ano_a", "name": "3º Ano A", "grade": "3º Ano"},
    {"id": "cls_3ano_b", "name": "3º Ano B", "grade": "3º Ano"},
    {"id": "cls_4ano_a", "name": "4º Ano A", "grade": "4º Ano"},
    {"id": "cls_4ano_b", "name": "4º Ano B", "grade": "4º Ano"},
    {"id": "cls_5ano_a", "name": "5º Ano A", "grade": "5º Ano"},
    {"id": "cls_5ano_b", "name": "5º Ano B", "grade": "5º Ano"},
    {"id": "cls_6ano_a", "name": "6º Ano A", "grade": "6º Ano"},
    {"id": "cls_6ano_b", "name": "6º Ano B", "grade": "6º Ano"},
    {"id": "cls_7ano_a", "name": "7º Ano A", "grade": "7º Ano"},
    {"id": "cls_7ano_b", "name": "7º Ano B", "grade": "7º Ano"},
    {"id": "cls_8ano_a", "name": "8º Ano A", "grade": "8º Ano"},
    {"id": "cls_8ano_b", "name": "8º Ano B", "grade": "8º Ano"},
    {"id": "cls_9ano_a", "name": "9º Ano A", "grade": "9º Ano"},
    {"id": "cls_9ano_b", "name": "9º Ano B", "grade": "9º Ano"},
    {"id": "cls_1serie_a", "name": "1ª Série A", "grade": "1ª Série"},
    {"id": "cls_1serie_b", "name": "1ª Série B", "grade": "1ª Série"},
    {"id": "cls_2serie_a", "name": "2ª Série A", "grade": "2ª Série"},
    {"id": "cls_3serie_a", "name": "3ª Série A", "grade": "3ª Série"},
]

CLASS_NAME_TO_ID = {
    "1 ANO A": "cls_1ano_a",
    "1 ANO B": "cls_1ano_b",
    "2 ANO A": "cls_2ano_a",
    "2 ANO B": "cls_2ano_b",
    "3 ANO A": "cls_3ano_a",
    "3 ANO B": "cls_3ano_b",
    "4 ANO A": "cls_4ano_a",
    "4 ANO B": "cls_4ano_b",
    "5 ANO A": "cls_5ano_a",
    "5 ANO B": "cls_5ano_b",
    "6 ANO A": "cls_6ano_a",
    "6 ANO B": "cls_6ano_b",
    "7 ANO A": "cls_7ano_a",
    "7 ANO B": "cls_7ano_b",
    "8 ANO A": "cls_8ano_a",
    "8 ANO B": "cls_8ano_b",
    "9 ANO A": "cls_9ano_a",
    "9 ANO B": "cls_9ano_b",
    "1 SERIE A": "cls_1serie_a",
    "1 SERIE B": "cls_1serie_b",
    "2 SERIE A": "cls_2serie_a",
    "3 SERIE A": "cls_3serie_a",
}

# Time slot mapping (start, end)
SLOTS = {
    "07:30": ("07:30", "08:20"),
    "08:20": ("08:20", "09:10"),
    "09:10": ("09:10", "10:00"),
    "10:30": ("10:30", "11:20"),
    "11:10": ("11:10", "12:00"),
    "12:00": ("12:00", "12:50"),
    "14:20": ("14:20", "15:10"),
    "15:10": ("15:10", "16:00"),
    "16:20": ("16:20", "17:10"),
    "17:10": ("17:10", "18:00"),
}

DAYS = {
    "Seg": 1,
    "Ter": 2,
    "Qua": 3,
    "Qui": 4,
    "Sex": 5,
}

# Raw schedule entries from Urânia PDF parsing
# tuple: (TeacherName, Subject, TimeSlot, DayOfWeekStr, ClassName)
SCHEDULE_RAW = [
    # ANA FLAVIA (Matemática / Geral)
    ("ANA FLAVIA", "Matemática", "07:30", "Seg", "6 ANO A"),
    ("ANA FLAVIA", "Matemática", "07:30", "Ter", "6 ANO A"),
    ("ANA FLAVIA", "Matemática", "07:30", "Qua", "8 ANO A"),
    ("ANA FLAVIA", "Matemática", "07:30", "Qui", "5 ANO A"),
    ("ANA FLAVIA", "Matemática", "07:30", "Sex", "5 ANO B"),
    ("ANA FLAVIA", "Matemática", "08:20", "Seg", "5 ANO B"),
    ("ANA FLAVIA", "Matemática", "08:20", "Ter", "5 ANO A"),
    ("ANA FLAVIA", "Matemática", "08:20", "Qua", "1 SERIE B"),
    ("ANA FLAVIA", "Matemática", "08:20", "Qui", "4 ANO A"),
    ("ANA FLAVIA", "Matemática", "08:20", "Sex", "6 ANO B"),
    ("ANA FLAVIA", "Matemática", "09:10", "Seg", "4 ANO B"),
    ("ANA FLAVIA", "Matemática", "09:10", "Ter", "4 ANO A"),
    ("ANA FLAVIA", "Matemática", "09:10", "Qua", "6 ANO B"),
    ("ANA FLAVIA", "Matemática", "09:10", "Qui", "9 ANO B"),
    ("ANA FLAVIA", "Matemática", "09:10", "Sex", "9 ANO A"),
    ("ANA FLAVIA", "Matemática", "10:30", "Seg", "4 ANO B"),
    ("ANA FLAVIA", "Matemática", "10:30", "Ter", "6 ANO A"),
    ("ANA FLAVIA", "Matemática", "10:30", "Qua", "5 ANO B"),
    ("ANA FLAVIA", "Matemática", "10:30", "Qui", "4 ANO A"),
    ("ANA FLAVIA", "Matemática", "10:30", "Sex", "7 ANO B"),
    ("ANA FLAVIA", "Matemática", "11:10", "Seg", "5 ANO A"),
    ("ANA FLAVIA", "Matemática", "11:10", "Ter", "6 ANO B"),
    ("ANA FLAVIA", "Matemática", "11:10", "Qua", "4 ANO B"),
    ("ANA FLAVIA", "Matemática", "11:10", "Qui", "6 ANO B"),
    ("ANA FLAVIA", "Matemática", "11:10", "Sex", "6 ANO A"),
    ("ANA FLAVIA", "Matemática", "12:00", "Ter", "8 ANO B"),
    ("ANA FLAVIA", "Matemática", "12:00", "Qua", "2 SERIE A"),
    ("ANA FLAVIA", "Matemática", "12:00", "Qui", "7 ANO A"),
    ("ANA FLAVIA", "Matemática", "16:20", "Qui", "1 SERIE A"),
    ("ANA FLAVIA", "Matemática", "17:10", "Qui", "3 SERIE A"),

    # ANA INGLES (Língua Inglesa)
    ("ANA INGLES", "Inglês", "08:20", "Seg", "4 ANO B"),
    ("ANA INGLES", "Inglês", "08:20", "Ter", "4 ANO A"),
    ("ANA INGLES", "Inglês", "08:20", "Qua", "4 ANO B"),
    ("ANA INGLES", "Inglês", "08:20", "Qui", "3 ANO A"),
    ("ANA INGLES", "Inglês", "08:20", "Sex", "4 ANO A"),
    ("ANA INGLES", "Inglês", "09:10", "Seg", "3 ANO B"),
    ("ANA INGLES", "Inglês", "09:10", "Ter", "3 ANO A"),
    ("ANA INGLES", "Inglês", "09:10", "Qua", "4 ANO A"),
    ("ANA INGLES", "Inglês", "09:10", "Qui", "4 ANO A"),
    ("ANA INGLES", "Inglês", "09:10", "Sex", "3 ANO A"),
    ("ANA INGLES", "Inglês", "10:30", "Seg", "3 ANO A"),
    ("ANA INGLES", "Inglês", "10:30", "Ter", "3 ANO B"),
    ("ANA INGLES", "Inglês", "10:30", "Qua", "3 ANO B"),
    ("ANA INGLES", "Inglês", "10:30", "Qui", "3 ANO B"),
    ("ANA INGLES", "Inglês", "10:30", "Sex", "4 ANO B"),
    ("ANA INGLES", "Inglês", "11:10", "Seg", "4 ANO A"),
    ("ANA INGLES", "Inglês", "11:10", "Ter", "4 ANO B"),
    ("ANA INGLES", "Inglês", "11:10", "Qua", "3 ANO A"),
    ("ANA INGLES", "Inglês", "11:10", "Qui", "4 ANO B"),
    ("ANA INGLES", "Inglês", "11:10", "Sex", "3 ANO B"),

    # ANA MARIA (Português / Polivalente)
    ("ANA MARIA", "Português", "07:30", "Seg", "4 ANO A"),
    ("ANA MARIA", "Português", "07:30", "Qua", "4 ANO B"),
    ("ANA MARIA", "Português", "07:30", "Qui", "4 ANO A"),
    ("ANA MARIA", "Português", "07:30", "Sex", "4 ANO B"),
    ("ANA MARIA", "Português", "08:20", "Seg", "5 ANO A"),
    ("ANA MARIA", "Português", "08:20", "Ter", "5 ANO B"),
    ("ANA MARIA", "Português", "08:20", "Qua", "5 ANO B"),
    ("ANA MARIA", "Português", "08:20", "Qui", "4 ANO B"),
    ("ANA MARIA", "Português", "08:20", "Sex", "5 ANO A"),
    ("ANA MARIA", "Português", "09:10", "Seg", "4 ANO A"),
    ("ANA MARIA", "Português", "09:10", "Ter", "5 ANO A"),
    ("ANA MARIA", "Português", "09:10", "Qua", "4 ANO B"),
    ("ANA MARIA", "Português", "09:10", "Qui", "5 ANO B"),
    ("ANA MARIA", "Português", "09:10", "Sex", "4 ANO A"),
    ("ANA MARIA", "Português", "10:30", "Seg", "5 ANO A"),
    ("ANA MARIA", "Português", "10:30", "Ter", "4 ANO B"),
    ("ANA MARIA", "Português", "10:30", "Qua", "5 ANO A"),
    ("ANA MARIA", "Português", "10:30", "Qui", "4 ANO B"),
    ("ANA MARIA", "Português", "10:30", "Sex", "5 ANO B"),
    ("ANA MARIA", "Português", "11:10", "Seg", "5 ANO B"),
    ("ANA MARIA", "Português", "11:10", "Ter", "4 ANO A"),
    ("ANA MARIA", "Português", "11:10", "Qua", "4 ANO A"),
    ("ANA MARIA", "Português", "11:10", "Qui", "5 ANO B"),
    ("ANA MARIA", "Português", "11:10", "Sex", "5 ANO A"),

    # ANDRE (História / Geografia)
    ("ANDRE", "História", "07:30", "Seg", "7 ANO B"),
    ("ANDRE", "História", "07:30", "Ter", "9 ANO B"),
    ("ANDRE", "História", "07:30", "Qua", "3 SERIE A"),
    ("ANDRE", "História", "07:30", "Sex", "8 ANO A"),
    ("ANDRE", "História", "08:20", "Seg", "9 ANO A"),
    ("ANDRE", "História", "08:20", "Ter", "9 ANO A"),
    ("ANDRE", "História", "08:20", "Qua", "8 ANO B"),
    ("ANDRE", "História", "08:20", "Sex", "9 ANO A"),
    ("ANDRE", "História", "09:10", "Seg", "8 ANO A"),
    ("ANDRE", "História", "09:10", "Ter", "7 ANO A"),
    ("ANDRE", "História", "09:10", "Qua", "1 SERIE A"),
    ("ANDRE", "História", "09:10", "Sex", "7 ANO A"),
    ("ANDRE", "História", "10:30", "Seg", "9 ANO B"),
    ("ANDRE", "História", "10:30", "Ter", "7 ANO A"),
    ("ANDRE", "História", "10:30", "Qua", "3 SERIE A"),
    ("ANDRE", "História", "10:30", "Sex", "9 ANO B"),
    ("ANDRE", "História", "11:10", "Seg", "8 ANO B"),
    ("ANDRE", "História", "11:10", "Ter", "1 SERIE B"),
    ("ANDRE", "História", "11:10", "Qua", "8 ANO B"),
    ("ANDRE", "História", "11:10", "Sex", "7 ANO B"),
    ("ANDRE", "História", "12:00", "Seg", "2 SERIE A"),
    ("ANDRE", "História", "12:00", "Ter", "8 ANO A"),
    ("ANDRE", "História", "12:00", "Qua", "7 ANO B"),
    ("ANDRE", "História", "12:00", "Sex", "1 SERIE A"),
    ("ANDRE", "História", "16:20", "Ter", "1 SERIE B"),
    ("ANDRE", "História", "17:10", "Ter", "2 SERIE A"),

    # ANITA (Geografia)
    ("ANITA", "Geografia", "08:20", "Seg", "7 ANO A"),
    ("ANITA", "Geografia", "09:10", "Seg", "8 ANO B"),
    ("ANITA", "Geografia", "10:30", "Seg", "6 ANO B"),
    ("ANITA", "Geografia", "10:30", "Qui", "9 ANO B"),
    ("ANITA", "Geografia", "11:10", "Seg", "8 ANO A"),
    ("ANITA", "Geografia", "11:10", "Ter", "9 ANO A"),
    ("ANITA", "Geografia", "11:10", "Qui", "7 ANO B"),
    ("ANITA", "Geografia", "12:00", "Qui", "6 ANO A"),

    # BETY (Biologia / Ciências)
    ("BETY", "Biologia", "07:30", "Ter", "1 SERIE B"),
    ("BETY", "Biologia", "08:20", "Ter", "3 SERIE A"),
    ("BETY", "Biologia", "09:10", "Ter", "1 SERIE A"),
    ("BETY", "Biologia", "10:30", "Ter", "3 SERIE A"),
    ("BETY", "Biologia", "11:10", "Ter", "2 SERIE A"),
    ("BETY", "Biologia", "12:00", "Ter", "1 SERIE B"),
    ("BETY", "Biologia", "14:20", "Ter", "1 SERIE A"),
    ("BETY", "Biologia", "15:10", "Ter", "2 SERIE A"),

    # CELIA (Pedagogia 1º Ano B)
    ("CELIA", "Pedagogia", "07:30", "Seg", "1 ANO B"),
    ("CELIA", "Pedagogia", "07:30", "Ter", "1 ANO B"),
    ("CELIA", "Pedagogia", "07:30", "Qua", "1 ANO B"),
    ("CELIA", "Pedagogia", "08:20", "Seg", "1 ANO B"),
    ("CELIA", "Pedagogia", "08:20", "Ter", "1 ANO B"),
    ("CELIA", "Pedagogia", "08:20", "Qua", "1 ANO B"),
    ("CELIA", "Pedagogia", "08:20", "Sex", "1 ANO B"),
    ("CELIA", "Pedagogia", "09:10", "Seg", "1 ANO B"),
    ("CELIA", "Pedagogia", "09:10", "Ter", "1 ANO B"),
    ("CELIA", "Pedagogia", "09:10", "Qua", "1 ANO B"),
    ("CELIA", "Pedagogia", "09:10", "Sex", "1 ANO B"),
    ("CELIA", "Pedagogia", "10:30", "Qui", "1 ANO B"),
    ("CELIA", "Pedagogia", "10:30", "Sex", "1 ANO B"),
    ("CELIA", "Pedagogia", "11:10", "Seg", "1 ANO B"),
    ("CELIA", "Pedagogia", "11:10", "Ter", "1 ANO B"),
    ("CELIA", "Pedagogia", "11:10", "Qua", "1 ANO B"),
    ("CELIA", "Pedagogia", "11:10", "Qui", "1 ANO B"),
    ("CELIA", "Pedagogia", "11:10", "Sex", "1 ANO B"),

    # CHEBINHA (Física)
    ("CHEBINHA", "Física", "07:30", "Seg", "1 SERIE A"),
    ("CHEBINHA", "Física", "08:20", "Seg", "2 SERIE A"),
    ("CHEBINHA", "Física", "09:10", "Seg", "1 SERIE B"),
    ("CHEBINHA", "Física", "10:30", "Seg", "1 SERIE A"),
    ("CHEBINHA", "Física", "11:10", "Seg", "3 SERIE A"),
    ("CHEBINHA", "Física", "12:00", "Seg", "1 SERIE B"),

    # CLAUDIA (Artes / Música)
    ("CLAUDIA", "Artes", "07:30", "Qui", "3 ANO A"),
    ("CLAUDIA", "Artes", "07:30", "Sex", "4 ANO A"),
    ("CLAUDIA", "Artes", "08:20", "Qui", "1 ANO B"),
    ("CLAUDIA", "Artes", "08:20", "Sex", "2 ANO A"),
    ("CLAUDIA", "Artes", "09:10", "Qui", "1 ANO A"),
    ("CLAUDIA", "Artes", "09:10", "Sex", "5 ANO B"),
    ("CLAUDIA", "Artes", "10:30", "Qui", "2 ANO B"),
    ("CLAUDIA", "Artes", "10:30", "Sex", "3 ANO B"),
    ("CLAUDIA", "Artes", "11:10", "Qui", "5 ANO A"),
    ("CLAUDIA", "Artes", "11:10", "Sex", "4 ANO B"),

    # DANIELE (Química)
    ("DANIELE", "Química", "07:30", "Qua", "1 SERIE A"),
    ("DANIELE", "Química", "07:30", "Qui", "9 ANO A"),
    ("DANIELE", "Química", "08:20", "Qua", "8 ANO A"),
    ("DANIELE", "Química", "08:20", "Qui", "9 ANO B"),
    ("DANIELE", "Química", "09:10", "Qua", "2 SERIE A"),
    ("DANIELE", "Química", "09:10", "Qui", "6 ANO B"),
    ("DANIELE", "Química", "10:30", "Qua", "7 ANO B"),
    ("DANIELE", "Química", "10:30", "Qui", "6 ANO A"),
    ("DANIELE", "Química", "11:10", "Qua", "1 SERIE B"),
    ("DANIELE", "Química", "11:10", "Qui", "7 ANO A"),
    ("DANIELE", "Química", "12:00", "Qua", "3 SERIE A"),
    ("DANIELE", "Química", "12:00", "Qui", "8 ANO B"),

    # DANIELLE (Português)
    ("DANIELLE", "Português", "07:30", "Seg", "7 ANO A"),
    ("DANIELLE", "Português", "07:30", "Ter", "7 ANO B"),
    ("DANIELLE", "Português", "07:30", "Qua", "6 ANO A"),
    ("DANIELLE", "Português", "07:30", "Sex", "6 ANO B"),
    ("DANIELLE", "Português", "08:20", "Seg", "6 ANO B"),
    ("DANIELLE", "Português", "08:20", "Ter", "6 ANO B"),
    ("DANIELLE", "Português", "08:20", "Qua", "7 ANO A"),
    ("DANIELLE", "Português", "08:20", "Sex", "7 ANO A"),
    ("DANIELLE", "Português", "09:10", "Seg", "6 ANO A"),
    ("DANIELLE", "Português", "09:10", "Ter", "6 ANO A"),
    ("DANIELLE", "Português", "09:10", "Qua", "6 ANO A"),
    ("DANIELLE", "Português", "09:10", "Sex", "7 ANO B"),
    ("DANIELLE", "Português", "10:30", "Seg", "7 ANO B"),
    ("DANIELLE", "Português", "10:30", "Ter", "6 ANO B"),
    ("DANIELLE", "Português", "10:30", "Qua", "7 ANO A"),
    ("DANIELLE", "Português", "10:30", "Sex", "6 ANO A"),
    ("DANIELLE", "Português", "11:10", "Seg", "6 ANO B"),
    ("DANIELLE", "Português", "11:10", "Ter", "7 ANO B"),
    ("DANIELLE", "Português", "11:10", "Qua", "7 ANO B"),
    ("DANIELLE", "Português", "11:10", "Sex", "7 ANO A"),

    # DIGAO (Educação Física Ensino Médio)
    ("DIGAO", "Ed. Física", "07:30", "Qui", "2 SERIE A"),
    ("DIGAO", "Ed. Física", "08:20", "Qui", "1 SERIE A"),
    ("DIGAO", "Ed. Física", "09:10", "Qui", "1 SERIE B"),
    ("DIGAO", "Ed. Física", "10:30", "Qui", "3 SERIE A"),
    ("DIGAO", "Ed. Física", "11:10", "Qui", "1 SERIE A"),
    ("DIGAO", "Ed. Física", "12:00", "Qui", "2 SERIE A"),
    ("DIGAO", "Ed. Física", "14:20", "Qui", "1 SERIE B"),
    ("DIGAO", "Ed. Física", "15:10", "Qui", "3 SERIE A"),

    # ED. FISICA 1 (Educação Física)
    ("ED. FISICA 1", "Ed. Física", "07:30", "Seg", "5 ANO A"),
    ("ED. FISICA 1", "Ed. Física", "07:30", "Seg", "5 ANO B"),
    ("ED. FISICA 1", "Ed. Física", "07:30", "Ter", "4 ANO A"),
    ("ED. FISICA 1", "Ed. Física", "07:30", "Ter", "4 ANO B"),
    ("ED. FISICA 1", "Ed. Física", "07:30", "Qua", "3 ANO A"),
    ("ED. FISICA 1", "Ed. Física", "07:30", "Qua", "3 ANO B"),
    ("ED. FISICA 1", "Ed. Física", "07:30", "Qui", "1 ANO A"),
    ("ED. FISICA 1", "Ed. Física", "07:30", "Qui", "1 ANO B"),
    ("ED. FISICA 1", "Ed. Física", "07:30", "Sex", "2 ANO A"),
    ("ED. FISICA 1", "Ed. Física", "07:30", "Sex", "2 ANO B"),
    ("ED. FISICA 1", "Ed. Física", "11:10", "Seg", "7 ANO A"),
    ("ED. FISICA 1", "Ed. Física", "11:10", "Seg", "7 ANO B"),
    ("ED. FISICA 1", "Ed. Física", "11:10", "Qua", "6 ANO A"),
    ("ED. FISICA 1", "Ed. Física", "11:10", "Qua", "6 ANO B"),
    ("ED. FISICA 1", "Ed. Física", "11:10", "Sex", "8 ANO A"),
    ("ED. FISICA 1", "Ed. Física", "11:10", "Sex", "8 ANO B"),

    # ELAINE (Ciências Fund. I)
    ("ELAINE", "Ciências", "07:30", "Qua", "5 ANO B"),
    ("ELAINE", "Ciências", "07:30", "Qui", "4 ANO B"),
    ("ELAINE", "Ciências", "07:30", "Sex", "5 ANO A"),
    ("ELAINE", "Ciências", "08:20", "Qua", "4 ANO A"),
    ("ELAINE", "Ciências", "08:20", "Qui", "5 ANO B"),
    ("ELAINE", "Ciências", "08:20", "Sex", "4 ANO B"),
    ("ELAINE", "Ciências", "09:10", "Ter", "4 ANO B"),
    ("ELAINE", "Ciências", "09:10", "Qua", "5 ANO A"),
    ("ELAINE", "Ciências", "09:10", "Sex", "5 ANO A"),
    ("ELAINE", "Ciências", "10:30", "Ter", "4 ANO A"),
    ("ELAINE", "Ciências", "10:30", "Qua", "4 ANO B"),
    ("ELAINE", "Ciências", "10:30", "Sex", "4 ANO A"),
    ("ELAINE", "Ciências", "11:10", "Ter", "5 ANO B"),
    ("ELAINE", "Ciências", "11:10", "Qua", "5 ANO A"),
    ("ELAINE", "Ciências", "11:10", "Qui", "4 ANO A"),
    ("ELAINE", "Ciências", "11:10", "Sex", "5 ANO B"),

    # FERREIRA (Filosofia / Sociologia)
    ("FERREIRA", "Filosofia", "07:30", "Qui", "1 SERIE A"),
    ("FERREIRA", "Filosofia", "08:20", "Qui", "1 SERIE B"),
    ("FERREIRA", "Filosofia", "09:10", "Qui", "3 SERIE A"),
    ("FERREIRA", "Filosofia", "10:30", "Qui", "2 SERIE A"),
    ("FERREIRA", "Filosofia", "11:10", "Qui", "1 SERIE B"),
    ("FERREIRA", "Filosofia", "12:00", "Qui", "3 SERIE A"),
    ("FERREIRA", "Filosofia", "14:20", "Qui", "1 SERIE A"),
    ("FERREIRA", "Filosofia", "15:10", "Qui", "2 SERIE A"),

    # FILIPE (Geografia Ensino Médio)
    ("FILIPE", "Geografia", "07:30", "Ter", "3 SERIE A"),
    ("FILIPE", "Geografia", "08:20", "Ter", "1 SERIE B"),
    ("FILIPE", "Geografia", "09:10", "Ter", "2 SERIE A"),
    ("FILIPE", "Geografia", "10:30", "Ter", "2 SERIE A"),
    ("FILIPE", "Geografia", "11:10", "Ter", "1 SERIE A"),
    ("FILIPE", "Geografia", "12:00", "Ter", "3 SERIE A"),

    # GABRIELA (Espanhol / Literatura)
    ("GABRIELA", "Espanhol", "07:30", "Qui", "1 SERIE B"),
    ("GABRIELA", "Espanhol", "08:20", "Qui", "3 SERIE A"),
    ("GABRIELA", "Espanhol", "09:10", "Qui", "2 SERIE A"),
    ("GABRIELA", "Espanhol", "09:10", "Sex", "1 SERIE A"),
    ("GABRIELA", "Espanhol", "10:30", "Qui", "1 SERIE A"),
    ("GABRIELA", "Espanhol", "10:30", "Sex", "3 SERIE A"),
    ("GABRIELA", "Espanhol", "11:10", "Sex", "2 SERIE A"),
    ("GABRIELA", "Espanhol", "12:00", "Sex", "1 SERIE B"),

    # GUILHERME (História Ensino Médio)
    ("GUILHERME", "História", "07:30", "Ter", "2 SERIE A"),
    ("GUILHERME", "História", "08:20", "Ter", "1 SERIE A"),
    ("GUILHERME", "História", "09:10", "Ter", "1 SERIE B"),
    ("GUILHERME", "História", "10:30", "Ter", "1 SERIE A"),
    ("GUILHERME", "História", "11:10", "Ter", "3 SERIE A"),
    ("GUILHERME", "História", "12:00", "Ter", "2 SERIE A"),
    ("GUILHERME", "História", "14:20", "Ter", "1 SERIE B"),
    ("GUILHERME", "História", "15:10", "Ter", "3 SERIE A"),

    # HANS (Física Avançada)
    ("HANS", "Física Exata", "14:20", "Ter", "3 SERIE A"),
    ("HANS", "Física Exata", "14:20", "Qui", "2 SERIE A"),
    ("HANS", "Física Exata", "15:10", "Ter", "1 SERIE A"),
    ("HANS", "Física Exata", "15:10", "Qui", "1 SERIE B"),
    ("HANS", "Física Exata", "16:20", "Ter", "2 SERIE A"),
    ("HANS", "Física Exata", "16:20", "Qui", "3 SERIE A"),
    ("HANS", "Física Exata", "17:10", "Ter", "1 SERIE B"),
    ("HANS", "Física Exata", "17:10", "Qui", "1 SERIE A"),

    # IAMANDRO (Ciências / Biologia)
    ("IAMANDRO", "Ciências", "07:30", "Ter", "6 ANO B"),
    ("IAMANDRO", "Ciências", "07:30", "Qui", "7 ANO B"),
    ("IAMANDRO", "Ciências", "07:30", "Sex", "7 ANO A"),
    ("IAMANDRO", "Ciências", "08:20", "Ter", "8 ANO B"),
    ("IAMANDRO", "Ciências", "08:20", "Qui", "8 ANO B"),
    ("IAMANDRO", "Ciências", "08:20", "Sex", "6 ANO A"),
    ("IAMANDRO", "Ciências", "09:10", "Ter", "8 ANO A"),
    ("IAMANDRO", "Ciências", "09:10", "Qui", "9 ANO A"),
    ("IAMANDRO", "Ciências", "09:10", "Sex", "9 ANO B"),
    ("IAMANDRO", "Ciências", "10:30", "Ter", "7 ANO B"),
    ("IAMANDRO", "Ciências", "10:30", "Qua", "9 ANO A"),
    ("IAMANDRO", "Ciências", "10:30", "Qui", "6 ANO B"),
    ("IAMANDRO", "Ciências", "10:30", "Sex", "8 ANO A"),
    ("IAMANDRO", "Ciências", "11:10", "Ter", "9 ANO B"),
    ("IAMANDRO", "Ciências", "11:10", "Qua", "9 ANO B"),
    ("IAMANDRO", "Ciências", "11:10", "Sex", "9 ANO A"),
    ("IAMANDRO", "Ciências", "12:00", "Ter", "7 ANO A"),
    ("IAMANDRO", "Ciências", "12:00", "Qua", "6 ANO A"),

    # IGOR (Matemática Aplicada)
    ("IGOR", "Matemática", "07:30", "Sex", "3 SERIE A"),
    ("IGOR", "Matemática", "08:20", "Sex", "1 SERIE A"),
    ("IGOR", "Matemática", "10:30", "Sex", "2 SERIE A"),
    ("IGOR", "Matemática", "11:10", "Sex", "1 SERIE B"),

    # J.B (Matemática Fund. II)
    ("J.B", "Matemática", "07:30", "Ter", "7 ANO A"),
    ("J.B", "Matemática", "07:30", "Qua", "6 ANO B"),
    ("J.B", "Matemática", "07:30", "Qui", "6 ANO B"),
    ("J.B", "Matemática", "08:20", "Ter", "7 ANO B"),
    ("J.B", "Matemática", "08:20", "Qua", "7 ANO B"),
    ("J.B", "Matemática", "08:20", "Qui", "7 ANO A"),
    ("J.B", "Matemática", "09:10", "Ter", "8 ANO B"),
    ("J.B", "Matemática", "09:10", "Qua", "8 ANO A"),
    ("J.B", "Matemática", "09:10", "Qui", "6 ANO A"),
    ("J.B", "Matemática", "10:30", "Ter", "8 ANO A"),
    ("J.B", "Matemática", "10:30", "Qua", "6 ANO A"),
    ("J.B", "Matemática", "10:30", "Qui", "8 ANO A"),
    ("J.B", "Matemática", "11:10", "Ter", "6 ANO A"),
    ("J.B", "Matemática", "11:10", "Qua", "7 ANO A"),
    ("J.B", "Matemática", "11:10", "Qui", "8 ANO B"),
    ("J.B", "Matemática", "12:00", "Ter", "6 ANO B"),
    ("J.B", "Matemática", "12:00", "Qua", "8 ANO B"),
    ("J.B", "Matemática", "12:00", "Qui", "7 ANO B"),

    # JANETE (Pedagogia 2º Ano A)
    ("JANETE", "Pedagogia", "07:30", "Seg", "2 ANO A"),
    ("JANETE", "Pedagogia", "07:30", "Qui", "2 ANO A"),
    ("JANETE", "Pedagogia", "08:20", "Ter", "2 ANO A"),
    ("JANETE", "Pedagogia", "08:20", "Qua", "2 ANO A"),
    ("JANETE", "Pedagogia", "08:20", "Qui", "2 ANO A"),
    ("JANETE", "Pedagogia", "09:10", "Seg", "2 ANO A"),
    ("JANETE", "Pedagogia", "09:10", "Ter", "2 ANO A"),
    ("JANETE", "Pedagogia", "09:10", "Qua", "2 ANO A"),
    ("JANETE", "Pedagogia", "09:10", "Qui", "2 ANO A"),
    ("JANETE", "Pedagogia", "10:30", "Seg", "2 ANO A"),
    ("JANETE", "Pedagogia", "10:30", "Ter", "2 ANO A"),
    ("JANETE", "Pedagogia", "10:30", "Qua", "2 ANO A"),
    ("JANETE", "Pedagogia", "10:30", "Sex", "2 ANO A"),
    ("JANETE", "Pedagogia", "11:10", "Seg", "2 ANO A"),
    ("JANETE", "Pedagogia", "11:10", "Ter", "2 ANO A"),
    ("JANETE", "Pedagogia", "11:10", "Qua", "2 ANO A"),
    ("JANETE", "Pedagogia", "11:10", "Qui", "2 ANO A"),
    ("JANETE", "Pedagogia", "11:10", "Sex", "2 ANO A"),

    # JESSICA (Gramática / Redação)
    ("JESSICA", "Redação", "07:30", "Qua", "2 SERIE A"),
    ("JESSICA", "Redação", "07:30", "Sex", "1 SERIE A"),
    ("JESSICA", "Redação", "08:20", "Sex", "1 SERIE B"),
    ("JESSICA", "Redação", "09:10", "Seg", "3 SERIE A"),
    ("JESSICA", "Redação", "09:10", "Sex", "2 SERIE A"),
    ("JESSICA", "Redação", "10:30", "Seg", "3 SERIE A"),
    ("JESSICA", "Redação", "10:30", "Sex", "1 SERIE B"),
    ("JESSICA", "Redação", "11:10", "Seg", "1 SERIE A"),

    # KARINE (Pedagogia 1º Ano A)
    ("KARINE", "Pedagogia", "07:30", "Ter", "1 ANO A"),
    ("KARINE", "Pedagogia", "07:30", "Qua", "1 ANO A"),
    ("KARINE", "Pedagogia", "07:30", "Sex", "1 ANO A"),
    ("KARINE", "Pedagogia", "08:20", "Seg", "1 ANO A"),
    ("KARINE", "Pedagogia", "08:20", "Ter", "1 ANO A"),
    ("KARINE", "Pedagogia", "08:20", "Sex", "1 ANO A"),
    ("KARINE", "Pedagogia", "09:10", "Seg", "1 ANO A"),
    ("KARINE", "Pedagogia", "09:10", "Qua", "1 ANO A"),
    ("KARINE", "Pedagogia", "09:10", "Sex", "1 ANO A"),
    ("KARINE", "Pedagogia", "10:30", "Seg", "1 ANO A"),
    ("KARINE", "Pedagogia", "10:30", "Ter", "1 ANO A"),
    ("KARINE", "Pedagogia", "10:30", "Qua", "1 ANO A"),
    ("KARINE", "Pedagogia", "10:30", "Qui", "1 ANO A"),
    ("KARINE", "Pedagogia", "11:10", "Seg", "1 ANO A"),
    ("KARINE", "Pedagogia", "11:10", "Ter", "1 ANO A"),
    ("KARINE", "Pedagogia", "11:10", "Qua", "1 ANO A"),
    ("KARINE", "Pedagogia", "11:10", "Qui", "1 ANO A"),
    ("KARINE", "Pedagogia", "11:10", "Sex", "1 ANO A"),

    # KELE (Pedagogia 2º Ano B)
    ("KELE", "Pedagogia", "07:30", "Seg", "2 ANO B"),
    ("KELE", "Pedagogia", "07:30", "Ter", "2 ANO B"),
    ("KELE", "Pedagogia", "07:30", "Qua", "2 ANO B"),
    ("KELE", "Pedagogia", "08:20", "Seg", "2 ANO B"),
    ("KELE", "Pedagogia", "08:20", "Qua", "2 ANO B"),
    ("KELE", "Pedagogia", "08:20", "Qui", "2 ANO B"),
    ("KELE", "Pedagogia", "09:10", "Ter", "2 ANO B"),
    ("KELE", "Pedagogia", "09:10", "Qui", "2 ANO B"),
    ("KELE", "Pedagogia", "09:10", "Sex", "2 ANO B"),
    ("KELE", "Pedagogia", "10:30", "Seg", "2 ANO B"),
    ("KELE", "Pedagogia", "10:30", "Ter", "2 ANO B"),
    ("KELE", "Pedagogia", "10:30", "Qua", "2 ANO B"),
    ("KELE", "Pedagogia", "10:30", "Sex", "2 ANO B"),
    ("KELE", "Pedagogia", "11:10", "Seg", "2 ANO B"),
    ("KELE", "Pedagogia", "11:10", "Ter", "2 ANO B"),
    ("KELE", "Pedagogia", "11:10", "Qua", "2 ANO B"),
    ("KELE", "Pedagogia", "11:10", "Qui", "2 ANO B"),
    ("KELE", "Pedagogia", "11:10", "Sex", "2 ANO B"),

    # LANDER (Matemática Avançada)
    ("LANDER", "Matemática", "07:30", "Ter", "1 SERIE A"),
    ("LANDER", "Matemática", "07:30", "Sex", "1 SERIE B"),
    ("LANDER", "Matemática", "08:20", "Ter", "2 SERIE A"),
    ("LANDER", "Matemática", "08:20", "Sex", "2 SERIE A"),
    ("LANDER", "Matemática", "09:10", "Ter", "3 SERIE A"),
    ("LANDER", "Matemática", "09:10", "Sex", "3 SERIE A"),
    ("LANDER", "Matemática", "10:30", "Ter", "1 SERIE B"),
    ("LANDER", "Matemática", "10:30", "Sex", "1 SERIE A"),

    # LARISSA (Inglês Fund. II e EM)
    ("LARISSA", "Inglês", "07:30", "Seg", "8 ANO A"),
    ("LARISSA", "Inglês", "07:30", "Ter", "9 ANO A"),
    ("LARISSA", "Inglês", "07:30", "Qua", "8 ANO B"),
    ("LARISSA", "Inglês", "07:30", "Qui", "9 ANO B"),
    ("LARISSA", "Inglês", "07:30", "Sex", "7 ANO B"),
    ("LARISSA", "Inglês", "08:20", "Seg", "8 ANO B"),
    ("LARISSA", "Inglês", "08:20", "Ter", "8 ANO A"),
    ("LARISSA", "Inglês", "08:20", "Qua", "9 ANO A"),
    ("LARISSA", "Inglês", "08:20", "Qui", "7 ANO B"),
    ("LARISSA", "Inglês", "08:20", "Sex", "8 ANO A"),
    ("LARISSA", "Inglês", "09:10", "Seg", "7 ANO B"),
    ("LARISSA", "Inglês", "09:10", "Ter", "9 ANO B"),
    ("LARISSA", "Inglês", "09:10", "Qua", "7 ANO B"),
    ("LARISSA", "Inglês", "09:10", "Qui", "8 ANO B"),
    ("LARISSA", "Inglês", "09:10", "Sex", "8 ANO B"),
    ("LARISSA", "Inglês", "10:30", "Seg", "7 ANO A"),
    ("LARISSA", "Inglês", "10:30", "Ter", "8 ANO B"),
    ("LARISSA", "Inglês", "10:30", "Qua", "9 ANO B"),
    ("LARISSA", "Inglês", "10:30", "Qui", "7 ANO A"),
    ("LARISSA", "Inglês", "10:30", "Sex", "7 ANO A"),
    ("LARISSA", "Inglês", "11:10", "Seg", "9 ANO A"),
    ("LARISSA", "Inglês", "11:10", "Ter", "7 ANO A"),
    ("LARISSA", "Inglês", "11:10", "Qua", "8 ANO A"),
    ("LARISSA", "Inglês", "11:10", "Qui", "9 ANO A"),
    ("LARISSA", "Inglês", "11:10", "Sex", "9 ANO B"),
    ("LARISSA", "Inglês", "12:00", "Seg", "9 ANO B"),
    ("LARISSA", "Inglês", "12:00", "Ter", "7 ANO B"),
    ("LARISSA", "Inglês", "12:00", "Qua", "7 ANO A"),
    ("LARISSA", "Inglês", "12:00", "Qui", "8 ANO A"),
    ("LARISSA", "Inglês", "12:00", "Sex", "9 ANO A"),
    ("LARISSA", "Inglês", "16:20", "Ter", "1 SERIE A"),
    ("LARISSA", "Inglês", "16:20", "Qui", "2 SERIE A"),
    ("LARISSA", "Inglês", "17:10", "Ter", "3 SERIE A"),
    ("LARISSA", "Inglês", "17:10", "Qui", "1 SERIE B"),

    # LAURA (Literatura)
    ("LAURA", "Literatura", "07:30", "Seg", "3 SERIE A"),
    ("LAURA", "Literatura", "07:30", "Qua", "1 SERIE B"),
    ("LAURA", "Literatura", "08:20", "Seg", "1 SERIE B"),
    ("LAURA", "Literatura", "08:20", "Qua", "2 SERIE A"),
    ("LAURA", "Literatura", "09:10", "Seg", "2 SERIE A"),
    ("LAURA", "Literatura", "09:10", "Qua", "9 ANO A"),
    ("LAURA", "Literatura", "10:30", "Seg", "9 ANO A"),
    ("LAURA", "Literatura", "10:30", "Qua", "1 SERIE A"),
    ("LAURA", "Literatura", "11:10", "Seg", "9 ANO B"),
    ("LAURA", "Literatura", "11:10", "Qua", "3 SERIE A"),
    ("LAURA", "Literatura", "12:00", "Seg", "1 SERIE A"),
    ("LAURA", "Literatura", "12:00", "Qua", "9 ANO B"),

    # LENE (Pedagogia 3º Ano A)
    ("LENE", "Pedagogia", "07:30", "Seg", "3 ANO A"),
    ("LENE", "Pedagogia", "07:30", "Ter", "3 ANO A"),
    ("LENE", "Pedagogia", "07:30", "Sex", "3 ANO A"),
    ("LENE", "Pedagogia", "08:20", "Seg", "3 ANO A"),
    ("LENE", "Pedagogia", "08:20", "Ter", "3 ANO A"),
    ("LENE", "Pedagogia", "08:20", "Qua", "3 ANO A"),
    ("LENE", "Pedagogia", "08:20", "Sex", "3 ANO A"),
    ("LENE", "Pedagogia", "09:10", "Seg", "3 ANO A"),
    ("LENE", "Pedagogia", "09:10", "Qua", "3 ANO A"),
    ("LENE", "Pedagogia", "09:10", "Qui", "3 ANO A"),
    ("LENE", "Pedagogia", "10:30", "Ter", "3 ANO A"),
    ("LENE", "Pedagogia", "10:30", "Qua", "3 ANO A"),
    ("LENE", "Pedagogia", "10:30", "Qui", "3 ANO A"),
    ("LENE", "Pedagogia", "10:30", "Sex", "3 ANO A"),
    ("LENE", "Pedagogia", "11:10", "Seg", "3 ANO A"),
    ("LENE", "Pedagogia", "11:10", "Ter", "3 ANO A"),
    ("LENE", "Pedagogia", "11:10", "Qui", "3 ANO A"),
    ("LENE", "Pedagogia", "11:10", "Sex", "3 ANO A"),

    # LUDIMILA (Geografia / História)
    ("LUDIMILA", "Geografia", "07:30", "Seg", "6 ANO B"),
    ("LUDIMILA", "Geografia", "07:30", "Ter", "5 ANO B"),
    ("LUDIMILA", "Geografia", "07:30", "Qua", "5 ANO A"),
    ("LUDIMILA", "Geografia", "07:30", "Qui", "6 ANO A"),
    ("LUDIMILA", "Geografia", "07:30", "Sex", "6 ANO A"),
    ("LUDIMILA", "Geografia", "08:20", "Seg", "6 ANO A"),
    ("LUDIMILA", "Geografia", "08:20", "Ter", "6 ANO A"),
    ("LUDIMILA", "Geografia", "08:20", "Qua", "6 ANO A"),
    ("LUDIMILA", "Geografia", "08:20", "Qui", "6 ANO B"),
    ("LUDIMILA", "Geografia", "08:20", "Sex", "5 ANO B"),
    ("LUDIMILA", "Geografia", "09:10", "Seg", "5 ANO A"),
    ("LUDIMILA", "Geografia", "09:10", "Ter", "6 ANO B"),
    ("LUDIMILA", "Geografia", "09:10", "Qua", "5 ANO B"),
    ("LUDIMILA", "Geografia", "09:10", "Qui", "5 ANO A"),
    ("LUDIMILA", "Geografia", "09:10", "Sex", "6 ANO B"),
    ("LUDIMILA", "Geografia", "10:30", "Seg", "5 ANO B"),
    ("LUDIMILA", "Geografia", "10:30", "Ter", "5 ANO A"),
    ("LUDIMILA", "Geografia", "10:30", "Qua", "6 ANO B"),
    ("LUDIMILA", "Geografia", "10:30", "Qui", "5 ANO B"),
    ("LUDIMILA", "Geografia", "10:30", "Sex", "5 ANO A"),

    # LUIZ ARTE (Artes Ensino Médio)
    ("LUIZ ARTE", "Artes", "07:30", "Seg", "2 SERIE A"),
    ("LUIZ ARTE", "Artes", "08:20", "Seg", "3 SERIE A"),
    ("LUIZ ARTE", "Artes", "09:10", "Seg", "1 SERIE A"),
    ("LUIZ ARTE", "Artes", "10:30", "Seg", "1 SERIE B"),

    # M.ISABEL (Português / Redação)
    ("M.ISABEL", "Português", "07:30", "Seg", "1 SERIE B"),
    ("M.ISABEL", "Português", "07:30", "Ter", "8 ANO A"),
    ("M.ISABEL", "Português", "07:30", "Qua", "9 ANO A"),
    ("M.ISABEL", "Português", "07:30", "Qui", "8 ANO B"),
    ("M.ISABEL", "Português", "07:30", "Sex", "9 ANO B"),
    ("M.ISABEL", "Português", "08:20", "Seg", "9 ANO B"),
    ("M.ISABEL", "Português", "08:20", "Ter", "9 ANO B"),
    ("M.ISABEL", "Português", "08:20", "Qua", "1 SERIE A"),
    ("M.ISABEL", "Português", "08:20", "Qui", "9 ANO A"),
    ("M.ISABEL", "Português", "08:20", "Sex", "8 ANO B"),
    ("M.ISABEL", "Português", "09:10", "Seg", "9 ANO A"),
    ("M.ISABEL", "Português", "09:10", "Ter", "9 ANO A"),
    ("M.ISABEL", "Português", "09:10", "Qua", "3 SERIE A"),
    ("M.ISABEL", "Português", "09:10", "Qui", "8 ANO A"),
    ("M.ISABEL", "Português", "09:10", "Sex", "8 ANO A"),
    ("M.ISABEL", "Português", "10:30", "Seg", "8 ANO B"),
    ("M.ISABEL", "Português", "10:30", "Ter", "9 ANO B"),
    ("M.ISABEL", "Português", "10:30", "Qua", "1 SERIE B"),
    ("M.ISABEL", "Português", "10:30", "Qui", "9 ANO A"),
    ("M.ISABEL", "Português", "10:30", "Sex", "8 ANO B"),
    ("M.ISABEL", "Português", "11:10", "Seg", "2 SERIE A"),
    ("M.ISABEL", "Português", "11:10", "Ter", "8 ANO B"),
    ("M.ISABEL", "Português", "11:10", "Qua", "2 SERIE A"),
    ("M.ISABEL", "Português", "11:10", "Qui", "8 ANO A"),
    ("M.ISABEL", "Português", "11:10", "Sex", "3 SERIE A"),
    ("M.ISABEL", "Português", "12:00", "Ter", "1 SERIE A"),
    ("M.ISABEL", "Português", "12:00", "Qua", "8 ANO A"),
    ("M.ISABEL", "Português", "12:00", "Qui", "9 ANO B"),

    # MARCONDES (Educação Física / Esportes)
    ("MARCONDES", "Ed. Física", "11:10", "Qui", "3 SERIE A"),
    ("MARCONDES", "Ed. Física", "12:00", "Qui", "1 SERIE A"),
    ("MARCONDES", "Ed. Física", "14:20", "Ter", "2 SERIE A"),
    ("MARCONDES", "Ed. Física", "15:10", "Ter", "1 SERIE B"),

    # MILENE (Pedagogia 1º/2º Anos)
    ("MILENE", "Pedagogia", "07:30", "Seg", "1 ANO A"),
    ("MILENE", "Pedagogia", "07:30", "Ter", "2 ANO A"),
    ("MILENE", "Pedagogia", "07:30", "Qua", "2 ANO A"),
    ("MILENE", "Pedagogia", "07:30", "Qui", "2 ANO B"),
    ("MILENE", "Pedagogia", "07:30", "Sex", "1 ANO B"),
    ("MILENE", "Pedagogia", "08:20", "Seg", "2 ANO A"),
    ("MILENE", "Pedagogia", "08:20", "Ter", "2 ANO B"),
    ("MILENE", "Pedagogia", "08:20", "Qua", "1 ANO A"),
    ("MILENE", "Pedagogia", "08:20", "Qui", "1 ANO A"),
    ("MILENE", "Pedagogia", "08:20", "Sex", "2 ANO B"),
    ("MILENE", "Pedagogia", "09:10", "Seg", "2 ANO B"),
    ("MILENE", "Pedagogia", "09:10", "Ter", "1 ANO A"),
    ("MILENE", "Pedagogia", "09:10", "Qua", "2 ANO B"),
    ("MILENE", "Pedagogia", "09:10", "Qui", "1 ANO B"),
    ("MILENE", "Pedagogia", "09:10", "Sex", "2 ANO A"),
    ("MILENE", "Pedagogia", "10:30", "Seg", "1 ANO B"),
    ("MILENE", "Pedagogia", "10:30", "Ter", "1 ANO B"),
    ("MILENE", "Pedagogia", "10:30", "Qua", "1 ANO B"),
    ("MILENE", "Pedagogia", "10:30", "Qui", "2 ANO A"),
    ("MILENE", "Pedagogia", "10:30", "Sex", "1 ANO A"),

    # MOISES (Química / Ciências)
    ("MOISES", "Química", "07:30", "Seg", "9 ANO A"),
    ("MOISES", "Química", "07:30", "Ter", "8 ANO B"),
    ("MOISES", "Química", "07:30", "Qua", "9 ANO B"),
    ("MOISES", "Química", "07:30", "Qui", "7 ANO A"),
    ("MOISES", "Química", "08:20", "Seg", "1 SERIE A"),
    ("MOISES", "Química", "08:20", "Ter", "7 ANO A"),
    ("MOISES", "Química", "08:20", "Qua", "3 SERIE A"),
    ("MOISES", "Química", "08:20", "Qui", "8 ANO A"),
    ("MOISES", "Química", "09:10", "Seg", "9 ANO B"),
    ("MOISES", "Química", "09:10", "Ter", "7 ANO B"),
    ("MOISES", "Química", "09:10", "Qua", "1 SERIE B"),
    ("MOISES", "Química", "09:10", "Qui", "7 ANO B"),
    ("MOISES", "Química", "10:30", "Seg", "2 SERIE A"),
    ("MOISES", "Química", "10:30", "Ter", "9 ANO A"),
    ("MOISES", "Química", "10:30", "Qua", "2 SERIE A"),
    ("MOISES", "Química", "10:30", "Qui", "8 ANO B"),
    ("MOISES", "Química", "11:10", "Seg", "1 SERIE B"),
    ("MOISES", "Química", "11:10", "Ter", "8 ANO A"),
    ("MOISES", "Química", "11:10", "Qua", "1 SERIE A"),
    ("MOISES", "Química", "11:10", "Qui", "9 ANO B"),
    ("MOISES", "Química", "12:00", "Seg", "3 SERIE A"),
    ("MOISES", "Química", "12:00", "Qui", "9 ANO A"),

    # NORTHON (Filosofia / Sociologia)
    ("NORTHON", "Filosofia", "07:30", "Qui", "3 SERIE A"),
    ("NORTHON", "Filosofia", "08:20", "Qui", "2 SERIE A"),
    ("NORTHON", "Filosofia", "09:10", "Qui", "1 SERIE A"),
    ("NORTHON", "Filosofia", "10:30", "Qui", "1 SERIE B"),
    ("NORTHON", "Filosofia", "11:10", "Qui", "2 SERIE A"),
    ("NORTHON", "Filosofia", "12:00", "Qui", "1 SERIE B"),
    ("NORTHON", "Filosofia", "14:20", "Qui", "3 SERIE A"),
    ("NORTHON", "Filosofia", "15:10", "Qui", "1 SERIE A"),

    # ROBERTA (Matemática Fund. I e II)
    ("ROBERTA", "Matemática", "07:30", "Seg", "4 ANO B"),
    ("ROBERTA", "Matemática", "07:30", "Ter", "5 ANO A"),
    ("ROBERTA", "Matemática", "07:30", "Qua", "4 ANO A"),
    ("ROBERTA", "Matemática", "07:30", "Qui", "5 ANO B"),
    ("ROBERTA", "Matemática", "07:30", "Sex", "9 ANO A"),
    ("ROBERTA", "Matemática", "08:20", "Seg", "4 ANO A"),
    ("ROBERTA", "Matemática", "08:20", "Ter", "4 ANO B"),
    ("ROBERTA", "Matemática", "08:20", "Qua", "5 ANO A"),
    ("ROBERTA", "Matemática", "08:20", "Qui", "5 ANO A"),
    ("ROBERTA", "Matemática", "08:20", "Sex", "9 ANO B"),
    ("ROBERTA", "Matemática", "09:10", "Seg", "5 ANO B"),
    ("ROBERTA", "Matemática", "09:10", "Ter", "5 ANO B"),
    ("ROBERTA", "Matemática", "09:10", "Qua", "9 ANO B"),
    ("ROBERTA", "Matemática", "09:10", "Qui", "4 ANO B"),
    ("ROBERTA", "Matemática", "09:10", "Sex", "4 ANO B"),
    ("ROBERTA", "Matemática", "10:30", "Seg", "4 ANO A"),
    ("ROBERTA", "Matemática", "10:30", "Ter", "5 ANO B"),
    ("ROBERTA", "Matemática", "10:30", "Qua", "4 ANO A"),
    ("ROBERTA", "Matemática", "10:30", "Qui", "5 ANO A"),
    ("ROBERTA", "Matemática", "10:30", "Sex", "6 ANO B"),
    ("ROBERTA", "Matemática", "11:10", "Seg", "4 ANO B"),
    ("ROBERTA", "Matemática", "11:10", "Ter", "5 ANO A"),
    ("ROBERTA", "Matemática", "11:10", "Qua", "5 ANO B"),
    ("ROBERTA", "Matemática", "11:10", "Qui", "6 ANO A"),
    ("ROBERTA", "Matemática", "11:10", "Sex", "4 ANO A"),
    ("ROBERTA", "Matemática", "12:00", "Ter", "6 ANO A"),
    ("ROBERTA", "Matemática", "12:00", "Qua", "9 ANO A"),
    ("ROBERTA", "Matemática", "12:00", "Qui", "6 ANO B"),
    ("ROBERTA", "Matemática", "16:20", "Ter", "3 SERIE A"),
    ("ROBERTA", "Matemática", "16:20", "Qui", "1 SERIE B"),
    ("ROBERTA", "Matemática", "17:10", "Ter", "1 SERIE A"),
    ("ROBERTA", "Matemática", "17:10", "Qui", "2 SERIE A"),

    # SAMARA (Redação / Literatura)
    ("SAMARA", "Redação", "07:30", "Seg", "8 ANO B"),
    ("SAMARA", "Redação", "07:30", "Qua", "7 ANO B"),
    ("SAMARA", "Redação", "07:30", "Qui", "8 ANO A"),
    ("SAMARA", "Redação", "08:20", "Seg", "8 ANO A"),
    ("SAMARA", "Redação", "08:20", "Qua", "6 ANO B"),
    ("SAMARA", "Redação", "08:20", "Qui", "6 ANO A"),
    ("SAMARA", "Redação", "09:10", "Seg", "6 ANO B"),
    ("SAMARA", "Redação", "09:10", "Qua", "7 ANO A"),
    ("SAMARA", "Redação", "09:10", "Qui", "7 ANO A"),
    ("SAMARA", "Redação", "10:30", "Seg", "6 ANO A"),
    ("SAMARA", "Redação", "10:30", "Qua", "8 ANO B"),
    ("SAMARA", "Redação", "10:30", "Qui", "7 ANO B"),

    # SANDRA (Pedagogia 3º Ano B)
    ("SANDRA", "Pedagogia", "07:30", "Seg", "3 ANO B"),
    ("SANDRA", "Pedagogia", "07:30", "Ter", "3 ANO B"),
    ("SANDRA", "Pedagogia", "07:30", "Qui", "3 ANO B"),
    ("SANDRA", "Pedagogia", "07:30", "Sex", "3 ANO B"),
    ("SANDRA", "Pedagogia", "08:20", "Seg", "3 ANO B"),
    ("SANDRA", "Pedagogia", "08:20", "Ter", "3 ANO B"),
    ("SANDRA", "Pedagogia", "08:20", "Qua", "3 ANO B"),
    ("SANDRA", "Pedagogia", "08:20", "Qui", "3 ANO B"),
    ("SANDRA", "Pedagogia", "08:20", "Sex", "3 ANO B"),
    ("SANDRA", "Pedagogia", "09:10", "Ter", "3 ANO B"),
    ("SANDRA", "Pedagogia", "09:10", "Qua", "3 ANO B"),
    ("SANDRA", "Pedagogia", "09:10", "Qui", "3 ANO B"),
    ("SANDRA", "Pedagogia", "09:10", "Sex", "3 ANO B"),
    ("SANDRA", "Pedagogia", "10:30", "Seg", "3 ANO B"),
    ("SANDRA", "Pedagogia", "11:10", "Seg", "3 ANO B"),
    ("SANDRA", "Pedagogia", "11:10", "Ter", "3 ANO B"),
    ("SANDRA", "Pedagogia", "11:10", "Qua", "3 ANO B"),
    ("SANDRA", "Pedagogia", "11:10", "Qui", "3 ANO B"),

    # THYAGO (Física / Ciências)
    ("THYAGO", "Física", "07:30", "Seg", "9 ANO B"),
    ("THYAGO", "Física", "07:30", "Qua", "7 ANO A"),
    ("THYAGO", "Física", "07:30", "Sex", "8 ANO B"),
    ("THYAGO", "Física", "08:20", "Seg", "7 ANO B"),
    ("THYAGO", "Física", "08:20", "Qua", "9 ANO B"),
    ("THYAGO", "Física", "08:20", "Sex", "7 ANO B"),
    ("THYAGO", "Física", "09:10", "Seg", "7 ANO A"),
    ("THYAGO", "Física", "09:10", "Qua", "8 ANO B"),
    ("THYAGO", "Física", "09:10", "Sex", "6 ANO A"),
    ("THYAGO", "Física", "10:30", "Seg", "8 ANO A"),
    ("THYAGO", "Física", "10:30", "Qua", "8 ANO A"),
    ("THYAGO", "Física", "10:30", "Sex", "9 ANO A"),
    ("THYAGO", "Física", "11:10", "Seg", "6 ANO A"),
    ("THYAGO", "Física", "11:10", "Qua", "9 ANO A"),
    ("THYAGO", "Física", "11:10", "Sex", "6 ANO B"),
    ("THYAGO", "Física", "12:00", "Seg", "9 ANO A"),
    ("THYAGO", "Física", "12:00", "Qua", "6 ANO B"),
    ("THYAGO", "Física", "12:00", "Sex", "9 ANO B"),

    # WEIGUI (Química Ensino Médio)
    ("WEIGUI", "Química", "07:30", "Sex", "2 SERIE A"),
    ("WEIGUI", "Química", "08:20", "Sex", "3 SERIE A"),
    ("WEIGUI", "Química", "09:10", "Sex", "1 SERIE B"),
    ("WEIGUI", "Química", "11:10", "Sex", "1 SERIE A"),
]

def sync_databases():
    appdata = os.environ.get('APPDATA')
    db_paths = [
        os.path.join(appdata, 'AquilaPro', 'aquila.db'),
        'C:/aquila/packages/db/aquila.db'
    ]

    for db_path in db_paths:
        if not os.path.exists(os.path.dirname(db_path)):
            os.makedirs(os.path.dirname(db_path), exist_ok=True)

        print(f"\n--- Processando banco: {db_path} ---")
        conn = sqlite3.connect(db_path)
        c = conn.cursor()

        # 1. Limpa tabelas antigas para evitar resíduos fakes
        c.execute("DELETE FROM schedules")
        c.execute("DELETE FROM classes")
        
        # 2. Insere as 22 turmas oficiais do semestre
        school_id = "school_aquila_demo"
        inst_id = "inst_aquila_demo"
        
        print("Inserindo 22 turmas oficiais...")
        for cls in CLASSES:
            # Check schema of classes table
            table_info = [col[1] for col in c.execute("PRAGMA table_info(classes)").fetchall()]
            if "schoolId" in table_info:
                c.execute(
                    "INSERT INTO classes (id, schoolId, name, grade) VALUES (?, ?, ?, ?)",
                    (cls["id"], school_id, cls["name"], cls["grade"])
                )
            else:
                c.execute(
                    "INSERT INTO classes (id, name, grade, shift, year, institution_id, max_students) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (cls["id"], cls["name"], 1, "morning", 2026, inst_id, 35)
                )

        # 3. Insere Professores na tabela users/staff se não existirem
        teachers_set = set(item[0] for item in SCHEDULE_RAW)
        print(f"Processando {len(teachers_set)} professores únicos...")

        for teacher_name in teachers_set:
            teacher_id = "usr_" + teacher_name.lower().replace(" ", "_").replace(".", "")
            username = teacher_name.lower().replace(" ", ".").replace("..", ".")
            email = f"{username}@aguiadourada.edu.br"
            
            users_cols = [col[1] for col in c.execute("PRAGMA table_info(users)").fetchall()]
            if "password_hash" in users_cols:
                c.execute("""
                    INSERT OR IGNORE INTO users (id, username, name, email, password_hash, role)
                    VALUES (?, ?, ?, ?, ?, 'teacher')
                """, (teacher_id, username, teacher_name, email, "$2b$12$placeholder"))
            elif "password_hash" not in users_cols and "password_hash" in users_cols:
                pass
            else:
                c.execute("""
                    INSERT OR IGNORE INTO users (id, name, email, password_hash, role, institution_id, active, created_at)
                    VALUES (?, ?, ?, ?, 'teacher', ?, 1, CURRENT_TIMESTAMP)
                """, (teacher_id, teacher_name, email, "$2b$12$placeholder", inst_id))

        # 4. Insere todos os Horários de Aula (Schedules)
        print(f"Inserindo {len(SCHEDULE_RAW)} horários de aula...")
        for teacher_name, subject, time_slot, day_str, class_name in SCHEDULE_RAW:
            if class_name not in CLASS_NAME_TO_ID:
                continue
            
            class_id = CLASS_NAME_TO_ID[class_name]
            teacher_id = "usr_" + teacher_name.lower().replace(" ", "_").replace(".", "")
            day_of_week = DAYS[day_str]
            start_time, end_time = SLOTS[time_slot]
            sched_id = f"sched_{uuid.uuid4().hex[:12]}"
            room_id = f"Sala {class_name.split()[0]}"

            schedules_cols = [col[1] for col in c.execute("PRAGMA table_info(schedules)").fetchall()]
            if "roomId" in schedules_cols:
                c.execute("""
                    INSERT INTO schedules (id, classId, roomId, teacherId, subject, teacher, dayOfWeek, startTime, endTime)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (sched_id, class_id, room_id, teacher_id, subject, teacher_name, day_of_week, start_time, end_time))

        # 5. Organiza os Alunos existentes e Mapeamento Aleatório (Row, Col)
        students_info = c.execute("SELECT id FROM students").fetchall()
        print(f"Reorganizando {len(students_info)} alunos com mapeamento de assentos aleatórios...")
        
        class_ids = [cls["id"] for cls in CLASSES]
        
        # Mapeador de assentos ocupados por turma: class_id -> set of (row, col)
        class_seats = {c_id: set() for c_id in class_ids}

        for idx, (student_id,) in enumerate(students_info):
            assigned_class = class_ids[idx % len(class_ids)]
            
            # Gera posição de assento (row 1..6, col 1..8) sem sobreposição
            while True:
                r = random.randint(1, 6)
                col = random.randint(1, 8)
                if (r, col) not in class_seats[assigned_class]:
                    class_seats[assigned_class].add((r, col))
                    break

            # Update student record
            stud_cols = [col[1] for col in c.execute("PRAGMA table_info(students)").fetchall()]
            if "row" in stud_cols and "col" in stud_cols:
                c.execute("UPDATE students SET classId = ?, row = ?, col = ? WHERE id = ?", (assigned_class, r, col, student_id))
            else:
                c.execute("UPDATE students SET class_id = ? WHERE id = ?", (assigned_class, student_id))

        conn.commit()
        conn.close()
        print(f"Concluido com sucesso para {db_path}!")

if __name__ == "__main__":
    sync_databases()
