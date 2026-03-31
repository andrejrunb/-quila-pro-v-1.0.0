# weapon_detector.py — Áquila Pro Guardian AI (Phase 701)
import cv2
import numpy as np
import os
import time

try:
    import onnxruntime as ort
except ImportError:
    ort = None

class WeaponDetector:
    """
    Detector de Armas (Guardian AI) baseado em YOLOv8 ONNX.
    Item 701 do Roadmap Master.
    """
    def __init__(self, model_path: str = "models/yolov8n-weapons.onnx", confidence_threshold: float = 0.5):
        self.model_path = model_path
        self.conf_threshold = confidence_threshold
        self.session = None
        self.classes = ['pistol', 'rifle', 'knife'] # Classes típicas para segurança escolar
        
        if ort and os.path.exists(self.model_path):
            try:
                # Otimização para CPU / NPU (Item 321)
                providers = ['CPUExecutionProvider']
                if 'OpenVINOExecutionProvider' in ort.get_available_providers():
                    providers.insert(0, 'OpenVINOExecutionProvider')
                
                self.session = ort.InferenceSession(self.model_path, providers=providers)
                print(f"[Guardian AI] Modelo carregado com sucesso: {self.model_path}")
            except Exception as e:
                print(f"[Guardian AI] Erro ao carregar modelo ONNX: {e}")
        else:
            print("[Guardian AI] Modo Simulação: Modelo não encontrado ou onnxruntime ausente.")

    def preprocess(self, frame):
        """Prepara o frame para entrada do YOLOv8 (640x640, RGB, [0,1])"""
        img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (640, 640))
        img = img.astype(np.float32) / 255.0
        img = np.transpose(img, (2, 0, 1)) # HWC -> CHW
        img = np.expand_dims(img, axis=0) # CHW -> BCHW
        return img

    def detect(self, frame):
        """
        Executa a detecção no frame atual com NMS profissional.
        Retorna lista de dicionários: [{'box': [y1,x2,y2,x1], 'class': 'pistol', 'conf': 0.8}]
        """
        if self.session is None:
            return []

        h, w = frame.shape[:2]
        blob = self.preprocess(frame)
        
        input_name = self.session.get_inputs()[0].name
        outputs = self.session.run(None, {input_name: blob})
        output = outputs[0][0].T # [8400, 7]

        boxes = []
        confidences = []
        class_ids = []

        # YOLOv8 format: [cx, cy, w, h, class0, class1, class2]
        # Transposta para [8400, 7] -> cada linha é uma detecção
        for i in range(output.shape[0]):
            classes_scores = output[i][4:]
            max_score = np.max(classes_scores)
            
            if max_score > self.conf_threshold:
                confidences.append(float(max_score))
                class_ids.append(np.argmax(classes_scores))
                
                # Coordenadas originais em 640x640
                cx, cy, bw, bh = output[i][:4]
                
                # Converter para [x, y, w, h] para cv2.dnn.NMSBoxes
                x = int((cx - bw/2) * w / 640)
                y = int((cy - bh/2) * h / 640)
                width = int(bw * w / 640)
                height = int(bh * h / 640)
                
                boxes.append([x, y, width, height])

        # NMS Profissional (Item 701)
        indices = cv2.dnn.NMSBoxes(boxes, confidences, self.conf_threshold, 0.45)
        
        detections = []
        if len(indices) > 0:
            for i in indices.flatten():
                box = boxes[i]
                x, y, width, height = box
                
                # Formato compatível com face_recognition [top, right, bottom, left]
                top = max(0, y)
                left = max(0, x)
                bottom = min(h, y + height)
                right = min(w, x + width)
                
                detections.append({
                    'box': [top, right, bottom, left],
                    'class': self.classes[class_ids[i]] if class_ids[i] < len(self.classes) else "objeto_suspeito",
                    'conf': confidences[i]
                })

        return detections

if __name__ == "__main__":
    # Teste rápido
    detector = WeaponDetector()
    dummy_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
    results = detector.detect(dummy_frame)
    print(f"Resultados (Mock): {results}")
