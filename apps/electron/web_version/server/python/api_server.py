"""
API FastAPI para Áquila Pro

Servidor que expõe endpoints para reconhecimento facial e rastreamento de presença.
Integra-se com o frontend Node.js via HTTP/WebSocket.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import logging
import asyncio
import json
from typing import List, Dict, Optional
from datetime import datetime
import base64
import io
from PIL import Image

from aquila.facial_recognition import FacialRecognitionSystem
from aquila.presence_tracking import PresenceTracker, LocationType, EventType
from aquila.tracking_engine import AquilaTrackingEngine

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.api')

# Criar aplicação FastAPI
app = FastAPI(
    title="Áquila Pro API",
    description="API para reconhecimento facial e rastreamento de presença",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar sistemas
fr_system = FacialRecognitionSystem(
    model_path="aquila_face_model.pkl",
    dataset_path="./dataset",
    confidence_threshold=0.6,
    model_type="hog"
)

presence_tracker = PresenceTracker(db_path="data/presence.db")

tracking_engine = AquilaTrackingEngine(
    fr_model_path="aquila_face_model.pkl",
    dataset_path="./dataset",
    db_path="data/presence.db"
)

logger.info("API Áquila Pro inicializada")


# ============================================================================
# ENDPOINTS DE RECONHECIMENTO FACIAL
# ============================================================================

@app.post("/api/facial-recognition/load-dataset")
async def load_dataset(dataset_path: str = "./dataset") -> Dict:
    """
    Carrega o dataset de rostos conhecidos.
    
    Args:
        dataset_path: Caminho para o dataset
        
    Returns:
        Informações sobre o dataset carregado
    """
    try:
        num_faces = fr_system.load_known_faces(dataset_path)
        stats = fr_system.get_statistics()
        
        return {
            "success": True,
            "message": f"{num_faces} rostos carregados",
            "statistics": stats
        }
    except Exception as e:
        logger.error(f"Erro ao carregar dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facial-recognition/add-face")
async def add_face(
    student_id: str,
    file: UploadFile = File(...)
) -> Dict:
    """
    Adiciona um novo rosto ao dataset.
    
    Args:
        student_id: ID do aluno
        file: Arquivo de imagem
        
    Returns:
        Status da operação
    """
    try:
        # Salvar arquivo temporário
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Adicionar ao dataset
        success = fr_system.add_face_to_dataset(student_id, temp_path)
        
        if success:
            return {
                "success": True,
                "message": f"Rosto adicionado para {student_id}",
                "student_id": student_id
            }
        else:
            raise HTTPException(status_code=400, detail="Nenhum rosto detectado na imagem")
            
    except Exception as e:
        logger.error(f"Erro ao adicionar rosto: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facial-recognition/recognize-frame")
async def recognize_frame(
    image_data: str,
    scale_factor: float = 0.25
) -> Dict:
    """
    Reconhece rostos em uma imagem (base64).
    
    Args:
        image_data: Imagem em base64
        scale_factor: Fator de escala
        
    Returns:
        Lista de rostos detectados
    """
    try:
        # Decodificar base64
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Processar frame
        detections = fr_system.process_frame(frame, scale_factor)
        
        # Converter para JSON
        results = []
        for detection in detections:
            results.append({
                "face_id": detection.face_id,
                "name": detection.name,
                "confidence": detection.confidence,
                "location": detection.location,
                "timestamp": detection.timestamp
            })
        
        return {
            "success": True,
            "detections": results,
            "count": len(results)
        }
        
    except Exception as e:
        logger.error(f"Erro ao reconhecer frame: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/facial-recognition/statistics")
async def get_statistics() -> Dict:
    """
    Retorna estatísticas do modelo de reconhecimento facial.
    
    Returns:
        Estatísticas do modelo
    """
    try:
        stats = fr_system.get_statistics()
        return {
            "success": True,
            "statistics": stats
        }
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS DE RASTREAMENTO DE PRESENÇA
# ============================================================================

@app.post("/api/presence/register-location")
async def register_location(
    name: str,
    location_type: str,
    description: Optional[str] = None
) -> Dict:
    """
    Registra uma nova localização (sala, corredor, etc).
    
    Args:
        name: Nome da localização
        location_type: Tipo (sala_de_aula, banheiro, corredor, etc)
        description: Descrição opcional
        
    Returns:
        ID da localização registrada
    """
    try:
        loc_type = LocationType(location_type)
        location_id = presence_tracker.register_location(name, loc_type, description)
        
        return {
            "success": True,
            "location_id": location_id,
            "name": name,
            "type": location_type
        }
    except Exception as e:
        logger.error(f"Erro ao registrar localização: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/presence/register-student")
async def register_student(
    student_id: str,
    class_id: str
) -> Dict:
    """
    Registra um aluno em uma turma.
    
    Args:
        student_id: ID do aluno
        class_id: ID da turma
        
    Returns:
        Status da operação
    """
    try:
        success = presence_tracker.register_student_in_class(student_id, class_id)
        
        return {
            "success": success,
            "student_id": student_id,
            "class_id": class_id
        }
    except Exception as e:
        logger.error(f"Erro ao registrar aluno: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/presence/record-event")
async def record_event(
    student_id: str,
    location_id: int,
    event_type: str
) -> Dict:
    """
    Registra um evento de presença.
    
    Args:
        student_id: ID do aluno
        location_id: ID da localização
        event_type: Tipo de evento (entrada, saida, presenca, ausencia, atraso)
        
    Returns:
        ID do evento registrado
    """
    try:
        evt_type = EventType(event_type)
        event_id = presence_tracker.record_presence_event(student_id, location_id, evt_type)
        
        return {
            "success": True,
            "event_id": event_id,
            "student_id": student_id,
            "location_id": location_id,
            "event_type": event_type,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erro ao registrar evento: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS DE RASTREAMENTO INTEGRADO
# ============================================================================

@app.post("/api/tracking/setup-locations")
async def setup_tracking_locations(locations: Dict) -> Dict:
    """
    Configura localizações para o motor de rastreamento.
    
    Args:
        locations: Dicionário com configurações de localizações
        
    Returns:
        Status da configuração
    """
    try:
        success = tracking_engine.setup_locations(locations)
        
        return {
            "success": success,
            "message": f"{len(locations)} localização(ões) configurada(s)"
        }
    except Exception as e:
        logger.error(f"Erro ao configurar localizações: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tracking/register-students")
async def register_tracking_students(students: List[Dict]) -> Dict:
    """
    Registra alunos no motor de rastreamento.
    
    Args:
        students: Lista de alunos
        
    Returns:
        Status do registro
    """
    try:
        success = tracking_engine.register_students(students)
        
        return {
            "success": success,
            "message": f"{len(students)} aluno(s) registrado(s)"
        }
    except Exception as e:
        logger.error(f"Erro ao registrar alunos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tracking/process-frame")
async def process_tracking_frame(
    image_data: str,
    location_id: int,
    scale_factor: float = 0.25
) -> Dict:
    """
    Processa um frame com rastreamento integrado.
    
    Args:
        image_data: Imagem em base64
        location_id: ID da localização
        scale_factor: Fator de escala
        
    Returns:
        Eventos registrados
    """
    try:
        # Decodificar base64
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Processar frame
        events = tracking_engine.process_frame(frame, location_id, scale_factor)
        
        return {
            "success": True,
            "events": events,
            "count": len(events)
        }
        
    except Exception as e:
        logger.error(f"Erro ao processar frame: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tracking/student-status/{student_id}")
async def get_student_status(
    student_id: str,
    location_id: int
) -> Dict:
    """
    Obtém o status atual de um aluno.
    
    Args:
        student_id: ID do aluno
        location_id: ID da localização
        
    Returns:
        Status do aluno
    """
    try:
        status = tracking_engine.get_student_status(student_id, location_id)
        
        return {
            "success": True,
            "status": status
        }
    except Exception as e:
        logger.error(f"Erro ao obter status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# WEBSOCKET PARA STREAMING EM TEMPO REAL
# ============================================================================

@app.websocket("/ws/video-stream/{location_id}")
async def websocket_video_stream(websocket: WebSocket, location_id: int):
    """
    WebSocket para streaming de vídeo em tempo real.
    
    Protocolo:
    - Cliente envia: {"type": "frame", "data": "base64_image"}
    - Servidor responde: {"type": "detections", "data": [...]}
    """
    await websocket.accept()
    logger.info(f"WebSocket conectado para localização {location_id}")
    
    try:
        while True:
            # Receber dados do cliente
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "frame":
                # Processar frame
                events = tracking_engine.process_frame(
                    image_data=message.get("data"),
                    location_id=location_id,
                    scale_factor=0.25
                )
                
                # Enviar resposta
                response = {
                    "type": "detections",
                    "events": events,
                    "timestamp": datetime.now().isoformat()
                }
                
                await websocket.send_text(json.dumps(response))
                
    except Exception as e:
        logger.error(f"Erro no WebSocket: {str(e)}")
    finally:
        logger.info(f"WebSocket desconectado para localização {location_id}")


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health_check() -> Dict:
    """
    Verifica a saúde da API.
    
    Returns:
        Status da API
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "facial_recognition": {
            "loaded": len(fr_system.known_face_encodings) > 0,
            "total_encodings": len(fr_system.known_face_encodings)
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    # Carregar dataset ao iniciar
    logger.info("Carregando dataset...")
    fr_system.load_known_faces()
    
    # Iniciar servidor
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
