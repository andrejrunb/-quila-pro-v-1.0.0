# 🦅 Workflow: Auditoria de UI via DevTools MCP

Este workflow orienta o Agente (ou desenvolvedor assistido) na execução de auditorias reais de interface e performance no Áquila Pro usando o **Chrome DevTools MCP**.

## 🛠️ Ferramentas Utilizadas
- `chrome-devtools-mcp_new_page`: Iniciar auditoria.
- `chrome-devtools-mcp_lighthouse_audit`: Diagnóstico de SEO/Acessibilidade.
- `chrome-devtools-mcp_list_console_messages`: Captura de logs de erro.
- `chrome-devtools-mcp_take_screenshot`: Evidência visual.

---

## 📋 Passos de Execução

### 1. Inicialização
Abra a página alvo (Landing Page ou Portal Local).
> **Ação**: `new_page(url="...")`

### 2. Auditoria de Performance e Best Practices
Verifique se a interface "Elite" está otimizada.
> **Ação**: `lighthouse_audit(mode="navigation")`

### 3. Captura de Erros Silenciosos
Verifique se existem falhas de carregamento ou scripts quebrados no console.
> **Ação**: `list_console_messages()`

### 4. Teste de Responsividade e Visual
Tire screenshots em diferentes resoluções (Mobile/Desktop).
> **Ação**: `take_screenshot(fullPage=true)`

### 5. Report de Evidências
Consolide os achados em um artefato `audit_results.md`.

---

## 🎯 Caso de Uso: Landing Page
Para validar a Landing Page de Vendas:
1. Abrir `file:///c:/aquila/docs/60_Vendas_Marketing/landing-page/index.html`.
2. Rodar auditoria visual.
3. Verificar integridade dos links.
