# MVP Checklist - Áquila Pro

## 🛠️ Testes e Estabilidade
- [ ] **Testes Unitários**:
  - [ ] `FaceRecognitionService`
  - [ ] `AuthService`
  - [ ] `WhatsAppQueue`
- [ ] **Testes de Integração**:
  - [ ] Fluxo Completo: Detecção -> Reconhecimento -> Registro de Presença
- [ ] **Testes E2E (Playwright/Cypress)**:
  - [ ] Login e Dashboard
  - [ ] Cadastro de Aluno

## 🐛 Correções Críticas
- [x] Correção do erro de inicialização `logger` (Top-Level Fix)
- [ ] Verificação de concorrência no SQLite ao processar múltiplas detecções

## 📄 Documentação
- [ ] Manual do Usuário (Versão 1.0)
- [ ] Guia de Instalação para o Diretor
- [ ] FAQ e Solução de Problemas Comuns

## ⚖️ Conformidade e Segurança
- [ ] Implementar Termo de Consentimento LGPD na interface
- [ ] Revisar Criptografia de Dados Sensíveis
- [ ] Backup Automático Diário (Verificação)

## 🎨 Polimento UI/UX
- [ ] Implementar Dark Mode Global
- [ ] Adicionar micro-animações de feedback (Loading, Success, Error)
