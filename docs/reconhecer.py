import face_recognition
import cv2
import os

# Pasta onde estão as fotos cadastradas
path = "faces"

known_encodings = []
known_names = []

# Carregar imagens cadastradas
for file in os.listdir(path):
    image = face_recognition.load_image_file(f"{path}/{file}")
    encoding = face_recognition.face_encodings(image)[0]
    known_encodings.append(encoding)
    known_names.append(os.path.splitext(file)[0])

print("Faces cadastradas:", known_names)

# Abrir câmera
video = cv2.VideoCapture(0)

while True:
    ret, frame = video.read()
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    faces = face_recognition.face_locations(rgb)
    encodings = face_recognition.face_encodings(rgb, faces)

    for (top, right, bottom, left), face_encoding in zip(faces, encodings):
        matches = face_recognition.compare_faces(known_encodings, face_encoding)
        name = "Desconhecido"

        if True in matches:
            match_index = matches.index(True)
            name = known_names[match_index]

        cv2.rectangle(frame, (left, top), (right, bottom), (0,255,0), 2)
        cv2.putText(frame, name, (left, top - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)

    cv2.imshow("Reconhecimento Facial - Aquila", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video.release()
cv2.destroyAllWindows()
``