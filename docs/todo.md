# Project TODO

## Contatos e Dados Pessoais
- [x] Atualizar telefone em todas as páginas (55 61 99962-3099)
- [x] Atualizar email em todas as páginas (andrejrunb@yahoo.com.br)
- [x] Atualizar WhatsApp em todas as páginas
- [x] Atualizar dados no Footer
- [x] Atualizar dados no Contato
- [x] Atualizar dados no FAQ
- [x] Atualizar dados no Seguranca
- [x] Atualizar dados no TemplatesPanel
- [x] Atualizar dados no contact-routes.ts
- [x] Atualizar dados no twilio.ts
- [x] Atualizar dados no sendgrid.ts

## 8 Itens de Implementação
- [x] Item 1: Atualizar dados de contato em todas as páginas
- [x] Item 2: Criar Landing Page de Vendas (Vendas.tsx)
- [x] Item 3: Portal Web para Pais (PortalPais.tsx)
- [x] Item 4: Dashboard Executivo (ExecutiveDashboard.tsx)
- [x] Item 5: Integração com SIS (sis-integration.ts)
- [x] Item 6: Mobile App para Coordenadores (MobileApp.tsx)
- [x] Item 7: Sistema de Notificações por Email (email-notifications.ts)
- [x] Item 8: Analytics Avançado com BI (AnalyticsDashboard.tsx)

## Sistema Multi-Agentes
- [x] Criar configuração de 8 agentes especializados (MULTI_AGENT_CONFIGURATION.md)

## Rotas
- [x] Adicionar rota /vendas
- [x] Adicionar rota /admin/executive
- [x] Adicionar rota /admin/analytics
- [x] Adicionar rota /portal-pais
- [x] Adicionar rota /mobile-app

## Navegação
- [x] Adicionar link Vendas no menu principal
- [x] Adicionar link Portal dos Pais no menu principal
- [x] Adicionar link Aplicativo Móvel no menu principal

## Portal dos Pais - Autenticação
- [x] Criar schema de banco de dados para pais (parents table)
- [x] Criar routers tRPC para autenticação de pais (login, cadastro, recuperação)
- [x] Criar página de Login do Portal dos Pais
- [x] Criar página de Cadastro do Portal dos Pais
- [x] Criar dashboard autenticado do Portal dos Pais
- [x] Testes automatizados para autenticação de pais

## Rotas Portal dos Pais
- [x] Adicionar rota /portal-pais/login
- [x] Adicionar rota /portal-pais/cadastro
- [x] Adicionar rota /portal-pais/dashboard

## Novas Funcionalidades (3 itens)
- [ ] Formulário de orçamento funcional na página de Vendas (envio para andrejrunb@yahoo.com.br)
- [x] Recuperação de senha por email no Portal dos Pais (token expira em 1h)
- [x] Página de Termo LGPD com assinatura digital no cadastro do Portal dos Pais

## Instalador Desktop (Electron)
- [x] Auditar arquivos existentes do Electron
- [x] Criar/atualizar package.json do Electron com dependências
- [x] Criar electron-builder.yml para gerar .exe
- [x] Criar main.ts completo (janela principal, tray, auto-update)
- [x] Criar preload.ts (bridge IPC seguro)
- [x] Criar scripts de build (dev, build, package)
- [x] Criar documentação de instalação para escola
- [x] Criar script de setup inicial (primeiro uso)

## Diretrizes Áquila Core
- [x] Salvar diretrizes AQUILA_CORE_DIRECTIVES.md no projeto
- [ ] Formulário de orçamento funcional na página de Vendas (envio para andrejrunb@yahoo.com.br)
- [x] Recuperação de senha por email no Portal dos Pais (token expira em 1h)
- [x] Página de Termo LGPD com assinatura digital no cadastro do Portal dos Pais
- [ ] Validar conformidade LGPD (criptografia de embeddings, exclusão de dados, consentimento)
- [ ] Otimizar performance (latência < 500ms, fps > 15, precisão > 99%)
- [ ] Documentar arquitetura e decisões técnicas

## Continuação da Implementação
- [ ] Formulário de orçamento funcional na Vendas (envio de email para andrejrunb@yahoo.com.br via SendGrid)
- [ ] Gerenciamento de consentimentos LGPD no Dashboard do Portal dos Pais (visualizar, revogar consentimentos)
- [ ] Painel Admin para gerenciar orçamentos recebidos (CRM básico com status, notas, filtros)
- [ ] Documentação de arquitetura e decisões técnicas (ARCHITECTURE.md)
- [ ] Testes automatizados para novas funcionalidades

## Build do Aplicativo Desktop (.exe)

- [x] Revisar e completar configurações do electron-builder.yml para Windows
- [x] Criar ícone .ico e .png profissional para o aplicativo desktop
- [x] Criar package.json dedicado do Electron com scripts de build
- [x] Criar workflow GitHub Actions para build automático do .exe
- [x] Criar guia completo de compilação manual para Windows (GUIA_COMPILACAO_WINDOWS.md)
- [x] Integrar todas as páginas existentes no App.tsx (remover placeholders)
- [ ] Exportar projeto para repositório GitHub (ação manual pelo usuário)

## Correção de Envio de Emails

- [x] Diagnosticar e corrigir erro no formulário de contato (bug insertId corrigido)
- [x] Diagnosticar e corrigir erro no formulário de orçamento (notifyOwner como canal principal)
- [x] Verificar configuração da API key do SendGrid (chave válida, SG.qCIhqI8...)
- [ ] Verificar Sender Identity no SendGrid (requer ação manual do usuário em app.sendgrid.com)

## Novo Logotipo (Águia)
- [x] Processar logo PNG para formatos web (favicon, navbar, hero)
- [x] Aplicar logo no site (navbar, favicon, hero, footer)
- [x] Atualizar ícone do app desktop (.ico) com o novo logo
