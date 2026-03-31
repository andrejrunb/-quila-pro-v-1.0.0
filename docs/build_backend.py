import PyInstaller.__main__
import os
import sys

def build_backend():
    print("Iniciando build do Backend Flask com PyInstaller...")
    
    # Arquivo principal
    main_script = os.path.join("app.py") # O arquivo de entrada do app (ou run_web.py que é comum no Flask)
    
    # Crie o run_web.py caso o gunicorn/waitress vá ser usado (mais seguro)
    # se não, pode apontar para onde app.run() está.
    
    # Se você for usar waitress:
    with open("run_backend.py", "w", encoding="utf-8") as f:
        f.write('''
from app import create_app
from waitress import serve
import argparse
import logging

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Backend Aquila")
    parser.add_argument("--port", type=int, default=5000, help="Porta para o servidor")
    args = parser.parse_args()
    
    app = create_app()
    print(f"Iniciando Aquila Backend na porta {args.port}...")
    serve(app, host='127.0.0.1', port=args.port, 
          # threads=4, 
          # connection_limit=100
    )
''')

    # Montando comando do PyInstaller
    pyinstaller_args = [
        "run_backend.py",
        "--name=aquila_backend",
        "--noconfirm",         # Sobrescreve pastas build/dist
        "--onedir",            # onedir é melhor que onefile para apps com opencv/dlib
        "--windowed",          # Não abrir console preto
        
        # Incluir pastas estáticas (Flask)
        "--add-data=templates;templates",
        "--add-data=static;static",
        
        # Pode ser necessário forçar a inclusão do shape_predictor caso utilize
        # "--add-data=shape_predictor_68_face_landmarks.dat;.",
    ]
    
    PyInstaller.__main__.run(pyinstaller_args)
    print("Build do Backend finalizada. O executável está na pasta 'dist/aquila_backend'.")

if __name__ == "__main__":
    build_backend()
