---
title: Authentication & Session Service
tags: [auth, security, session, sovereign-os]
---

# Authentication & Session Service

O serviço de autenticação do Áquila Pro é projetado para operar sob o paradigma de **Soberania Local**, garantindo que as sessões sejam seguras, privadas e resilientes a reinicializações do sistema.

## 🧱 Arquitetura de Persistência Dual

O sistema utiliza duas camadas complementares para gerenciar a identidade do usuário:

1. **SQLite (`active_sessions`):** A "Fonte da Verdade". Armazena tokens criptografados e metadados de expiração. É usado para validação robusta de segurança.
2. **Local Store (`SessionService` - electron-store):** A "Camada de Persistência Local". Armazena o token ativo no disco do dispositivo em formato `.json`. Permite que o App restaure a sessão automaticamente ao ser aberto, sem exigir novo login constante.

## 🔄 Fluxo de Restauração (Stability Shield)

Para evitar quedas de sessão (comum em ambientes Electron), o Áquila implementa o seguinte ciclo no Boot:

1. O processo `main.ts` inicializa o `SessionService`.
2. O `AuthService` é instanciado e injetado com o `SessionService`.
3. No Frontend, o componente base chama o IPC `get-current-user`.
4. O `AuthService` busca o token no local store, valida contra o SQLite e retorna o perfil do usuário caso a sessão ainda seja válida.

## 🛡️ Segurança de IPC

Todas as chamadas de autenticação passam pelo `protectedHandle`, que implementa:
- **Rate Limiting:** Proteção contra ataques de força bruta local.
- **Diagnostic Logging:** Rastreamento de falhas de autenticação no processo principal para auditoria imediata.

---
Vincular a: [[10_Architecture/Architecture_Overview|Visão Geral da Arquitetura]] | [[00_Index|Intelligence Center]]
