# 📦 Áquila Pro — Manifesto do Artefato Candidato de Homologação
### Registro Auditável de Build para Validação em Máquina Limpa (Portão E-01) e Ensaios de Bancada (Portão E-02)

> **Finalidade:** Pacote 2 de Homologação — Artefato Rastreável Pré-P3  
> **Data de Geração:** 03 de Novembro de 2026 — 14:20 BRT  
> **Commit Completo de Origem:** `67a035d2f1da1103b9abd79540dbc0ae9060034a`  
> **Baseline de Integração:** SHA `b4a77d98c141cb51c8682b48bb5c6a3b6408ab91` (PR #10) + Commit `67a035d2` (Fix de Boot e Protocolo de Bancada)  
> **Status do Artefato:** Candidato restrito a testes de laboratório e bancada física; **distribuição pública e dados reais bloqueados**.

---

## 📋 1. Metadados do Binário Empacotado

| Propriedade | Valor Auditável |
| :--- | :--- |
| **Identificador da Versão** | `v2.1.0-rc.15-homologacao` |
| **Arquitetura Alvo** | Windows 11 Pro 64-bit (`win32-x64`) |
| **Executável Principal** | `apps/electron/release_v2_2/win-unpacked/Aquila Pro.exe` |
| **Tamanho do Executável** | `176.813.568 bytes` (~168.6 MB) |
| **Hash SHA-256 (`Aquila Pro.exe`)** | `F087E4B45834D8DAECBF88DD61B0A2757AB836B8A1891C16CA0AAB321E5D7EBB` |
| **Arquivo de Recursos (`app.asar`)** | `apps/electron/release_v2_2/win-unpacked/resources/app.asar` |
| **Tamanho do `app.asar`** | `698.583.425 bytes` (~666.2 MB) |
| **Hash SHA-256 (`app.asar`)** | `E903DB0AAC474A8018C0D18809A5538BC142808D90C4FA78E8021B042E7DD602` |
| **Empacotador Utilizado** | `electron-builder 24.13.3` com Electron Fuses |
| **Binários C++ Nativos Incluídos** | `better-sqlite3@11.10.0` (x64 nativo pré-compilado em `app.asar.unpacked`) |

---

## 🔒 2. Configurações de Segurança e Electron Fuses Ativos

O binário foi compilado com Electron Fuses gravados diretamente no executável nativo:
- **`runAsNode: false`**: Impede que o executável seja utilizado como interpretador Node.js arbitrário via CLI.
- **`enableCookieEncryption: true`**: Cifragem de cookies de sessão nativa via DPAPI.
- **`enableNodeOptionsEnvironmentVariable: false`**: Bloqueia injeção de flags via variável `NODE_OPTIONS`.
- **`enableNodeCliInspectArguments: false`**: Bloqueia abertura de portas de depuração V8/inspector em produção.
- **`initEnvironmentAndSecrets` (Zero-Bypass):** No primeiro boot em máquina limpa (sem `.env`), gera e persiste autonomamente um segredo soberano de 256 bits em `%APPDATA%\aquila-pro\.auth_secret` com permissões restritas `0600`.

---

## 🎯 3. Delimitação Estrita de Recursos (Recorte H-01)

| Recurso | Estado no Artefato |
| :--- | :---: |
| **Cadastro, Turmas e Matrículas (Sem CPF)** | 🟢 ATIVO |
| **Criação de Atividades Diagnósticas e Avaliação** | 🟢 ATIVO |
| **Portal do Aluno (Respostas, Rascunhos e Notas)** | 🟢 ATIVO |
| **Registro de Intervenção Pedagógica Docente** | 🟢 ATIVO |
| **SQLite WAL e Protocolo de Restauração em 7 Etapas** | 🟢 ATIVO (Bancada) |
| **Bloqueio de Envio de Redações para Nuvem** | 🟢 ATIVO PERMANENTE |
| **Teoria de Resposta ao Item (TRI)** | 🔴 DESATIVADA NO PILOTO |
| **Sincronização P2P Mesh** | 🔴 DESATIVADA |
| **Conexão Externa Google Colab / LoRA** | 🔴 FORA DO ESCOPO |
| **Biometria, Câmeras e Catracas Físicas** | 🔴 DESATIVADAS E FORA |

---

## ✍️ 4. Termo de Liberação para Envio à Bancada Física

Este artefato foi verificado, hash-auditado e liberado exclusivamente para a execução do **Pacote 3 (Instalação Limpa)** e **Pacote 4 (Ensaios de Recuperação)** conforme o [`PROTOCOLO_TESTE_BANCADA_E_CORTE_ENERGIA_H01.md`](file:///c:/aquila/docs/operations/PROTOCOLO_TESTE_BANCADA_E_CORTE_ENERGIA_H01.md):

- **Responsável pelo Build:** Anti Gravity & Tech Lead (`andrejrunb`)
- **Status:** **LIBERADO PARA BANCADA FÍSICA (PRE-P3)**
- **Próximo Passo:** Instalação no computador Windows 11 de teste isolado.
