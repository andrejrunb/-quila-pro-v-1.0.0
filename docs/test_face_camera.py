<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <title>Dashboard - Áquila</title>
  </head>
  <body>
    <h1>Dashboard</h1>

    <h2>Estatísticas</h2>
    <ul>
      <li>Total de alunos: {{ stats.total_students }}</li>
      <li>Total de turmas: {{ stats.total_classes }}</li>
      <li>Presentes hoje: {{ stats.students_present_today }}</li>
      <li>Ausentes hoje: {{ stats.students_absent_today }}</li>
      <li>Taxa de presença: {{ stats.attendance_rate }}%</li>
      <li>Alunos em risco: {{ stats.students_at_risk }}</li>
    </ul>

    <p><a href="{{ url_for('auth.logout') }}">Sair</a></p>
  </body>
</html>import cv2
import face_recognition

# inicia camera
video = cv2.VideoCapture(0)

print("Camera iniciada. Pressione Q para sair.")

while True:
    ret, frame = video.read()

    if not ret:
        break

    # converte BGR para RGB
    rgb = frame[:, :, ::-1]

    # detecta rostos
    faces = face_recognition.face_locations(rgb)

    # desenha caixas
    for top, right, bottom, left in faces:
        cv2.rectangle(frame, (left, top), (right, bottom), (0,255,0), 2)

    cv2.imshow("Aquila Vision", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

video.release()
cv2.destroyAllWindows()