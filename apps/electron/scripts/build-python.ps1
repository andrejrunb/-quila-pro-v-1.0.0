# build-python.ps1 (Áquila Pro - Phase 800)
# Script para converter scripts Python em binários executáveis (.exe)

$erroractionpreference = "Stop"

Write-Host "--- Iniciando Congelamento de Workers Python (Guardian AI) ---" -ForegroundColor Cyan

# 1. Garantir que PyInstaller está instalado
Write-Host "[1/4] Verificando dependências de build..."
pip install pyinstaller onnxruntime opencv-python numpy face_recognition

# 2. Criar diretório de saída
$BUILD_DIR = "dist/python_workers"
if (!(Test-Path $BUILD_DIR)) {
    New-Item -ItemType Directory -Path $BUILD_DIR
}

# 3. Congelar Camera Worker (Principal)
Write-Host "[2/4] Congelando Camera Worker..."
$MODELS_PATH = "C:\Users\Thaysa\AppData\Roaming\Python\Python314\site-packages\face_recognition_models\models"
python -m PyInstaller --noconfirm --onedir --console --name "aquila_camera_worker" --paths "./python" --add-data "./python/models;models" --add-data "$MODELS_PATH;face_recognition_models/models" "./python/camera_worker.py" --distpath "./dist/python_workers"

# 4. Congelar Face Worker (Opcional/Secundário)
Write-Host "[3/4] Congelando Face Worker..."
if (Test-Path "./python/face_worker.py") {
    python -m PyInstaller --noconfirm --onedir --console --name "aquila_face_worker" --paths "./python" "./python/face_worker.py" --distpath "./dist/python_workers"
} else {
    Write-Host "Face Worker não encontrado, pulando..."
}

Write-Host "[4/4] Processo concluído com sucesso!" -ForegroundColor Green
Write-Host "Binários localizados em: $BUILD_DIR"
