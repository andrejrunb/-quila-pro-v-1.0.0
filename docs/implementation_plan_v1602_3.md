# Implementation Plan — Phase 1602.3: Final Build & Cleanup

Este plano finaliza o setup de testes gerando um novo instalador (`1.2.5`) com todas as melhorias recentes e limpando o excesso de arquivos na pasta `release`.

## Proposed Changes

### [Build] Nova Versão 1.2.5
- Executar `npm run dist:win` para gerar:
  - `AquilaPro-Setup-1.2.5.exe` (Instalador)
  - `AquilaPro-Portable-1.2.5.exe` (Portátil)

### [Maintenance] Limpeza de Espaço
- Remover versões obsoletas da pasta `c:\aquila\aquilapro_electron\release`:
  - `1.0.0`, `1.0.1`, `1.2.0`, `1.2.1`, `1.2.2`, `1.2.3`
  - Seus respectivos arquivos `.blockmap`

## Verification Plan

### Automated Tests
- Verificar no `package.json` se a versão é `1.2.5`.
- Confirmar a existência do arquivo `release/AquilaPro-Setup-1.2.5.exe` após o build.

### Manual Verification
- O usuário deve rodar o `AquilaPro-Setup-1.2.5.exe` e verificar se a versão exibida no rodapé/sobre é a `1.2.5`.
- Testar o Mapeamento WiFi real no Gerenciador IoT.
