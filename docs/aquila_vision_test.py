import face_recognition
import cv2
import os

# carregar rostos conhecidos
rostos_conhecidos = []
nomes = []

for arquivo in os.listdir("faces"):
    imagem = face_recognition.load_image_file(f"faces/{arquivo}")
    encoding = face_recognition.face_encodings(imagem)[0]

    rostos_conhecidos.append(encoding)
    nomes.append(os.path.splitext(arquivo)[0])

print("Rostos carregados:", nomes)

# iniciar câmera
video = cv2.VideoCapture(0)

while True:

    ret, frame = video.read()

    rgb = frame[:, :, ::-1]

    locais = face_recognition.face_locations(rgb)
    encodings = face_recognition.face_encodings(rgb, locais)

    for (top, right, bottom, left), face_encoding in zip(locais, encodings):

        matches = face_recognition.compare_faces(rostos_conhecidos, face_encoding)

        nome = "Desconhecido"

        if True in matches:
            index = matches.index(True)
            nome = nomes[index]

        cv2.rectangle(frame, (left, top), (right, bottom), (0,255,0), 2)
        cv2.putText(frame, nome, (left, top-10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)

    cv2.imshow("Aquila Vision", frame)

    if cv2.waitKey(1) == 27:
        break

video.release()
cv2.destroyAllWindows()