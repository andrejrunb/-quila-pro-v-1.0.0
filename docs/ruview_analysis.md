# Relatório de Análise: RuView (WiFi-DensePose)
**Projeto:** Áquila Pro Strategy
**Data:** 25/03/2026

## 🧐 O que é o RuView?
O **RuView** é uma tecnologia de "Visão sem Câmeras" que utiliza os sinais WiFi (CSI - Channel State Information) para detectar a presença humana, mapear a pose do corpo (esqueletos) e até monitorar sinais vitais (frequência cardíaca e respiratória).

### 🛠️ Fatos Técnicos:
- **Hardware**: Usa nós de baixo custo baseados em ESP32-S3 (~$5 USD).
- **Core**: Escrito em **Rust** (moderno, seguro e ultra-rápido) para processamento de sinal.
- **AI**: Modelos via ONNX/Torch que mapeiam flutuações de sinal para coordenadas UV humanas (DensePose).

## 🚀 Potencial de Integração com Áquila Pro

### 1. "O Elo Perdido da Segurança Escolar"
A maior barreira de segurança em escolas são os **pontos cegos legais** (banheiros, vestiários, corredores privativos). O RuView resolve isso:
- **Detecção de Quedas**: Ideal para banheiros (segurança médica).
- **Detecção de Bullying/Brigas**: Analisa movimento e agitação sem capturar imagens.
- **Detecção de Invasão em Blackout**: Funciona no escuro total e através de paredes.

### 2. Mapeamento de Infraestrutura (WiFi SLAM)
A tecnologia RuView permite extrair o layout do ambiente:
- **Reflexão de Sinais**: Ao analisar como as ondas rebatem nos obstáculos, é possível montar um mapa 2D/3D das paredes e móveis automaticamente.
- **Mapeamento Passivo**: O Áquila Pro poderia gerar o "Plano de Fuga" ou "Mapa da Escola" apenas observando a propagação do sinal WiFi.

### 3. Detecção de Celulares (RF Fingerprinting)
O sistema pode identificar dispositivos móveis mesmo que não estejam conectados ao WiFi da escola:
- **Assinatura de Rádio**: Celulares emitem pings constantes de busca de rede. O sensoriamento WiFi detecta essas emissões de RF específicas.
- **Controle de Uso**: Útil para detectar aparelhos em áreas restritas ou horários de aula, sem precisar de scanners de metal.

### 4. Integração Arquitetônica
Como o Áquila Pro usa Electron + Python, a integração é simplificada:
- O backend Rust do RuView expõe uma API Axum (REST/WebSockets).
- O Áquila Pro pode consumir esses dados como uma "Câmera Virtual de WiFi", gerando alertas no Dashboard.

### 5. Diferenciação de Mercado
Oferecer o Áquila Pro com a promessa de **"Monitoramento 100% à prova de LGPD em áreas sensíveis"** é um argumento imbatível para coordenadores e pais.

## 📊 Plano de Ação (Sugerido)
- [ ] Prototipar 1 nó ESP32-S3 rodando o firmware do RuView.
- [ ] Criar um "Virtual Camera Driver" no Python do Áquila para ler os dados do RuView.
- [ ] Adicionar indicador no Dashboard: "Zona Privativa Monitorada via WiFi (Sem Imagem)".
