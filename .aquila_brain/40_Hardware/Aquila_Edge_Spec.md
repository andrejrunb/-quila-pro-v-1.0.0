# [HW-SPEC-01] Áquila Edge Hub - Especificações de Hardware

## 1. Visão Geral
O Áquila Edge Hub é o hardware proprietário projetado para rodar o Áquila Pro localmente no campus com máxima soberania tecnológica e baixa latência.

## 2. Processamento (CPU/GPU/NPU)
- **SoC**: Custom ARM 64-bit Octa-Core.
- **NPU**: 26 TOPS (Tera Operations Per Second) dedicada para inferência de visão computacional.
- **GPU**: Integrated GPGPU para processamento paralelo de vídeo 4K.

## 3. Armazenamento & Memória
- **RAM**: 32GB LPDDR5 ECC (Error Correction Code).
- **SSD**: 2TB NVMe Gen4 (Criptografia AES-256 via hardware).

## 4. Conectividade redundante (Phase 203)
- **Primary**: Dual 10GbE SFP+ Fiber.
- **Secundário**: WiFi 6E + Bluetooth 5.3.
- **Backup Crítico**: Módulo LTE/5G Industrial integrado.

## 5. Protocolos de Segurança Física
- **Tamper Detection**: Sensores infravermelhos internos detectam abertura do chassi.
- **Secure Boot**: Assinatura digital do firmware via chip TPM 2.0.
- **Dissipação Passiva**: Design térmico avançado para operação 24/7 sem ruído.
