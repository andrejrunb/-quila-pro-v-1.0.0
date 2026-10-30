# -*- coding: utf-8 -*-
"""
gpu_continuous_game_generator.py
Gera materiais gamificados contínuos (28 modalidades Wordwall)
cruzando as matrizes curriculares do SPE (Ciências 7º/8º ano) e Plurall (Física EM).
Alimenta:
1. Diretório local de jogos: apps/electron/src/database/generated_games/
2. Dataset de Fine-Tuning QLoRA: swarm/dataset/aquila_finetune_dataset.jsonl
"""

import json
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
GAMES_DIR = ROOT / "apps" / "electron" / "src" / "database" / "generated_games"
DATASET_PATH = ROOT / "swarm" / "dataset" / "aquila_finetune_dataset.jsonl"
BUNDLE_PATH = ROOT / "swarm" / "dataset" / "colab_sync_bundle.json"

GAMES_DIR.mkdir(parents=True, exist_ok=True)

# Catálogo de Jogos Inéditos Gerados Cruzando Wordwall x SPE x Plurall
GAME_DEFINITIONS = [
    {
        "id": "WW-CIEN7-ALAVANCAS-01",
        "title": "Classificação de Alavancas & Máquinas Simples",
        "templateType": "group_sort",
        "discipline": "Ciências",
        "grade": "7º Ano",
        "bnccSkillCode": "EF07CI01",
        "summary": "Separação de ferramentas em alavancas interfixas, inter-resistentes e interpotentes.",
        "payload": {
            "groups": [
                {"id": "interfixa", "title": "Alavanca Interfixa (Apoio no meio)"},
                {"id": "inter_resistente", "title": "Alavanca Inter-resistente (Resistência no meio)"},
                {"id": "interpotente", "title": "Alavanca Interpotente (Potência no meio)"}
            ],
            "items": [
                {"text": "Tesoura escolar", "groupId": "interfixa"},
                {"text": "Gangorra", "groupId": "interfixa"},
                {"text": "Alicate", "groupId": "interfixa"},
                {"text": "Carrinho de mão", "groupId": "inter_resistente"},
                {"text": "Quebra-nozes", "groupId": "inter_resistente"},
                {"text": "Abridor de garrafas", "groupId": "inter_resistente"},
                {"text": "Pinça", "groupId": "interpotente"},
                {"text": "Vara de pescar", "groupId": "interpotente"},
                {"text": "Cortador de unha", "groupId": "interpotente"}
            ]
        }
    },
    {
        "id": "WW-CIEN7-RIOSVOADORES-02",
        "title": "Perseguição em Labirinto: Rios Voadores da Amazônia",
        "templateType": "maze_chase",
        "discipline": "Ciências",
        "grade": "7º Ano",
        "bnccSkillCode": "EF07CI13",
        "summary": "Desafio de agilidade no labirinto atmosférico do ciclo da água.",
        "payload": {
            "stages": [
                {
                    "question": "Motor biótico que bombeia água para a atmosfera:",
                    "correct": "Evapotranspiração florestal amazônica",
                    "distractors": ["Queimadas sazonais", "Erosão fluvial", "Mineração"]
                },
                {
                    "question": "Barreira geográfica que deflete a umidade para o Centro-Oeste:",
                    "correct": "Cordilheira dos Andes",
                    "distractors": ["Chapada dos Guimarães", "Serra do Mar", "Mata Atlântica"]
                }
            ]
        }
    },
    {
        "id": "WW-CIEN8-ELETRICIDADE-03",
        "title": "Aviãozinho da Energia Elétrica & Consumo",
        "templateType": "airplane",
        "discipline": "Ciências",
        "grade": "8º Ano",
        "bnccSkillCode": "EF08CI04",
        "summary": "Voando pelas nuvens com cálculos corretos de potência e kWh.",
        "payload": {
            "targets": [
                {
                    "prompt": "Chuveiro 5.000 W ligado por 1 hora consome:",
                    "correct": "5,0 kWh",
                    "distractors": ["50 kWh", "500 kWh", "0,5 kWh"]
                },
                {
                    "prompt": "Dispositivo de segurança que desarma em sobrecarga:",
                    "correct": "Disjuntor termomagnético",
                    "distractors": ["Resistor ôhmico", "Voltímetro", "Interruptor simples"]
                }
            ]
        }
    },
    {
        "id": "WW-CIEN8-ZOOLOGIA-04",
        "title": "Classificação dos Vertebrados (Peixes a Mamíferos)",
        "templateType": "group_sort",
        "discipline": "Ciências",
        "grade": "8º Ano",
        "bnccSkillCode": "EF08CI07",
        "summary": "Separação dos 5 grupos de vertebrados pelas características fisiológicas.",
        "payload": {
            "groups": [
                {"id": "peixes", "title": "Peixes (Brânquias e Nadadeiras)"},
                {"id": "anfibios", "title": "Anfíbios (Pele úmida e Metamorfose)"},
                {"id": "repteis", "title": "Répteis (Ovo amniótico e Escamas)"},
                {"id": "aves", "title": "Aves (Penas, Bico e Ossos pneumáticos)"},
                {"id": "mamiferos", "title": "Mamíferos (Pelos e Glândulas mamárias)"}
            ],
            "items": [
                {"text": "Tubarão-martelo", "groupId": "peixes"},
                {"text": "Sapo-cururu", "groupId": "anfibios"},
                {"text": "Salamandra", "groupId": "anfibios"},
                {"text": "Jacaré-do-pantanal", "groupId": "repteis"},
                {"text": "Cascavel", "groupId": "repteis"},
                {"text": "Tucano-toco", "groupId": "aves"},
                {"text": "Onça-pintada", "groupId": "mamiferos"},
                {"text": "Baleia-jubarte", "groupId": "mamiferos"}
            ]
        }
    },
    {
        "id": "WW-EM-FIS-OPTICA-05",
        "title": "Imagem com Legenda: Espelhos Côncavos e Convexos",
        "templateType": "diagram_labeling",
        "discipline": "Física",
        "grade": "3ª Série EM",
        "bnccSkillCode": "EM13CNT205",
        "summary": "Identificação geométrica dos pontos notáveis dos espelhos de Gauss.",
        "payload": {
            "diagram": "optica_espelho_esferico",
            "pins": [
                {"name": "Vértice (V)", "desc": "Interseção do espelho com o eixo principal"},
                {"name": "Foco (F)", "desc": "Ponto médio: f = R/2"},
                {"name": "Centro de Curvatura (C)", "desc": "Centro da esfera que originou o espelho"}
            ]
        }
    },
    {
        "id": "WW-EM-FIS-GAMESHOW-06",
        "title": "Game Show dos Vestibulares: Ondulatória e Doppler",
        "templateType": "gameshow_quiz",
        "discipline": "Física",
        "grade": "3ª Série EM",
        "bnccSkillCode": "EM13CNT103",
        "summary": "Quiz de alta performance com cronômetro e cartas de ajuda.",
        "payload": {
            "questions": [
                {
                    "text": "Ao aproximar-se de uma fonte sonora fixa, a frequência ouvida pelo observador:",
                    "correct": "É maior que a frequência real emitida (som mais agudo).",
                    "distractor": "É menor que a frequência real (som mais grave)."
                },
                {
                    "text": "O fenômeno exclusivo das ondas transversais que não ocorre com o som é a:",
                    "correct": "Polarização.",
                    "distractor": "Refração."
                }
            ]
        }
    }
]

