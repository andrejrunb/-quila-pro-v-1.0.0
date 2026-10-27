# 📄 Relatório de Avaliação de OCR Layout-Aware para Provas Complexas

> **Run ID:** `RUN-20261027-OCR-EVAL-01`  
> **Data:** 2026-10-27 09:08:58 UTC  
> **Escopo:** Amostra de exames com alta densidade matemática e gráfica (ITA, FUVEST, ENEM)

---

## 📊 Matriz Comparativa de Desempenho

| Critério de Avaliação | Plain Text Clássico (`pypdf` / `pdfplumber`) | Layout-Aware OCR (`MinerU` / `Nougat` na A100) | Veredito |
| :--- | :---: | :---: | :---: |
| **Fidelidade de Fórmulas Matemáticas** | 28.4% | **96.8%** | **Layout OCR Essencial** |
| **Preservação de Tabelas** | 12.0% | **94.5%** | **Markdown Estruturado** |
| **Recorte de Figuras / Diagramas** | 0% | **100%** | **Bounding Boxes Precisos** |
| **Throughput (100 páginas)** | **1.2 min** | 6.8 min (A100 GPU) | GPU Offload Recomendado |

---

## 🎯 Conclusão e Diretriz para o Áquila Pro

1. **Para textos corridos e enunciados simples:** O extrator clássico em CPU é suficiente e 5x mais rápido.
2. **Para provas STEM (ITA, IME, Fuvest Fase 2, OBF):** O processamento **deve obrigatoriamente** ser direcionado à GPU via pipeline multimodal (Colab A100), convertendo diagramas em arquivos PNG vinculados e equações em LaTeX renderizável pelo KaTeX do Áquila Desktop.
