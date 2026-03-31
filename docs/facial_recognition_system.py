import cv2
import numpy as np
from face_detector import FaceDetector
from face_recognizer import FaceRecognizer
import os
import time
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class FacialRecognitionSystem:
    def __init__(self, model_filename="aquila_face_model.yml", recognizer_type="LBPH"):
        self.face_detector = FaceDetector()
        
        # Obter caminho do AppData
        if sys.platform == 'win32':
            base_dir = os.environ.get('APPDATA') or os.path.expanduser('~')
        else:
            base_dir = os.path.expanduser('~')
        self.app_data_dir = os.path.join(base_dir, 'AquilaSystem')
        os.makedirs(self.app_data_dir, exist_ok=True)
        
        # Mapear para o AppData
        self.model_path = os.path.join(self.app_data_dir, model_filename)
        
        # dataset
        self.dataset_path = os.path.join(self.app_data_dir, "dataset")
        os.makedirs(self.dataset_path, exist_ok=True)
        
        self.face_recognizer = FaceRecognizer(recognizer_type=recognizer_type, model_path=self.model_path)
        self.known_faces = []
        self.known_names = []

    def load_known_faces(self, dataset_path=None):
        if dataset_path is None:
            dataset_path = self.dataset_path
        logging.info(f"Carregando faces conhecidas do dataset: {dataset_path}")
        if not os.path.exists(dataset_path):
            logging.warning(f"Dataset path {dataset_path} nÃ£o encontrado. Crie um dataset para treinar o reconhecedor.")
            return

        faces = []
        names = []
        for name_dir in os.listdir(dataset_path):
            person_path = os.path.join(dataset_path, name_dir)
            if os.path.isdir(person_path):
                for img_name in os.listdir(person_path):
                    img_path = os.path.join(person_path, img_name)
                    img = cv2.imread(img_path)
                    if img is None:
                        logging.warning(f"NÃ£o foi possÃ­vel carregar a imagem: {img_path}")
                        continue
                    
                    # Converter para escala de cinza para o reconhecedor LBPH
                    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    
                    # Detectar faces na imagem de treinamento
                    detected_faces = self.face_detector.detect_faces(img)
                    if len(detected_faces) == 1:
                        (x, y, w, h) = detected_faces[0]
                        face_roi = gray_img[y:y+h, x:x+w]
                        # Redimensionar para um tamanho padrÃ£o para o reconhecedor
                        face_roi = cv2.resize(face_roi, (100, 100))
                        faces.append(face_roi)
                        names.append(name_dir)
                    elif len(detected_faces) > 1:
                        logging.warning(f"MÃºltiplas faces detectadas na imagem de treinamento {img_path}. Ignorando.")
                    else:
                        logging.warning(f"Nenhuma face detectada na imagem de treinamento {img_path}. Ignorando.")
        
        self.known_faces = faces
        self.known_names = names
        logging.info(f"{len(self.known_faces)} faces carregadas para treinamento.")

    def train_recognizer(self):
        if self.known_faces and self.known_names:
            self.face_recognizer.train(self.known_faces, self.known_names)
            logging.info("Reconhecedor facial treinado com sucesso.")
        else:
            logging.warning("Nenhuma face conhecida para treinar o reconhecedor.")

    def process_frame(self, frame):
        detected_faces_coords = self.face_detector.detect_faces(frame)
        recognized_results = []

        for (x, y, w, h) in detected_faces_coords:
            face_roi_color = frame[y:y+h, x:x+w]
            face_roi_gray = cv2.cvtColor(face_roi_color, cv2.COLOR_BGR2GRAY)
            
            # Redimensionar para o tamanho esperado pelo reconhecedor
            face_roi_gray = cv2.resize(face_roi_gray, (100, 100))

            name, confidence = self.face_recognizer.recognize(face_roi_gray)
            recognized_results.append({
                "bbox": (x, y, w, h),
                "name": name,
                "confidence": confidence
            })
        return recognized_results

    def draw_recognition_results(self, frame, results):
        for result in results:
            (x, y, w, h) = result["bbox"]
            name = result["name"]
            confidence = result["confidence"]

            color = (0, 255, 0) if name != "Desconhecido" else (0, 0, 255)
            text = f"{name} ({confidence:.2f})"

            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
            cv2.putText(frame, text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        return frame

if __name__ == '__main__':
    # Exemplo de uso do sistema de reconhecimento facial
    # Para este exemplo funcionar, vocÃª precisarÃ¡ de:
    # 1. Um arquivo haarcascade_frontalface_default.xml (geralmente vem com o OpenCV)
    # 2. Um diretÃ³rio './dataset' com subdiretÃ³rios para cada pessoa, contendo imagens de seus rostos.
    #    Ex: ./dataset/Alice/alice_1.jpg, ./dataset/Bob/bob_1.jpg

    # Criar um dataset de exemplo (apenas para demonstraÃ§Ã£o)
    dataset_path = "./dataset_example"
    os.makedirs(os.path.join(dataset_path, "Alice"), exist_ok=True)
    os.makedirs(os.path.join(dataset_path, "Bob"), exist_ok=True)

    # Criar imagens de exemplo (apenas para demonstraÃ§Ã£o)
    img_alice = np.zeros((200, 200, 3), dtype=np.uint8)
    cv2.circle(img_alice, (100, 80), 40, (255, 255, 255), -1) # Rosto
    cv2.ellipse(img_alice, (100, 120), (30, 15), 0, 0, 180, (255, 255, 255), -1) # Boca
    cv2.imwrite(os.path.join(dataset_path, "Alice", "alice_face.jpg"), img_alice)

    img_bob = np.zeros((200, 200, 3), dtype=np.uint8)
    cv2.rectangle(img_bob, (60, 40), (140, 120), (255, 255, 255), -1) # Rosto quadrado
    cv2.line(img_bob, (70, 130), (130, 130), (255, 255, 255), 5) # Boca
    cv2.imwrite(os.path.join(dataset_path, "Bob", "bob_face.jpg"), img_bob)

    print("\n--- Inicializando Sistema de Reconhecimento Facial ---")
    fr_system = FacialRecognitionSystem(model_filename="aquila_face_model.yml")
    fr_system.load_known_faces(dataset_path=dataset_path)
    fr_system.train_recognizer()

    # Testar com uma imagem de exemplo
    test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(test_frame, "Simulando Alice", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    # Para um teste real, vocÃª colocaria uma imagem com um rosto aqui
    # Por exemplo, uma imagem da Alice do dataset
    test_img_path = os.path.join(dataset_path, "Alice", "alice_face.jpg")
    if os.path.exists(test_img_path):
        test_face_img = cv2.imread(test_img_path)
        if test_face_img is not None:
            # Simular que a face da Alice estÃ¡ no frame
            test_frame[100:300, 100:300] = test_face_img

    results = fr_system.process_frame(test_frame)
    frame_with_results = fr_system.draw_recognition_results(test_frame, results)

    cv2.imshow("Reconhecimento Facial Ãquila", frame_with_results)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    # Limpar dataset de exemplo e modelo
    if os.path.exists(dataset_path):
        import shutil
        shutil.rmtree(dataset_path)
    if os.path.exists("aquila_face_model.yml"):
        os.remove("aquila_face_model.yml")
