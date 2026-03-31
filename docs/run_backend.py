
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
