---
description: Execução do Zero-Bypass Structural Audit para estabilidade da v1.0.0.
---

# Zero-Bypass Structural Audit Workflow

Este workflow deve ser executado antes de qualquer release ou quando houver erros de compilação/lint persistentes.

## Passos

1. **Análise de Lints Estáticos**
   - Rodar `npx tsc --noEmit` para identificar erros de tipagem.
   - Analisar logs de lint do projeto (ESLint/MarkdownLint).

2. **Auditoria de Singletons & Instâncias**
   - Verificar se as classes de serviço (ex: `Database`, `Logger`) estão sendo acessadas via instâncias singleton e não instanciadas múltiplas vezes.

3. **Verificação de Tipagem em Testes**
   - Corrigir erros de "undefined" em parâmetros obrigatórios (comum em mocks de banco de dados).

4. **Relatório de Integridade**
   - Listar todos os arquivos com erros persistentes.
- Propor correções automáticas para erros de tipagem simples.

5. **Execução de Correção Automática (Opcional)**
- Corrigir mocks em arquivos de teste que falham por tipagem incompleta.
