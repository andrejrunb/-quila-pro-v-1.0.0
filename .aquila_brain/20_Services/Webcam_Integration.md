# 📷 Integração: Webcams USB (UVC)

As webcams USB são a forma mais simples de capturar fotos para o **Totem de Visitantes** ou para o **Cadastro de Alunos**.

## ⚙️ Funcionamento no Áquila Pro
- **Protocolo**: UVC (USB Video Class) Nativo.
- **Detecção**: O sistema utiliza `navigator.mediaDevices.enumerateDevices()` para listar todas as câmeras conectadas ao PC/Totem.

## ✅ Como Configurar
1. **Conexão**: Conecte a webcam em uma porta USB 3.0 (preferencialmente).
2. **Permissões**: Ao abrir o Áquila pela primeira vez no Totem, o Windows/Electron pedirá permissão de acesso à câmera. Clique em **Permitir**.
3. **Seleção**: No menu de Configurações do SOC > Câmeras Locais, selecione a webcam desejada da lista.

## 💡 Dica de Elite
Para o **Totem**, use webcams com **Foco Automático** (Auto-focus) e **Correção de Luz**, para garantir fotos nítidas dos visitantes mesmo em ambientes com contraluz (vidraças de entrada).

---
Vincular a: [[20_Services/Camera_Engine|Camera Engine]]
