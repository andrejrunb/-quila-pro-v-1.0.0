# ✨ Áquila Pro: Sovereign Core Constitution

Este documento define os princípios fundamentais e padrões operacionais para o desenvolvimento do Áquila Pro. Todos os Agentes de IA (incluindo Antigravity/Claude Code) devem ler e respeitar estas diretrizes.

## 🏛️ Princípios de Soberania
1. **Sovereign-First**: O dado deve permanecer local. Nenhuma API externa ou serviço de nuvem deve ser usado sem um fallback offline local.
2. **Zero-Bypass Architecture**: Nenhuma funcionalidade deve ignorar as camadas de segurança, governança ou auditoria de performance.
3. **Hardware Alignment**: O código deve ser otimizado para o hardware Áquila Edge (NPU 26 TOPS, Octa-Core ARM).

## 🛠️ Comandos de Referência
- **Dev Electron**: `npm run dev:electron` (Cwd: raiz)
- **Dev Web**: `npm run dev:web`
- **Build**: `npm run build`
- **Testes**: `npm run test --workspace apps/web` | `npm run test --workspace apps/electron`

## 🎨 Guia de Estilo (Elite UI)
- **CSS**: Apenas Vanilla CSS (Modern CSS). Evitar Tailwind a menos que solicitado.
- **Visual**: Glassmorphism, Premium Glow, Eagle Cards.
- **Framework**: Next.js 15+ (App Router) e Electron 30+.

## 🔒 Regras de Segurança e Performance
- **Database**: SQLite deve rodar SEMPRE em modo **WAL** com `synchronous = NORMAL`.
- **Encryption**: Dados PII de alunos (Nomes, Biometria) devem ser criptografados via `SecurityService`.
- **Memory**: O processo principal não deve exceder 500MB de Heap sem monitoramento.

---
*Status: Operacional (v1.0.0-Constitutional)*
