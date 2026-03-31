import cv2

def test_rtsp_stream(rtsp_url):
    """
    Testa a conexão e captura de um stream RTSP usando OpenCV.
    Pressione 'q' para sair.
    """
    print(f"Tentando conectar ao stream RTSP: {rtsp_url}")
    cap = cv2.VideoCapture(rtsp_url)

    if not cap.isOpened():
        print(f"Erro: Não foi possível abrir o stream RTSP de {rtsp_url}")
        return

    print("Conexão bem-sucedida. Pressione 'q' para sair da visualização.")
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Erro: Não foi possível ler o frame do stream.")
            break

        cv2.imshow('RTSP Stream', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("Stream RTSP encerrado.")

if __name__ == '__main__':
    # Exemplo de URL RTSP. Você precisará substituir por uma URL real da sua câmera IP.
    # Formatos comuns:
    # - rtsp://user:password@ip_address:port/stream_path
    # - rtsp://ip_address:port/stream_path
    # Consulte a documentação da sua câmera para a URL exata.
    sample_rtsp_url = "rtsp://admin:admin123@192.168.1.100:554/stream1"
    print("\n--- Teste de Conexão RTSP ---")
    print("Por favor, edite o script 'rtsp_test.py' com a URL RTSP da sua câmera IP real.")
    print("URL de exemplo atual: ", sample_rtsp_url)
    print("\nPara executar, use: python3 /home/ubuntu/aquila/src/camera_integration/rtsp_test.py")
    # test_rtsp_stream(sample_rtsp_url) # Descomente para testar após configurar a URL
