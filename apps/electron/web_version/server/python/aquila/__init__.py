"""
Áquila Pro - Sistema de Segurança e Engajamento Escolar

Pacote Python para reconhecimento facial, rastreamento de presença e análise comportamental.
"""

__version__ = "1.0.0"
__author__ = "Áquila Pro Team"
__license__ = "Proprietary"

from .facial_recognition import FacialRecognitionSystem
from .presence_tracking import PresenceTracker
from .tracking_engine import AquilaTrackingEngine

__all__ = [
    'FacialRecognitionSystem',
    'PresenceTracker',
    'AquilaTrackingEngine',
]