SYSTEM_PROMPT = """Você é a Inteligência Gamificada do Ecossistema Áquila Pro.
Sua missão é gerar e resolver atividades interativas lúdicas inspiradas nas mecânicas
do Wordwall (classificação em grupos, labirintos, aviãozinho, roleta, game show),
conectando a BNCC, os livros do SPE e a Física do Plurall de forma didática e motivadora."""

def main():
    # 1. Salvar os jogos individuais como JSON prontos para a Arena e o Front-End
    saved_games = 0
    for g in GAME_DEFINITIONS:
        game_file = GAMES_DIR / f"{g['id']}.json"
        game_file.write_text(json.dumps(g, indent=2, ensure_ascii=False), encoding="utf-8")
        saved_games += 1

    # 2. Alimentar o dataset SFT para treinamento contínuo das GPUs
    added_to_dataset = 0
    with open(DATASET_PATH, "a", encoding="utf-8") as f:
        for g in GAME_DEFINITIONS:
            user_prompt = f"Crie e estruture um jogo educacional da modalidade '{g['templateType']}' para o tema '{g['title']}' ({g['grade']} - {g['discipline']}), alinhado à habilidade {g['bnccSkillCode']} da BNCC."
            assistant_response = (
                f"### 🎮 Jogo Educativo Soberano: {g['title']}\n"
                f"- **Modalidade:** {g['templateType']}\n"
                f"- **Público:** {g['grade']} ({g['discipline']})\n"
                f"- **BNCC:** {g['bnccSkillCode']}\n"
                f"- **Objetivo Pedagógico:** {g['summary']}\n\n"
                f"```json\n{json.dumps(g['payload'], indent=2, ensure_ascii=False)}\n```\n"
                f"**Dinâmica de Aplicação:** Disponível localmente na Arena de Batalhas Gamificadas (PvP) e na Câmara de Maestria do Áquila Pro."
            )
            sample = {
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                    {"role": "assistant", "content": assistant_response}
                ]
            }
            f.write(json.dumps(sample, ensure_ascii=False) + "\n")
            added_to_dataset += 1

    # 3. Atualizar Bundle
    total_pairs = sum(1 for line in open(DATASET_PATH, "r", encoding="utf-8") if line.strip())
    if BUNDLE_PATH.exists():
        try:
            bundle = json.loads(BUNDLE_PATH.read_text(encoding="utf-8"))
            bundle["finetune_dataset_count"] = total_pairs
            bundle["generated_games_count"] = saved_games
            bundle["last_game_generator_sync"] = "WORDWALL_CANONICAL_28_MODALITIES"
            BUNDLE_PATH.write_text(json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass

    print(f"Sucesso! Gerados {saved_games} jogos no formato JSON em: {GAMES_DIR}")
    print(f"Inseridos +{added_to_dataset} pares gamificados no dataset SFT das GPUs.")
    print(f"Total consolidado no dataset SFT/QLoRA: {total_pairs} pares.")

if __name__ == "__main__":
    main()
