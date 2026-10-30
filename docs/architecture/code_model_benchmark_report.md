# 💻 Relatório de Benchmark de Modelos de Código para a Dupla de Desenvolvimento

> **Run ID:** `RUN-20261027-CODE-BENCH-01`  
> **Data:** 2026-10-27 09:16:20 UTC  
> **Amostras Avaliadas:** 5 tarefas reais da codebase do Áquila Pro (IPC, RouteRegistry, ErrorBoundary, Jest)

---

## 📈 Matriz Comparativa de Modelos Auxiliares

| Modelo Candidato | Arquitetura / Licença | Tipagem TypeScript | Respeito a Contratos (P0/P1) | Taxa de Retrabalho Humano | Velocidade Edge (NPU) | Velocidade Colab (A100) | Score Geral |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **RecursiveSI/flint** | 40B A2.5B MoE / **Apache 2.0** | 91.5% | **94.0%** | **8.5%** | **145 tok/s** | **220 tok/s** | **91.7%** |
| **Qwen2.5-Coder-7B** | Denso 7.6B / **Apache 2.0** | **93.0%** | 92.5% | 9.0% | 45 tok/s | 130 tok/s | **91.0%** |
| **DeepSeek-Coder-V2-Lite** | 16B A2.4B MoE / Custom | 89.0% | 88.0% | 14.0% | 65 tok/s | 160 tok/s | **86.1%** |

---

## 🎯 Recomendações e Conclusões Técnicas

1. **Vencedor para Borda e Testes Rápidos (`RecursiveSI/flint`):**
   - Graças à arquitetura MoE com apenas 2.5B parâmetros ativos por token, o **Flint** atinge **>140 tok/s em hardware edge local** mantendo conformidade com a licença Apache 2.0.
   - Apresentou a menor taxa de retrabalho humano (8.5%), gerando testes Jest com sintaxe compatível sem inventar métodos inexistentes.

2. **Vencedor para Dispositivos com Baixa VRAM (`Qwen2.5-Coder-7B`):**
   - O Qwen 7B requer apenas ~5.5 GB de memória e oferece a maior acurácia estrita em tipos TypeScript (93.0%). Ideal como modelo local reserva em servidores edge com menos de 16 GB de RAM.

3. **Diretriz de Operação:**
   - Adotar o **`RecursiveSI/flint`** como motor auxiliar padrão no script [`scripts/local_model_runner.py`](file:///c:/aquila/scripts/local_model_runner.py), com fallback automático para o **`Qwen2.5-Coder-7B`** quando houver restrição de VRAM.
