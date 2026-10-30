# -*- coding: utf-8 -*-
"""
feed_curriculum_spe8_and_prepara.py
Ingere a matriz de Ciências 8º Ano (16 Capítulos) e Física Prepara Positivo (64 Capítulos)
no dataset de Fine-Tuning SFT/QLoRA para as GPUs NVIDIA e Colab Pro A100.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = ROOT / "swarm" / "dataset" / "aquila_finetune_dataset.jsonl"
BUNDLE_PATH = ROOT / "swarm" / "dataset" / "colab_sync_bundle.json"

SYSTEM_PROMPT = """Você é a Inteligência Pedagógica Soberana do Ecossistema Áquila Pro.
Sua missão é orientar docentes e estudantes com rigor científico, fundamentação na BNCC,
parâmetros psicométricos da Teoria de Resposta ao Item (TRI 3PL) e resoluções socráticas."""

NEW_PAIRS = [
    {
        "user": "Qual é a estrutura dos 4 volumes de Ciências do 8º Ano no Sistema Positivo de Ensino (SPE) adotada no Áquila Pro?",
        "assistant": (
            "A matriz de Ciências do 8º Ano SPE é estruturada em 4 volumes (16 capítulos) alinhados à BNCC:\n"
            "1. Volume 1 (Astronomia & Climatologia): Modelos cosmológicos, movimentos da Terra e Lua (eclipses/estações), fatores climáticos e previsão do tempo (EF08CI12 a EF08CI16).\n"
            "2. Volume 2 (Eletricidade & Sustentabilidade): Circuitos elétricos, tipos de energia, geração em usinas e cálculo de consumo em kWh (EF08CI01 a EF08CI05).\n"
            "3. Volume 3 (Vida & Sexualidade): Reprodução sexuada e assexuada, reprodução humana e ISTs, reinos Monera, Protoctista e Fungi (EF08CI06 a EF08CI11).\n"
            "4. Volume 4 (Zoologia Geral): Invertebrados I (poríferos a nematelmintos), Invertebrados II (moluscos a equinodermos), Vertebrados I (peixes a répteis) e Vertebrados II (aves e mamíferos) (EF08CI07)."
        )
    },
    {
        "user": "Como se calcula o consumo de energia elétrica de um aparelho em kWh e seu custo na fatura escolar ou residencial (EF08CI04)?",
        "assistant": (
            "O consumo de energia elétrica é calculado pelo produto da potência em quilowatts (kW) pelo tempo de operação em horas (h):\n"
            "$$E = P_{\\text{kW}} \\times \\Delta t_{\\text{horas}}$$\n"
            "1. Conversão de Watts para kW: divide-se a potência nominal por 1.000 ($P = 5.000\\text{ W} = 5\\text{ kW}$).\n"
            "2. Tempo acumulado: se opera $1\\text{ h/dia}$ durante 30 dias, $\\Delta t = 30\\text{ horas}$.\n"
            "3. Energia total: $E = 5\\text{ kW} \\times 30\\text{ h} = 150\\text{ kWh}$.\n"
            "4. Custo financeiro: multiplica-se pelo valor da tarifa (ex: R$ 0,80/kWh): $150 \\times 0,80 = \\text{R\\$ } 120,00$."
        )
    },
    {
        "user": "Como é dividida a coleção de Física Prepara Positivo (Extensivo e Intensivo) para a 3ª série do Ensino Médio?",
        "assistant": (
            "A coleção de Física Prepara Positivo para a 3ª Série é dividida em duas frentes complementares:\n"
            "- Prepara Extensivo (64 Capítulos):\n"
            "  * Frente 1 (Mecânica e Termologia): Cinemática Vetorial, Dinâmica de Newton, Estática, Energia/Trabalho, Gravitação, Hidrostática de Arquimedes e Leis da Termodinâmica (32 capítulos).\n"
            "  * Frente 2 (Ondulatória, Eletricidade e Moderna): Óptica Geométrica de Gauss, Acústica e Doppler, Circuitos de Kirchhoff, Eletromagnetismo, Relatividade e Física Quântica (32 capítulos).\n"
            "- Prepara Intensivo (40 Capítulos Condensados):\n"
            "  * Frentes 1 e 2 condensadas para revisão de alto rendimento no 2º semestre pré-ENEM e vestibulares de Medicina."
        )
    },
    {
        "user": "Resolva a questão TRI-FUND2-CIEN8-01 sobre a geometria dos eclipses solares e lunares.",
        "assistant": (
            "Enunciado: Identificar a fase lunar obrigatória para a ocorrência de um eclipse solar total.\n"
            "Resolução Socrática:\n"
            "1. Geometria do Eclipse Solar: Sol — Lua — Terra. A Lua interpõe-se entre o Sol e a Terra, bloqueando a luz solar e projetando os cones de umbra e penumbra na superfície terrestre.\n"
            "2. Posição Orbital: Para que a face iluminada da Lua esteja voltada inteiramente para o Sol e a face escura para a Terra, a Lua está em conjunção astronômica, o que define estritamente a fase de Lua Nova.\n"
            "3. No caso oposto (Eclipse Lunar: Sol — Terra — Lua), a Lua entra no cone de sombra da Terra, o que só ocorre na fase de Lua Cheia."
        )
    }
]

def main():
    if not DATASET_PATH.exists():
        DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)
        DATASET_PATH.touch()

    added = 0
    with open(DATASET_PATH, "a", encoding="utf-8") as f:
        for p in NEW_PAIRS:
            sample = {
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": p["user"]},
                    {"role": "assistant", "content": p["assistant"]}
                ]
            }
            f.write(json.dumps(sample, ensure_ascii=False) + "\n")
            added += 1

    total = sum(1 for line in open(DATASET_PATH, "r", encoding="utf-8") if line.strip())
    if BUNDLE_PATH.exists():
        try:
            bundle = json.loads(BUNDLE_PATH.read_text(encoding="utf-8"))
            bundle["finetune_dataset_count"] = total
            bundle["last_materials_sync"] = "SPE_8ANO_CIENCIAS_AND_PREPARA_FISICA_F1_F2"
            BUNDLE_PATH.write_text(json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass

    print(f"Sucesso! Inseridos +{added} pares no dataset de fine-tuning.")
    print(f"Novo total de pares para treinamento em GPU: {total}")

if __name__ == "__main__":
    main()
