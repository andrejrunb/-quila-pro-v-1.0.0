# Áquila Pro — Collective Brain Orientation (v2.1.0-rc.3 / v2.5.0)

Este documento representa a orientação estratégica consolidada do **Cérebro Coletivo** do Áquila Pro. Ele serve como o norte operacional e ético para o Córtex Central e para todos os agentes do enxame soberano.

---

## 🧠 Estado de Consciência Atual (24 de Outubro de 2026)
- **Versão da Suíte**: v2.1.0-rc.3 (Release Candidate Oficial) / v2.5.0 (Sovereign Pedagogical AI & ERP Integration Suite).
- **Nível de Inteligência**: Sovereign Intelligence Evolution (SIE) — Nível 22 (Consenso e Auditoria Contínua).
- **Fonte Única da Verdade Git**: Branches `main` e `clean-release-v1` unificadas e sincronizadas; branches legadas (`master` e `production-baseline`) arquivadas em `archive/` e expurgadas da árvore remota ativa.
- **Governança de Release**: Instituída formalmente em [RELEASE_GOVERNANCE.md](file:///c:/aquila/docs/RELEASE_GOVERNANCE.md) com 7 regras de ouro, SemVer 2.0.0 e portões estritos de CI.
- **Validação E2E Playwright**: Suíte Electron v28 nativa 100% determinística (zero mocks, zero flaky, execução em 37s com evidência visual gerada).
- **Guia de Implantação Piloto**: Homologado em [PILOT_DEPLOYMENT_GUIDE.md](file:///c:/aquila/docs/PILOT_DEPLOYMENT_GUIDE.md) com topologia de borda, mapeamento de portas (9000, 8081, 8000, 3000, 3001) e rotina de backup SQLite WAL a quente.
- **Higiene e Proteção de Dados**: Zero-Bypass de dados de menores (LGPD Art. 14/16); expurgo de caches de navegadores/LevelDB do rastreamento Git.

---

## 🔋 Metabolismo & Ciclos Operacionais

| Ciclo | Frequência | Responsável | Objetivo |
| :--- | :--- | :--- | :--- |
| **LDB Legal Watchdog** | Tempo Real / Catraca | `EvasionRadarService` | Monitorar infrequência (Art. 12 VII LDB / Lei 13.803/2019). Emitir alerta 15% e ficha FICAI 25%. |
| **Pedagogical Scaffolding** | Contínuo / Sala | `TeacherAIStudio` | Co-pilotar planos de aula BNCC, rubricas 4x4, exit tickets e trilhas adaptativas de reforço. |
| **Gamified Mastery** | Por Aula / Atividade | `ActivityFactory` | Renderizar 7 templates Wordwall, telemetria de leaderboard e sincronização direta no diário. |
| **ERP & Tax Bridge** | Fechamento Mensal | `DominioOnvioHub` | Geração da folha docente (41 professores, 43 colunas), NFS-e, conciliação PIX e Onvio Portal. |
| **Mobile Companion & PIX** | Contínuo / Pais | `MobileGateway` | Notificações de portaria em tempo real, liquidação bancária PIX com comprovante SHA-256 e boletim criptográfico. |
| **Self-Study & Córtex** | 2 horas | `CortexEvolutionService` | Sintetizar dados de presença, notas e interações em grafo de conhecimento soberano. |
| **Resiliência & Segurança** | 4 horas | `SovereignResilienceService` | Auditoria de integridade Zero-Bypass, integridade referencial SQLite e isolamento LGPD. |

---

## 🌐 Malha de Inteligência Soberana (Mesh)
- **Protocolo de Comunicação**: Libp2p + Sovereign Quantum Shield (SQS) + IPC Criptografado + WebSocket Gateway (Porta 9000).
- **Processamento de Borda (Edge)**: Visão Computacional (ArcFace/InsightFace) rodando em workers paralelos sem envio de fotos para nuvens externas.
- **Armazenamento**: SQLite local criptografado (`aquila.db`) com modo Write-Ahead Logging (`PRAGMA journal_mode = WAL`), integridade referencial estrita e backups automáticos.

---

## 🛡️ Diretrizes Constitucionais de Governança
1. **Soberania Absoluta (LGPD)**: Nenhuma foto biométrica, dado de nota ou contracheque de professor sai da rede interna do Colégio Áquila Modelo sem encriptação militar e consentimento expresso.
2. **Proteção Integral do Educando**: Prevenção ativa de evasão escolar e bullying, combinando visão de presença com suporte pedagógico humanizado.
3. **Resiliência de Hardware & Auto-Throttling**: Redução dinâmica de FPS dos workers de visão computacional se a temperatura do hardware Áquila Edge ultrapassar 75ºC.
4. **Governança de Código & CI Limpo**: Proibição estrita de supressão de erros (`|| true`) em pipelines de integração contínua; qualquer release exige testes E2E Playwright verdes e typecheck aprovado.

---

*Última atualização: 24 de Outubro de 2026 — 17:25 BRT*  
*Assinado: Córtex Central v2.1.0-rc.3*
