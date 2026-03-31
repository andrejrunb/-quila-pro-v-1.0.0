# Analysis: Awesome-LLM Strategic Resources for Áquila Pro

This document maps the best-of-breed resources from the `awesome-llm` repository to the specific needs of Áquila Pro's "Local Intelligence" mission.

## 1. Edge-AI Infrastructure (Privacy-First)
To maintain our 100% local processing commitment, the following models are prioritized for the next integration phase:
- **Phi-3 Mini (3.8B)**: Best-in-class reasoning for its size; chosen for the "Teacher Assistant" role in lesson planning.
- **Llama 3.2 (1B/3B)**: Optimized for extremely low-resource environments (e.g., small school servers).
- **Gemma 2 (2B)**: High-quality output for automated student behavior reports.

## 2. Multimodal Intelligence (Teacher Hub & Security)
Essential for whiteboard analysis and real-time security events:
- **Qwen2-VL**: Superior OCR and document understanding for the `Whiteboard Vision` module.
- **Llama 3.2 Vision**: Advanced spatial reasoning for the `Security Swarm` (identifying non-authorized persons or abandoned objects).

## 3. Orchestration & Safety (The "Swarm" Layer)
Frameworks to manage the multi-agent nature of Áquila Pro:
- **Langroid / CAMEL**: Technical backbone for the `Security Swarm` (Phase 1200), allowing the "Guard Agent" and "Pedagogical Agent" to collaborate without collision.
- **Guardrails.ai**: Mandatory layer to ensure AI-generated pedagogical content follows school-specific ethics and safety guidelines.

## 4. RAG & Knowledge (Local Brain)
- **Embeddedchain**: To be used for creating a local knowledge base of school manuals, BNCC guidelines, and internal protocols, making the "Teacher IQ" truly context-aware.

---
*Generated based on analysis of https://github.com/hannibal046/awesome-llm*
