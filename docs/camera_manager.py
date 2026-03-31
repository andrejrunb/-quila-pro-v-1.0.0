import cv2
import threading
import time
import logging
from ..facial_recognition.facial_recognition_system import FacialRecognitionSystem

# Configuração de logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class CameraManager:
    def __init__(self, camera_config, facial_recognition_system=None):
        self.camera_config = camera_config
        self.cameras = {}
        self.running = False
        self.frame_buffers = {}
        self.lock = threading.Lock()
        self.facial_recognition_system = facial_recognition_system

    def _capture_stream(self, camera_id, rtsp_url):
        logging.info(f"Iniciando captura para a câmera {camera_id} em {rtsp_url}")
        cap = cv2.VideoCapture(rtsp_url)

        if not cap.isOpened():
            logging.error(f"Erro: Não foi possível abrir o stream RTSP para a câmera {camera_id} em {rtsp_url}")
            return

        while self.running:
            ret, frame = cap.read()
            if not ret:
                logging.warning(f"Erro: Não foi possível ler o frame da câmera {camera_id}. Tentando reconectar...")
                cap.release()
                cap = cv2.VideoCapture(rtsp_url)
                if not cap.isOpened():
                    logging.error(f"Erro: Falha na reconexão da câmera {camera_id}.")
                    break
                time.sleep(5) # Espera antes de tentar novamente
                continue

            with self.lock:
                self.frame_buffers[camera_id] = frame
            
            # Se houver um sistema de reconhecimento facial, processar o frame
            if self.facial_recognition_system:
                results = self.facial_recognition_system.process_frame(frame)
                # Aqui você pode fazer algo com os resultados, como enviar para um banco de dados
                # ou para um módulo de presença.
                # Exemplo: logging.debug(f"Câmera {camera_id}: {results}")

            # Pequena pausa para evitar consumo excessivo de CPU
            time.sleep(0.01)

        cap.release()
        logging.info(f"Captura para a câmera {camera_id} encerrada.")

    def start_cameras(self):
        self.running = True
        for cam_id, cam_info in self.camera_config.items():
            rtsp_url = cam_info["rtsp_url"]
            thread = threading.Thread(target=self._capture_stream, args=(cam_id, rtsp_url))
            thread.daemon = True
            thread.start()
            self.cameras[cam_id] = thread
        logging.info("Todas as câmeras iniciadas.")

    def stop_cameras(self):
        self.running = False
        for cam_id, thread in self.cameras.items():
            if thread.is_alive():
                thread.join(timeout=5) # Espera a thread terminar
                if thread.is_alive():
                    logging.warning(f"Thread da câmera {cam_id} não encerrou. Pode haver recursos pendentes.")
        logging.info("Todas as câmeras paradas.")

    def get_latest_frame(self, camera_id):
        with self.lock:
            return self.frame_buffers.get(camera_id, None)

    def list_active_cameras(self):
        return list(self.cameras.keys())

if __name__ == '__main__':
    # Exemplo de configuração de câmeras
    camera_configurations = {
        "camera_sala_1": {
            "rtsp_url": "rtsp://admin:admin123@192.168.1.100:554/stream1",
            "location": "Sala 101"
        },
        "camera_entrada": {
            "rtsp_url": "rtsp://user:pass@192.168.1.101:554/live/ch0",
            "location": "Entrada Principal"
        }
    }

    print("\n--- Teste do CameraManager com Reconhecimento Facial (Simulado) ---")
    print("Por favor, certifique-se de que as URLs RTSP no script são válidas para suas câmeras IP.")
    print("Este teste simula a captura de streams de vídeo e o processamento por um sistema de RF.")
    print("Pressione Ctrl+C para parar.")

    # Inicializa o sistema de reconhecimento facial (simulado para este exemplo)
    # Em um cenário real, você carregaria um modelo treinado e um dataset de faces.
    fr_system = FacialRecognitionSystem() # Instancia o sistema de RF
    # fr_system.load_known_faces("./dataset_example") # Carregue seu dataset real
    # fr_system.train_recognizer() # Treine o reconhecedor se necessário

    manager = CameraManager(camera_configurations, facial_recognition_system=fr_system)
    manager.start_cameras()

    try:
        while True:
            for cam_id in manager.list_active_cameras():
                frame = manager.get_latest_frame(cam_id)
                if frame is not None:
                    # Os resultados do reconhecimento facial já estão sendo processados dentro de _capture_stream
                    # Aqui você pode adicionar lógica para exibir o frame com os resultados, se desejar
                    # frame_with_results = fr_system.draw_recognition_results(frame.copy(), fr_system.process_frame(frame))
                    # cv2.imshow(f"Câmera {cam_id}", frame_with_results) # Descomente para visualizar
                    pass
            time.sleep(1) # Simula o processamento em tempo real

    except KeyboardInterrupt:
        print("\nInterrupção pelo usuário. Parando câmeras...")
    finally:
        manager.stop_cameras()
        print("Teste do CameraManager finalizado.")
