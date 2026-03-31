import onnxruntime as ort
import numpy as np
import cv2
import logging
import os
import time

logger = logging.getLogger('onnx_inference')
logging.basicConfig(level=logging.INFO)

class ONNXInferenceEngine:
    """
    Motor de inferência ONNX otimizado para Áquila Pro.
    Tenta usar DirectML (NPU/GPU) por padrão no Windows.
    """
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.session = None
        self.providers = ort.get_available_providers()
        
        # Prioridade de Providers
        preferred = ["DmlExecutionProvider", "CUDAExecutionProvider", "CPUExecutionProvider"]
        actual_providers = [p for p in preferred if p in self.providers]
        
        try:
            logger.info(f"Inicializando ONNX Session com providers: {actual_providers}")
            self.session = ort.InferenceSession(model_path, providers=actual_providers)
            self.input_name = self.session.get_inputs()[0].name
            logger.info(f"Modelo carregado com sucesso: {model_path}")
        except Exception as e:
            logger.error(f"Erro ao carregar modelo ONNX: {e}")
            raise

    def preprocess(self, img_path: str, target_size=(160, 160)):
        """Pre-processamento para modelos estilo FaceNet/InsightFace."""
        img = cv2.imread(img_path)
        if img is None:
            return None
        
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, target_size)
        
        # Normalização comum (-1 a 1 ou 0 a 1 dependendo do modelo)
        img = (img.astype(np.float32) - 127.5) / 128.0
        
        # Transpose para (1, 3, H, W) se o modelo exigir NCHW
        # Aqui assumimos HWC p/ compatibilidade genérica, ajustamos se necessário
        return np.expand_dims(img, axis=0)

    def run(self, input_data: np.ndarray):
        if self.session is None:
            return None
        
        start_time = time.time()
        outputs = self.session.run(None, {self.input_name: input_data})
        latency = (time.time() - start_time) * 1000
        
        logger.debug(f"Inferência concluída em {latency:.2f}ms")
        return outputs[0], latency

if __name__ == "__main__":
    # Teste de carga se o modelo existir
    if os.path.exists("python/models/facenet.onnx"):
        engine = ONNXInferenceEngine("python/models/facenet.onnx")
        print("Engine pronta.")
    else:
        print("Modelo não encontrado para teste de carga.")
