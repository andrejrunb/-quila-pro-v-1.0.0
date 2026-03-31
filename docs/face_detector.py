import cv2

class FaceDetector:
    def __init__(self, cascade_path="haarcascade_frontalface_default.xml"):
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + cascade_path)
        if self.face_cascade.empty():
            raise IOError(f"Não foi possível carregar o arquivo cascade: {cascade_path}")

    def detect_faces(self, frame, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=scaleFactor, minNeighbors=minNeighbors, minSize=minSize)
        return faces

    def draw_faces(self, frame, faces):
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
        return frame

if __name__ == '__main__':
    # Exemplo de uso do FaceDetector
    cap = cv2.VideoCapture(0) # Usar 0 para webcam, ou um caminho de vídeo

    if not cap.isOpened():
        print("Erro: Não foi possível abrir a câmera.")
    else:
        detector = FaceDetector()
        print("Pressione 'q' para sair.")
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Erro: Não foi possível ler o frame.")
                break

            faces = detector.detect_faces(frame)
            frame_with_faces = detector.draw_faces(frame, faces)

            cv2.imshow('Face Detection', frame_with_faces)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()
