import cv2
import numpy as np
import os

class FaceRecognizer:
    def __init__(self, recognizer_type='LBPH', model_path=None):
        if recognizer_type == 'LBPH':
            self.recognizer = cv2.face.LBPHFaceRecognizer_create()
        elif recognizer_type == 'Eigen':
            self.recognizer = cv2.face.EigenFaceRecognizer_create()
        elif recognizer_type == 'Fisher':
            self.recognizer = cv2.face.FisherFaceRecognizer_create()
        else:
            raise ValueError('Tipo de reconhecedor não suportado. Escolha entre LBPH, Eigen ou Fisher.')
        
        self.model_path = model_path
        self.labels = {}
        self.next_label_id = 0

        if self.model_path and os.path.exists(self.model_path):
            self.recognizer.read(self.model_path)
            # Carregar labels se existirem (LBPH não armazena labels diretamente)
            # Para um sistema real, você precisaria de um mapeamento de ID para nome em um DB
            print(f"Modelo de reconhecimento carregado de {self.model_path}")

    def train(self, faces, labels):
        if not faces or not labels:
            print("Nenhum dado para treinamento.")
            return
        
        # Mapear labels de string para IDs numéricos
        numeric_labels = []
        for label in labels:
            if label not in self.labels:
                self.labels[label] = self.next_label_id
                self.next_label_id += 1
            numeric_labels.append(self.labels[label])

        self.recognizer.train(faces, np.array(numeric_labels))
        print("Modelo de reconhecimento treinado com sucesso.")
        if self.model_path:
            self.recognizer.write(self.model_path)
            print(f"Modelo salvo em {self.model_path}")

    def recognize(self, face_image):
        if self.recognizer.empty():
            return "Desconhecido", 0.0
        
        label_id, confidence = self.recognizer.predict(face_image)
        
        # Mapear ID numérico de volta para label de string
        recognized_label = "Desconhecido"
        for label_name, lid in self.labels.items():
            if lid == label_id:
                recognized_label = label_name
                break
        
        return recognized_label, confidence

    def get_label_map(self):
        return {v: k for k, v in self.labels.items()}

if __name__ == '__main__':
    # Exemplo de uso do FaceRecognizer
    # Este é um exemplo simplificado. Em um cenário real, você teria um dataset de imagens.
    
    # 1. Preparar dados de treinamento (simulados)
    # Criar algumas imagens de rosto de exemplo (apenas para demonstração)
    # Em um cenário real, você usaria o FaceDetector para extrair rostos de imagens de treinamento.
    faces_data = []
    labels_data = []

    # Rosto 1: Alice
    img_alice1 = np.zeros((100, 100), dtype=np.uint8)
    cv2.putText(img_alice1, 'Alice', (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 255, 2)
    faces_data.append(img_alice1)
    labels_data.append('Alice')

    img_alice2 = np.zeros((100, 100), dtype=np.uint8)
    cv2.putText(img_alice2, 'Alice', (15, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.7, 255, 2)
    faces_data.append(img_alice2)
    labels_data.append('Alice')

    # Rosto 2: Bob
    img_bob1 = np.zeros((100, 100), dtype=np.uint8)
    cv2.putText(img_bob1, 'Bob', (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 255, 2)
    faces_data.append(img_bob1)
    labels_data.append('Bob')

    img_bob2 = np.zeros((100, 100), dtype=np.uint8)
    cv2.putText(img_bob2, 'Bob', (15, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.7, 255, 2)
    faces_data.append(img_bob2)
    labels_data.append('Bob')

    # 2. Inicializar e treinar o reconhecedor
    model_file = 'aquila_face_model.yml'
    recognizer = FaceRecognizer(recognizer_type='LBPH', model_path=model_file)
    recognizer.train(faces_data, labels_data)

    # 3. Testar reconhecimento
    print("\n--- Testando Reconhecimento ---")
    test_face_alice = np.zeros((100, 100), dtype=np.uint8)
    cv2.putText(test_face_alice, 'Alice', (12, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.75, 255, 2)
    name, conf = recognizer.recognize(test_face_alice)
    print(f"Rosto de teste (Alice): Reconhecido como {name} com confiança {conf:.2f}")

    test_face_charlie = np.zeros((100, 100), dtype=np.uint8)
    cv2.putText(test_face_charlie, 'Charlie', (5, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 255, 2)
    name, conf = recognizer.recognize(test_face_charlie)
    print(f"Rosto de teste (Charlie - Desconhecido): Reconhecido como {name} com confiança {conf:.2f}")

    # Limpar arquivo de modelo após o teste
    if os.path.exists(model_file):
        os.remove(model_file)
