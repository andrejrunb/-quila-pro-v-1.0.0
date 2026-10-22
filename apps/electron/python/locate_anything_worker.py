#!/usr/bin/env python3
"""
locate_anything_worker.py — Áquila Pro Locate Anything Visual Grounding Worker
Comunicação com Node.js via stdin (comandos JSON) / stdout (resultados JSON).
"""

import sys
import json
import signal
import os
import numpy as np
from datetime import datetime
from typing import Optional

import logging
logging.basicConfig(stream=sys.stderr, level=logging.INFO,
                    format='%(asctime)s [LOCATE_ANYTHING] %(levelname)s: %(message)s')
logger = logging.getLogger('locate_anything')

class LocateAnythingWorker:
    """
    Worker para localização visual semântica (Locate Anything).
    Recebe frames e consultas textuais, retornando coordenadas de bounding box.
    """

    def __init__(self):
        self.mode = "SIMULATED_FALLBACK"
        logger.info(f"LocateAnythingWorker inicializado | Modo: {self.mode}")

    def handle_command(self, cmd: dict) -> Optional[dict]:
        action = cmd.get('action')

        if action == 'ping':
            return {'type': 'pong', 'ts': datetime.utcnow().isoformat()}

        elif action == 'locate':
            frame_path = cmd.get('frame_path')
            query = cmd.get('query')
            return self._locate(frame_path, query)

        elif action == 'status':
            return {
                'type': 'status',
                'locate_anything_available': True,
                'mode': self.mode
            }

        elif action == 'shutdown':
            logger.info("Shutdown solicitado.")
            self._emit({'type': 'shutdown_ack'})
            sys.exit(0)

        else:
            return {'type': 'error', 'message': f"Ação desconhecida: {action}"}

    def _locate(self, frame_path: Optional[str], query: Optional[str]) -> dict:
        if not frame_path:
            return {'type': 'error', 'message': 'frame_path não fornecido'}
        if not query:
            return {'type': 'error', 'message': 'query (consulta) não fornecida'}

        # Simulação de localização visual semântica (retorna uma caixa centralizada representativa)
        # Bounding box formato: [top, right, bottom, left]
        logger.info(f"Localizando '{query}' no frame: {frame_path}")
        
        # Simula coordenadas com base no query para fins de teste
        top = 180 + int(hash(query) % 100)
        left = 320 + int(hash(query) % 150)
        bottom = top + 150
        right = left + 120

        detections = [{
            'box': [top, right, bottom, left],
            'label': query.lower(),
            'confidence': 0.89
        }]

        return {
            'type': 'located',
            'detections': detections,
            'ts': datetime.utcnow().isoformat(),
            'simulated': True
        }

    def _emit(self, data: dict):
        try:
            line = json.dumps(data, ensure_ascii=False)
            sys.stdout.write(line + '\n')
            sys.stdout.flush()
        except Exception as e:
            logger.error(f"Erro ao emitir resultado: {e}")

    def run(self):
        logger.info("Locate Anything Worker pronto. Aguardando comandos...")
        self._emit({'type': 'ready', 'ts': datetime.utcnow().isoformat()})

        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                cmd = json.loads(line)
                result = self.handle_command(cmd)
                if result:
                    if 'request_id' in cmd:
                        result['request_id'] = cmd['request_id']
                    self._emit(result)
            except json.JSONDecodeError as e:
                self._emit({'type': 'error', 'message': f'JSON inválido: {e}'})
            except Exception as e:
                logger.error(f"Erro ao processar comando: {e}")
                self._emit({'type': 'error', 'message': str(e)})

def _handle_sigterm(signum, frame):
    logger.info("SIGTERM recebido. Encerrando worker.")
    sys.exit(0)

if __name__ == '__main__':
    signal.signal(signal.SIGTERM, _handle_sigterm)
    worker = LocateAnythingWorker()
    worker.run()
