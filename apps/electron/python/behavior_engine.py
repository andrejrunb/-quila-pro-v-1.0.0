# behavior_engine.py — Áquila Pro Behavioral Intelligence Engine
import time
import numpy as np
from typing import Dict, Optional, List

class BehaviorEngine:
    """
    Engine para análise comportamental (Item 76-85).
    Monitora trajetórias e anomalias espaciais sem necessidade de novos modelos caros,
    extraindo valor dos metadados de face já detectados.
    """
    def __init__(self, camera_id: str):
        self.camera_id = camera_id
        # { student_id: [ (x,y,h,ts), ... ] }
        self.history: Dict[str, List[tuple]] = {}
        self.first_seen: Dict[str, float] = {} # Item 79: Loitering
        self.MAX_HISTORY = 10
        self.FALL_THRESHOLD = 1.2 # Reduzido de 1.5 para maior sensibilidade
        self.SPEED_THRESHOLD = 50 # pixels por frame (normalizado)

    def analyze(self, subject_id: str, box: List[int]) -> str:
        """
        Recebe o box da face ou corpo [top, right, bottom, left].
        Retorna: 'normal', 'falling', 'running', 'loitering'
        """
        now = time.time()
        # Coordenadas do centroide
        curr_y = (box[0] + box[2]) // 2
        curr_x = (box[1] + box[3]) // 2
        curr_h = box[2] - box[0]
        curr_w = box[1] - box[3] # right - left (pode ser negativo se invertido, usaremos abs)
        curr_aspect = abs(curr_w) / max(1, curr_h)

        if subject_id not in self.history:
            self.history[subject_id] = []
        
        hist = self.history[subject_id]
        behavior = 'normal'

        if hist:
            last_y, last_x, last_h, last_ts = hist[-1]
            
            # 1. Detecção de Queda (Heurística Avançada v1605)
            # Critério A: Deslocamento vertical súbito (Velocidade)
            y_diff = curr_y - last_y
            t_diff = max(0.01, now - last_ts)
            velocity = y_diff / t_diff

            # Critério B: Mudança de Aspect Ratio (Pessoa 'encolhe' verticalmente e 'alarga' horizontalmente)
            # Se a box ficou subitamente mais larga do que alta (pessoa no chão)
            if curr_aspect > 1.2 and velocity > self.SPEED_THRESHOLD:
                behavior = 'falling'
            elif y_diff > (last_h * 1.8): # Queda vertical extrema
                behavior = 'falling'
            
            # 2. Detecção de Correria (Horizontal Velocity)
            x_diff = abs(curr_x - last_x)
            if x_diff / t_diff > (self.SPEED_THRESHOLD * 5):
                behavior = 'running'

        # 3. Tracking de Permanência (Loitering) - Só para identificados ou persistentes
        if subject_id not in self.first_seen:
            self.first_seen[subject_id] = now
        
        if (now - self.first_seen[subject_id]) > 300: # 5 minutos
            behavior = 'loitering'

        # Atualizar histórico
        hist.append((curr_y, curr_x, curr_h, now))
        if len(hist) > self.MAX_HISTORY:
            hist.pop(0)

        return behavior

    def detect_cellphone(self, frame_roi) -> bool:
        """
        Placeholder para detecção de celular via ONNX (Fase 4 Step 86).
        Atualmente retorna falso ou simula baseado em gatilhos de treinamento.
        """
        return False
