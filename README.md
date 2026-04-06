# 🦅 Áquila Pro
**A Plataforma Educacional de IA e SaaS Multi-Tenant**

Bem-vindo ao repositório principal do ecossistema Áquila. Este é o core web da nossa infraestrutura, desenhado para escalar escolas de ponta a ponta.

## 🚀 Sobre o Projeto
O Áquila Pro Cloud é o coração da plataforma para pais, alunos e administração, sendo construído sob o T3 Stack (Next.js, Tailwind, tRPC, PostgreSQL + Drizzle).

Nossa missão é combater a evasão, gerenciar finanças complexas (Pagamentos recorrentes e PIX) e facilitar a gestão escolar com inteligência artificial escalável. 

## ⚙️ Como Rodar Localmente
A estrutura de módulos (workspaces) é fluida. Para levantar a plataforma:

```bash
# 1. Instalar dependências (via pnpm)
pnpm install

# 2. Iniciar o Servidor de Desenvolvimento Web
pnpm run dev

# 3. Compilação para Produção
pnpm run build
```

## 🗺️ Mapa da Arquitetura (Dual-Core)
O Áquila opera em dois domínios isolados:
1. **[Este Repo] Plataforma Web (SaaS Cloud)**: Escala infinita (Multi-Tenant).
2. **Antigravity Kernel (Edge/Desktop)**: Aplicação local autônoma que vive dentro dos colégios e comanda Visão Computacional offline. (_Agora gerenciada em um repositório isolado e dedicado_).

### 📚 Documentação Essencial:
Acesse os links diretos para detalhes fundadores do projeto:
- 🏗️ [Arquitetura Deep Tech (ARCHITECTURE.md)](./ARCHITECTURE.md)
- 🗄️ [Schema T3 DB (DATABASE.md)](./DATABASE.md)
- 🛡️ [Compliance LGPD Nacional](./LGPD_COMPLIANCE_ANALYSIS.md)

---
*Construído com excelência para revolucionar centenas de escolas em Brasília e nacionalmente.*
