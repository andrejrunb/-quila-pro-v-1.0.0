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
$MODELS_PATH = (python -c "import os, face_recognition_models; print(os.path.join(os.path.dirname(face_recognition_models.__file__), 'models'))" 2>$null).Trim()
if ([string]::IsNullOrWhiteSpace($MODELS_PATH) -or !(Test-Path $MODELS_PATH)) {
    Write-Error "Nao foi possivel localizar o diretorio de modelos 'face_recognition_models/models' no ambiente Python ativo. Instale 'face_recognition_models' antes de prosseguir."
    exit 1
}
python -m PyInstaller --noconfirm --onedir --console --name "aquila_camera_worker" --paths "./python" --add-data "./python/models;models" --add-data "$MODELS_PATH;face_recognition_models/models" "./python/camera_worker.py" --distpath "./dist/python_workers"

# 4. Congelar Face Worker (Opcional/Secundário)
Write-Host "[3/4] Congelando Face Worker..."
if (Test-Path "./python/face_worker.py") {
    python -m PyInstaller --noconfirm --onedir --console --name "aquila_face_worker" --paths "./python" --add-data "$MODELS_PATH;face_recognition_models/models" "./python/face_worker.py" --distpath "./dist/python_workers"
} else {
    Write-Host "Face Worker não encontrado, pulando..."
}

Write-Host "[4/4] Processo concluído com sucesso!" -ForegroundColor Green
Write-Host "Binários localizados em: $BUILD_DIR"
