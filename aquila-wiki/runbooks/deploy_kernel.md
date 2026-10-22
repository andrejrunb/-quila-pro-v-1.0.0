# 🚀 Runbook: Deploy do Antigravity Kernel (Electron)

Este documento descreve o procedimento operacional para compilação, empacotamento e deploy do Kernel local nas unidades escolares.

---

## 📋 Pré-requisitos
- Node.js v20+ / npm v10+
- Ambiente Windows (para build de `.exe` / `.msi`)
- Acesso ao repositório `c:\aquila` atualizado.

## 🛠️ Procedimento de Compilação

### 1. Limpeza de Ambiente
Remova restos de builds anteriores para evitar poluição no binário.
```bash
rm -rf aquilapro_electron/dist
rm -rf aquilapro_electron/release
```

### 2. Instalação de Dependências
Garanta que todas as bibliotecas nativas estejam sincronizadas.
```bash
npm install
```

### 3. Execução da Build
Gere o instalador otimizado.
```bash
npm run build:electron
```

## 📦 Entrega e Instalação Local
1. Localize o instalador em `aquilapro_electron/release/AquilaPro_Setup_1.5.0.exe`.
2. Transfira via drive seguro ou rede local criptografada para o **Áquila Edge Hub**.
3. Execute o instalador como Administrador.

## 🔍 Verificação Pós-Instalação
- Verifique se o processo `AquilaPro.exe` está rodando.
- Confirme o modo WAL do SQLite:
  - O arquivo `database.sqlite-wal` deve aparecer na pasta `userData`.
- Teste a conexão local via `http://localhost:3000`.

---
*Escrito por: Agente Antigravity (IA)*
