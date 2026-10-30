import json
import os
import re
from collections import defaultdict

def generate_handbook():
    with open("docs/conversations_mining_summary.json", "r", encoding="utf-8") as f:
        conversations = json.load(f)
        
    print(f"Loaded {len(conversations)} conversations.")
    
    # Sort conversations chronologically
    def get_time(c):
        return c.get("first_time") or "1970-01-01"
    
    conversations.sort(key=get_time)
    
    # Categorization buckets
    timeline_entries = []
    topics_map = defaultdict(list)
    key_artifacts = []
    
    # Keywords to detect topics
    topic_keywords = {
        "Arquitetura & Electron": ["electron", "main.js", "renderer", "vite", "preload", "ipc", "build:electron"],
        "Biometria & Visão Edge": ["face", "biometria", "npu", "insightface", "embedding", "reconhecimento", "catraca"],
        "GPU & Treinamento Colab A100": ["colab", "a100", "gpu", "lora", "fine-tuning", "finetune", "sft", "bf16"],
        "Pedagogia, TRI & BNCC": ["saeb", "tri", "bncc", "enem", "vestibular", "descritores", "pedagogico", "scaffolding"],
        "Gamificação & Cosméticos": ["gamificacao", "arena", "pvp", "cosmeticos", "avatar", "wordwall", "youtube", "loja"],
        "Portais EdTech & REA": ["positivo", "plurall", "brisk", "wordwall", "archive", "top-mcps", "rea"],
        "Governança, LGPD & Leis": ["lgpd", "eca", "lei", "direitos", "parecer", "auditoria", "zero-bypass", "quarentena"],
        "Rede P2P & Resiliência": ["p2p", "mesh", "offline", "sync", "termica", "throttling", "websocket"]
    }
    
    for c in conversations:
        cid = c["id"]
        ftime = c.get("first_time") or "Data desconhecida"
        prompts = c.get("user_prompts", [])
        artifacts = c.get("artifacts", [])
        
        if prompts or artifacts:
            summary_prompt = prompts[0]["text"] if prompts else "Sessão automatizada ou subagente"
            summary_prompt = re.sub(r"\s+", " ", summary_prompt)[:150]
            timeline_entries.append({
                "id": cid[:8],
                "full_id": cid,
                "date": ftime[:10] if len(ftime) >= 10 else ftime,
                "first_prompt": summary_prompt,
                "prompts_count": len(prompts),
                "artifacts_count": len(artifacts)
            })
            
        for a in artifacts:
            fname = a["filename"]
            title = a["title"]
            if any(k in fname.lower() for k in ["homologacao", "plano", "auditoria", "parecer", "guia", "manifesto", "blueprint", "arquitetura"]):
                key_artifacts.append({
                    "conv_id": cid[:8],
                    "filename": fname,
                    "title": title
                })
                
        # Tag topics based on prompts and artifacts
        all_text = " ".join([p["text"] for p in prompts] + [a["title"] + " " + a["snippet"] for a in artifacts]).lower()
        for topic, kws in topic_keywords.items():
            if any(k in all_text for k in kws):
                topics_map[topic].append(cid[:8])

    print("Generating comprehensive Master Guidelines Markdown...")
    
    md_content = f"""# 🦅 Áquila Pro — Enciclopédia & Guia Mestre de Orientações (/compact)
**Síntese Arquitetural, Histórica e Operacional de 121 Conversas do Projeto**  
*Data de Compilação: 29 de Outubro de 2026 | Sistema Operacional: Windows | Workspace: `c:\\aquila`*

---

## 📌 Sumário Executivo (/compact)
Este documento é o repositório consolidado de **todas as decisões, regras de negócio, especificações pedagógicas, arquiteturas de código, modelos de IA e diretrizes de governança** acumuladas ao longo de mais de 100 sessões e 865 comandos do usuário no projeto **Áquila Pro (Escola Soberana OS v2.1 / v3.0)**.

Ele serve como o manual definitivo para qualquer nova sessão do Antigravity, eliminando amnésia de contexto e garantindo aderência absoluta à **Constituição Áquila (AGENTS.md)** e às preferências do usuário.

---

## 🏛️ 1. Arquitetura do Sistema & Stack Tecnológica

O Áquila Pro é um **Sistema Operacional Escolar Soberano (Local-First & Edge-Resilient)** concebido para operar em escolas públicas e privadas brasileiras, combinando software desktop de missão crítica, inteligência artificial local e aceleradores em nuvem controlada.

### A. Componentes do Monorepo (`c:\\aquila`)
- **`apps/electron`**: Aplicação Desktop principal (Electron 30+ / Vite / React 18 / Tailwind CSS).
  - Processo Principal (`src/main.ts`, `src/preload.ts`): Gerencia IPC seguro, ciclo de vida do SO, janelas, SQLite local e monitoramento de hardware.
  - Renderer (`src/ui/`): Cockpits e Portais (Gestor, Professor, Aluno, Portaria, Responsáveis).
- **`apps/web`**: Portal Web complementar em Next.js (Dashboard administrativo e espelho de consultas).
- **`apps/mobile`**: Aplicação React Native / Expo para comunicação com responsáveis e alunos.
- **`swarm/`**: Infraestrutura de orquestração multiagente, datasets de fine-tuning (`aquila_finetune_dataset.jsonl`), scripts de benchmark e embeddings.
- **`colab/`**: Notebooks de treinamento e aceleração GPU (`aquila_a100_neural_engine.ipynb` para A100-80GB SXM4).
- **`acervo/`**: Repositório seguro e curado de mídias e fontes históricas (Internet Archive, livros, mapas, áudios com quarentena e integridade SHA-256).

### B. Bases de Dados SQLite (Local-First com WAL Mode)
O ecossistema Áquila rejeita bancos centralizados vulneráveis e opera com bases SQLite segregadas e criptografadas:
1. **`aquila.db`** (`apps/electron/dist/database/`): Usuários, matrículas, turmas, presenças biométricas, permissões e trilha `zero_bypass_audits`.
2. **`pedagogical_scaffolding.db`**: Motor psicométrico TRI, descritores SAEB/BNCC, banco de questões oficiais de vestibulares (ENEM, FUVEST, UNICAMP, ITA) e histórico adaptativo de aprendizagem.
3. **`aquila_knowledge_vec.db`**: Armazenamento vetorial de embeddings 512-D para busca semântica RAG e agrupamento conceitual.
4. **`acervo_multimodal_archive.db`**: Metadados, procedência, evidências legais (Lei 9.610/98 Art. 41) e índices de páginas/áudios do Internet Archive.

---

## 🧠 2. Inteligência Artificial, Hardware & GPUs

### A. Regra Soberana de Distribuição de Cargas (Constituição Rule 5)
- **Proibição de Processamento Monolítico:** O agente orquestrador nunca executa tarefas pesadas em sua própria CPU (auditorias massivas, treinamento de modelos, OCR de milhares de páginas).
- **Google Colab Pro (NVIDIA A100-80GB SXM4):** Treinamento de adaptadores LoRA BF16 ($r=16, \\alpha=32$), quantização QLoRA e tarefas intensivas matriciais.
- **Edge NPU (26 TOPS):** Inferência local de visão computacional em catracas e câmeras escolares.
- **Auto-Throttling Térmico (`SovereignResilienceService`):** Se a temperatura da CPU/NPU ultrapassar 75ºC, a taxa de amostragem de visão reduz automaticamente de 30 FPS para 10 FPS até a normalização térmica.

### B. Biometria Facial Soberana (One-Way Embedding 512-D)
- Nenhum dado biométrico cru (fotos faciais de estudantes) sai do servidor local ou é persistido sem hash.
- O modelo extrai um vetor unidirecional de 512 dimensões (Cosine Similarity threshold > 0.68 para validação de acesso).
- Proteção criptográfica AES-256-GCM / Windows DPAPI.

---

## 📚 3. Motor Pedagógico, TRI & Integrações EdTech

### A. Teoria de Resposta ao Item (TRI) & SAEB/BNCC
- Implementado em `PedagogicalTriEngine.ts`.
- Estimação de proficiência latente $\\theta$ (-4.0 a +4.0), convertida para a escala SAEB (Média 250, DP 50) e ENEM (Média 500, DP 100).
- Análise de consistência e detecção de chutes atípicos (Análise de Guttman e resíduos padronizados $z_i$).
- Diagnóstico automatizado por descritores SAEB (`descriptorCode`, `accuracyPct`, `masteryLevel`).

### B. Portais Integrados & Extração REA
1. **Positivo On & Plurall:**
   - Ingestão de questões de vestibulares (itens públicos sob a Lei 9.610/98 Art. 8º, IV).
   - Purga total de layouts e folhas de estilo proprietárias dos editores.
2. **Brisk Teaching:**
   - Adaptação das rotinas de feedback formativo ("Glows", "Grows" e "Next Steps") para a realidade pedagógica da BNCC.
3. **Wordwall (`WordwallGameEngine` & `WordwallInteractivePlayer`):**
   - 18 modalidades de jogos pedagógicos dinâmicos (Quiz, Abra a Caixa, Roleta, Caça-Palavras, Associação, etc.).
   - Integração com a Câmara de Maestria do Aluno.
4. **Internet Archive (`archive.org`):**
   - Adaptador oficial via endpoints `/advancedsearch.php` e `/metadata/{{id}}` (zero scraping cego).
   - Quarentena obrigatória com checksum SHA-256 antes da promoção para o acervo aprovado.
   - Avaliação rigorosa da Lei 9.610/98 Art. 41 (70 anos post-mortem para domínio público).

---

## 🎮 4. Gamificação, Câmara de Maestria & Experiência do Aluno

- **Student Mastery Chamber (`StudentMasteryChamber.tsx`):**
  - Arena PvP para resolução cronometrada de desafios.
  - Alternador de templates interativos (Quiz, Wordwall Games, Flashcards).
  - Reprodutor de mídia educacional integrado (vídeos YouTube selecionados e audiolivros de literatura).
- **Sistema de Recompensas & Cosméticos:**
  - Moedas escolares (Áquila Coins) ganhas por assiduidade, resolução de itens difíceis na TRI e comportamento exemplar.
  - Loja de avatares, bordas e títulos honoríficos.

---

## ⚖️ 5. Governança Legal, Privacidade & ECA Digital

1. **LGPD Art. 14 (Crianças e Adolescentes):**
   - Tratamento de dados no melhor interesse da criança.
   - Verificação obrigatória da matriz de consentimento parental antes de qualquer ativação biométrica.
2. **Lei 9.610/98 (Direitos Autorais):**
   - **Art. 8º, IV:** Questões de concursos e exames oficiais públicos (ENEM, FUVEST, UNICAMP, ITA) não são objeto de proteção autoral patrimonial.
   - **Art. 41:** Obras caem em domínio público 70 anos após 1º de janeiro do ano subsequente à morte do autor (ex: Machado de Assis [†1908 ➔ DP 1979], Maria Firmina dos Reis [†1917 ➔ DP 1988]).
   - **Art. 46:** Citação de trechos para fins pedagógicos é permitida com indicação clara de fonte e autoria.
3. **Trilha Zero-Bypass (`zeroBypassAuditService`):**
   - Toda mutação sensível de estado é registrada com timestamp ISO, identificador do usuário e hash SHA-256.

---

## 🛠️ 6. Histórico de Problemas Críticos & Soluções Comprovadas

| Sintoma / Erro Encontrado | Causa Raiz | Correção Definitiva Aplicada |
| :--- | :--- | :--- |
| **Vite Build Error (`Unexpected "\a"`)** | Substituição regex em Python gerou caractere ASCII bell (`\\x07`) na string `\\arena-template-btn`. | Script Python dedicado com leitura de strings exatas e sem escape acidental de barras. |
| **Plurall GraphQL Downstream Error** | A query `Questions` no Apollo falhou em disciplinas combinadas. | Migração para a query `Contents(supertypes: ["activity"])` indexada no OpenSearch (740k+ itens). |
| **TypeScript TS2551 / TS2339 no Engine TRI** | Propriedades `descriptorId` e `accuracyPercentage` foram usadas em vez de `descriptorCode` e `accuracyPct`. | Ajuste estático nas linhas 1054-1061 de `PedagogicalTriEngine.ts`. |
| **Falha de Aspas no PowerShell** | Comandos `python -c "..."` com aspas duplas internas quebraram no terminal do Windows. | Criação mandatória de scripts `.py` em `scripts/` e execução via `python scripts/<nome>.py`. |
| **Quota 429 com Modelos Pesados** | Lançamento simultâneo de múltiplos subagentes grandes esgotou a cota. | Execução sequencial ou script local Python para tarefas de mineração e análise de dados. |

---

## 📋 7. Cronologia & Mapa de Tópicos das 121 Conversas

### Distribuição Temática
"""
    for topic, cids in topics_map.items():
        md_content += f"- **{topic}**: {len(cids)} conversas envolvidas ({', '.join(cids[:10])}...)\n"

    md_content += f"""
### Amostra de Marcos Históricos (Sessões Principais)
| Conversa | Data | Pedido / Foco do Usuário | Resultado Entregue |
| :--- | :---: | :--- | :--- |
"""
    # Pick 25 key timeline moments spread across the timeline
    step = max(1, len(timeline_entries) // 25)
    sample_timeline = timeline_entries[::step][:25]
    for e in sample_timeline:
        md_content += f"| `{e['id']}` | {e['date']} | {e['first_prompt']} | {e['artifacts_count']} artefatos gerados ({e['prompts_count']} turnos) |\n"

    md_content += """
---

## 🎯 8. Diretrizes Permanentes para Próximas Sessões (/compact)

1. **Local-First & Segurança Absoluta:** Nunca exporte bancos de dados, chaves de API ou segredos. Mantenha credenciais no `.env` ou Windows DPAPI.
2. **Validação Contínua de Build:** Toda alteração no Electron deve ser seguida por verificação de tipos e compilação limpa (`npm run build:electron` e `npm run build:renderer`).
3. **Respeito aos Direitos & Governança:** Obras adicionadas ao acervo devem ter ficha de evidência de direitos preenchida no SQLite `acervo_multimodal_archive.db` antes de qualquer uso.
4. **Respostas em Modo Caveman:** Comunicação técnica, sem enrolação, links markdown clicáveis (`file:///`) e métricas objetivas.
"""

    out_file = "docs/GUIA_MESTRE_ORIENTACOES_ACERVO_CONVERSAS_AQUILA.md"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(md_content)
        
    print(f"Master Handbook generated successfully: {out_file}")
    return out_file, md_content

if __name__ == "__main__":
    generate_handbook()
