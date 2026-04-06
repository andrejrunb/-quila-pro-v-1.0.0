#!/usr/bin/env python3
"""
camera_worker.py — Áquila Pro Dedicated Camera Worker
Isolamento total por câmera (Proc-per-Camera).
Lê RTSP + Reconhece Faces + Detecta Movimento.
"""

import sys
import json
import time
import os
import signal
import numpy as np
import cv2
import logging
from datetime import datetime
from typing import Dict, List, Optional
from behavior_engine import BehaviorEngine
from weapon_detector import WeaponDetector

# Log fixo para stderr para não poluir o canal IPC (stdout)
logging.basicConfig(stream=sys.stderr, level=logging.INFO,
                    format='%(asctime)s [CAM_WORKER] %(levelname)s: %(message)s')
logger = logging.getLogger('camera_worker')

try:
    import face_recognition
    FACE_AVAILABLE = True
except ImportError:
    FACE_AVAILABLE = False
    logger.warning("face_recognition não disponível. Modo simulação ativo.")

try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False
    logger.info("ONNX Runtime não disponível. Usando Dlib (CPU).")

class CameraWorker:
    def __init__(self, camera_id: str, rtsp_url: str, zone: str):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.zone = zone
        self.is_running = False
        
        # Biometria
        self.known_encodings: Dict[str, List[np.ndarray]] = {}
        self.tolerance = float(os.environ.get('FACE_TOLERANCE', '0.6'))
        self.model = os.environ.get('FACE_MODEL', 'hog')
        self.throttle_mode = False # Item 67 Optimization
        
        # ONNX Config (Item 86)
        onnx_model_raw = os.environ.get('ONNX_FACE_MODEL')
        self.onnx_model_path: Optional[str] = str(onnx_model_raw) if onnx_model_raw else None
        self.onnx_session: Optional[ort.InferenceSession] = None
        
        if ONNX_AVAILABLE and self.onnx_model_path:
            if os.path.exists(str(self.onnx_model_path)):
                try:
                    providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
                    sess = ort.InferenceSession(self.onnx_model_path, providers=providers)
                    self.onnx_session = sess
                    logger.info(f"ONNX Session iniciada com providers: {sess.get_providers()}")
                except Exception as e:
                    logger.warning(f"Falha ao carregar ONNX: {e}. Revertendo p/ Dlib.")
            else:
                logger.debug(f"Modelo ONNX não encontrado em {self.onnx_model_path}")
        
        # Controle de taxa
        self.fps_target: float = 1.0
        # Análise Comportamental (Item 76)
        self.behavior_engine = BehaviorEngine(camera_id)
        # Guardian AI: Detecção de Armas (Phase 701)
        self.weapon_detector = WeaponDetector()
        self.last_process_time: float = 0.0
        
        # Otimização de Movimento (Item 87)
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=16, detectShadows=True)
        self.motion_detected = False
        
    def _emit(self, data: dict):
        line = json.dumps(data, ensure_ascii=False)
        sys.stdout.write(line + '\n')
        sys.stdout.flush()

    def handle_command(self, cmd: dict):
        action = cmd.get('action')
        
        if action == 'load_embeddings':
            sid = cmd['student_id']
            vecs = cmd['vectors']
            self.known_encodings[sid] = [np.array(v) for v in vecs]
            self._emit({'type': 'ack', 'action': 'load', 'student_id': sid})
            
        elif action == 'unload_student':
            sid = cmd['student_id']
            self.known_encodings.pop(sid, None)
            self._emit({'type': 'ack', 'action': 'unload', 'student_id': sid})
            
        elif action == 'update_config':
            self.tolerance = cmd.get('tolerance', self.tolerance)
            self.fps_target = cmd.get('fps', self.fps_target)
            
        elif action == 'set_throttle':
            self.throttle_mode = bool(cmd.get('enabled', False))
            # Quando limitado, reduzimos o FPS alvo para diminuir carga de I/O e CPU
            self.fps_target = 0.5 if self.throttle_mode else 1.0
            logger.info(f"Throttle Mode: {self.throttle_mode} | FPS Target: {self.fps_target}")
            self._emit({'type': 'ack', 'action': 'throttle', 'enabled': self.throttle_mode})

        elif action == 'clear_memory':
            logger.info("Limpando cache de biometria para economia de RAM.")
            # No Dlib não há muito o que limpar além dos buffers internos se estivéssemos usando dnn_face_detection
            # mas podemos forçar o coletor do Python
            import gc
            gc.collect()
            self._emit({'type': 'ack', 'action': 'clear_memory'})
            
        elif action == 'stop':
            self.is_running = False
            logger.info("Encerrando via comando.")
            sys.exit(0)

    def start_loop(self):
        logger.info(f"Iniciando stream: {self.camera_id} | {self.rtsp_url}")
        self.is_running = True
        
        # Tentar abrir captura
        source = self.rtsp_url
        try:
            # Se for um número (índice da webcam), converte para int
            if source.isdigit():
                source = int(source)
        except:
            pass

        cap = cv2.VideoCapture(source)
        if not cap.isOpened() and not self.rtsp_url.startswith('simulate://'):
            self._emit({'type': 'error', 'message': f'Falha ao abrir fonte de video: {self.rtsp_url}'})
            return

        self._emit({'type': 'ready', 'camera_id': self.camera_id})

        while self.is_running:
            # Ler comandos pendentes do stdin sem bloquear o loop de frames
            # No Windows Select.select não funciona em pipes facilmente, 
            # usaremos uma estratégia de leitura rápida se disponível ou comandos assíncronos via thread
            # Por simplicidade neste MVP de refatoração, vamos processar frames.
            
            now = time.time()
            if now - self.last_process_time < (1.0 / self.fps_target):
                # Throttle manual se o cap for muito rápido
                time.sleep(0.01)
                continue
            
            self.last_process_time = now
            
            ret, frame = cap.read() if cap.isOpened() else (False, None)
            
            if not ret:
                # Simulação ou erro de conexão
                if self.rtsp_url.startswith('simulate://'):
                    self._process_fake_frame()
                else:
                    logger.error("Conexão perdida. Tentando reconectar...")
                    cap.release()
                    time.sleep(5)
                    cap = cv2.VideoCapture(self.rtsp_url)
                continue

            self._process_frame(frame)

    def _process_frame(self, frame):
        """Processamento real do frame (IA + Comportamento)."""
        if not FACE_AVAILABLE or not self.known_encodings:
            return

        try:
            # Otimização de Movimento: Pular IA se o quadro estiver estático (Step 87)
            mask = self.bg_subtractor.apply(frame)
            motion_pixels = cv2.countNonZero(mask)
            total_pixels = frame.shape[0] * frame.shape[1]
            motion_percent = (motion_pixels / total_pixels) * 100
            
            if motion_percent < 0.5: # Menos de 0.5% de movimento
                if self.motion_detected:
                    logger.info(f"[{self.camera_id}] Movimento cessou. Entrando em standby de IA.")
                    self.motion_detected = False
                return # Pula o processamento pesado
            
            if not self.motion_detected:
                logger.info(f"[{self.camera_id}] Movimento detectado ({motion_percent:.2f}%). Ativando IA.")
                self.motion_detected = True

            # Reduzir para processamento mais rápido (Item 67: Dynamic Throttling)
            scale = 0.125 if self.throttle_mode else 0.25
            small = cv2.resize(frame, (0, 0), fx=scale, fy=scale)
            rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
            
            # Selecionar método de detecção (Step 86: GPU Acceleration)
            if self.onnx_session:
                locations = self._detect_faces_onnx(rgb)
            else:
                locations = face_recognition.face_locations(rgb, model=self.model)
            
            # --- AG-021.1: Detecção de Multidão (Crowd) ---
            if len(locations) > 5:
                self._emit({
                    'type': 'crowd_detected',
                    'count': len(locations),
                    'zone': self.zone,
                    'camera_id': self.camera_id,
                    'ts': datetime.utcnow().isoformat()
                })

            if not locations:
                return
            
            encodings = face_recognition.face_encodings(rgb, locations)
            
            # --- AG-021.2: Reconhecimento Multi-Sujeito + Behavior Analysis ---
            for i, loc in enumerate(locations):
                best_id, best_dist = None, float('inf')
                
                # Tentar reconhecimento se houver encodings conhecidos
                if encodings:
                    enc = encodings[i]
                    for sid, knowns in self.known_encodings.items():
                        dists = face_recognition.face_distance(knowns, enc)
                        d = float(np.min(dists))
                        if d < best_dist:
                            best_dist = d
                            best_id = sid
                
                # Se não identificado, tratar como anônimo persistente p/ tracking comportamental
                subject_id = best_id if (best_id and best_dist <= self.tolerance) else f"anon_{i}"
                
                # Análise comportamental obrigatória (Phase 1605)
                box = list(loc) # [top, right, bottom, left]
                behavior = self.behavior_engine.analyze(subject_id, box)

                # Emitir detecção facial se identificado
                if best_id and best_dist <= self.tolerance:
                    conf = 1.0 - best_dist
                    self._emit({
                        'type': 'face_detected',
                        'student_id': best_id,
                        'confidence': float(f"{conf:.4f}"),
                        'behavior': behavior,
                        'zone': self.zone,
                        'camera_id': self.camera_id,
                        'ts': datetime.utcnow().isoformat(),
                        'box': [int(x) for x in box]
                    })
                
                # Emitir Alerta Crítico de Queda (Safety Passive)
                if behavior == 'falling':
                    self._emit({
                        'type': 'fall_detected',
                        'subject_id': subject_id,
                        'zone': self.zone,
                        'camera_id': self.camera_id,
                        'ts': datetime.utcnow().isoformat(),
                        'box': [int(x) for x in box],
                        'priority': 'HIGH'
                    })

            # --- Phase 701: Guardian AI Detection ---
            # Executado após reconhecimento facial para priorizar identificação, 
            # mas independente para detecção de ameaças anônimas.
            weapon_results = self.weapon_detector.detect(frame)
            for res in weapon_results:
                self._emit({
                    'type': 'weapon_detected',
                    'class': res['class'],
                    'confidence': float(f"{res['conf']:.4f}"),
                    'zone': self.zone,
                    'camera_id': self.camera_id,
                    'ts': datetime.utcnow().isoformat(),
                    'box': [int(x) for x in res['box']],
                    'priority': 'CRITICAL'
                })
        except Exception as e:
            logger.error(f"Erro processando frame: {e}")

    def _detect_faces_onnx(self, rgb_frame) -> List[tuple]:
        """
        Infrerência de detecção facial via ONNX (YuNet/RetinaFace standard).
        Retorna lista de tuples (top, right, bottom, left) compatível c/ dlib.
        """
        if not self.onnx_session: return []
        
        # Otimização: Preparar blob (Redimensionar p/ 320x320 ou 640x640)
        # Este é um placeholder estrutural para o modelo que o cliente escolherá.
        # Exemplo YuNet:
        try:
            session = self.onnx_session
            if session:
                blob = cv2.dnn.blobFromImage(rgb_frame, 1.0, (320, 320), (104.0, 177.0, 123.0), False, False)
                outputs = session.run(None, {session.get_inputs()[0].name: blob})
                # Lógica de parser de boxes aqui...
            return []
        except:
            return []

    def _process_fake_frame(self):
        """Emite detecções aleatórias para teste do dashboard."""
        if not self.known_encodings: return
        
        # Simular detecção a cada 30 segundos se houver alunos carregados
        if int(time.time()) % 30 == 0:
            sid = list(self.known_encodings.keys())[0]
            self._emit({
                'type': 'face_detected',
                'student_id': sid,
                'confidence': 0.95,
                'zone': self.zone,
                'camera_id': self.camera_id,
                'ts': datetime.utcnow().isoformat(),
                'simulated': True
            })
            time.sleep(1) # Evitar spam no mesmo segundo

def listen_commands(worker: CameraWorker):
    """Thread ou loop para ler stdin sem bloquear a captura."""
    import threading
    def _read():
        for line in sys.stdin:
            try:
                cmd = json.loads(line.strip())
                worker.handle_command(cmd)
            except: pass
    
    t = threading.Thread(target=_read, daemon=True)
    t.start()

if __name__ == "__main__":
    # Payload inicial via ENV ou args
    cam_id = os.environ.get('CAM_ID', 'dev_cam')
    rtsp = os.environ.get('RTSP_URL', 'simulate://')
    zone = os.environ.get('ZONE', 'entrada')
    
    worker = CameraWorker(cam_id, rtsp, zone)
    listen_commands(worker)
    
    try:
        worker.start_loop()
    except KeyboardInterrupt:
        sys.exit(0)
