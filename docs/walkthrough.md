# 🚀 Release Oficial: Áquila Pro v2.1.0 & Compilação de Produção

> **Status:** ✅ Concluído, Tagged (`v2.1.0`) & Compilado  
> **Data:** 08 de Agosto de 2026  
> **Diretório de Saída:** `C:\aquila\apps\electron\release_v2_2\`  

---

## 📦 Arquivos Compilados de Produção

| Arquivo | Tamanho | Descrição |
|---|---|---|
| **`AquilaPro-Setup-2.1.0.exe`** | **188.7 MB** | **Instalador Oficial NSIS de Produção** |
| `AquilaPro-Setup-2.1.0.exe.blockmap` | 184 KB | Mapa de blocos para Auto-Updater diferencial |
| `win-unpacked/` | — | Pasta com o executável descompactado pronto para execução direta |

---

## 🛠️ Resumo de Otimizações no Pacote v2.1.0

1. **Tamanho Otimizado:** O instalador foi reduzido para **188.7 MB** (compressão NSIS solid 7z), garantindo instalações rápidas.
2. **Dependências Nativas Recompiladas:** Recompilação automatizada do `better-sqlite3` para a versão exata do Electron (28.2.0, x64).
3. **High-Density UI (Zero-Scroll):** Código minificado e otimizado com empacotamento Vite v5.4.
4. **Desktop / Mobile Split:** Recursos de voz e scanner de lousa removidos do binário desktop, mantendo o executável enxuto.

---

## 🚀 Como Executar/Testar

- **Opção A (Instalação Padrão):** Executar `C:\aquila\apps\electron\release_v2_2\AquilaPro-Setup-2.1.0.exe`
- **Opção B (Execução Direta sem Instalar):** Abrir `C:\aquila\apps\electron\release_v2_2\win-unpacked\Áquila Pro.exe`
