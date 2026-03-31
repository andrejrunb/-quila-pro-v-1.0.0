# Áquila Pro — Manual do Administrador (TI & Infraestrutura)

## 1. Introdução
Este manual descreve a configuração técnica e manutenção do servidor local Áquila Pro.

## 2. Requisitos de Hardware
- **Mínimo**: Intel i5 10ª Geração, 8GB RAM, SSD 256GB.
- **Recomendado (8+ Câmeras)**: Intel i7, 16GB RAM, GPU NVIDIA (Opcional p/ CUDA).

## 3. Configuração de Rede
- As câmeras devem estar na mesma VLAN que o servidor.
- Protocolo: **RTSP** (Real-Time Streaming Protocol).
- Latência máxima permitida: 100ms.

## 4. Segurança de Dados (LGPD)
- O banco de dados SQLite está localizado em `%APPDATA%/aquilapro/db.sqlite`.
- **NUNCA** copie este arquivo para nuvens públicas sem criptografia.
- O sistema realiza o **Auto-Purge** de evidências a cada 30 dias automaticamente.

## 5. Troubleshooting
- **Serviço não inicia**: Verifique se o processo `aquilapro_worker` está sendo bloqueado pelo Windows Defender.
- **RTSP Connection Refused**: Teste o link da câmera via VLC Player antes de configurar no Áquila.
