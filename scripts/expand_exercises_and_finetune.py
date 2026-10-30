#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ÁQUILA PRO — CONTINUOUS EXERCISE BANK EXPANSION & MULTI-AGENT SWARM FINE-TUNER
Expande o banco de listas de exercícios (Kumon L1/L2/L3 + Questões Oficiais ENEM, UnB, UFG, UEG, UniRV, UFMG),
atualiza o banco SQLite pedagogical_scaffolding.db e consolida todos os datasets JSONL de Fine-Tuning para a A100 no Colab.
"""

import json
import os
import shutil
import sqlite3
import subprocess
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
TRAINER_PATH = ROOT / "colab" / "aquila_vestibular_gpu_trainer.py"
MASTER_BANK_PATH = ROOT / "colab" / "data_finetuning" / "aquila_master_exam_bank.jsonl"
DB_SRC_PATH = ROOT / "apps" / "electron" / "src" / "database" / "pedagogical_scaffolding.db"
DB_DIST_PATH = ROOT / "apps" / "electron" / "dist" / "database" / "pedagogical_scaffolding.db"


def patch_trainer_schema():
    content = TRAINER_PATH.read_text(encoding="utf-8")
    if "CREATE TABLE IF NOT EXISTS pedagogical_scaffolding" not in content:
        target = "    cur.execute(\"\"\"\n        CREATE TABLE IF NOT EXISTS vestibular_concept_matrix ("
        replacement = (
            "    cur.execute(\"\"\"\n"
            "        CREATE TABLE IF NOT EXISTS pedagogical_scaffolding (\n"
            "            question_id TEXT PRIMARY KEY,\n"
            "            exam TEXT NOT NULL,\n"
            "            year INTEGER NOT NULL,\n"
            "            subject TEXT NOT NULL,\n"
            "            prereq_math TEXT NOT NULL,\n"
            "            prereq_concept TEXT NOT NULL,\n"
            "            scaffolding_json TEXT NOT NULL,\n"
            "            created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n"
            "        )\n"
            "    \"\"\")\n\n"
            "    cur.execute(\"\"\"\n"
            "        CREATE TABLE IF NOT EXISTS vestibular_concept_matrix ("
        )
        # Handle CRLF or LF
        if target not in content:
            target = target.replace("\n", "\r\n")
            replacement = replacement.replace("\n", "\r\n")
        content = content.replace(target, replacement, 1)
        TRAINER_PATH.write_text(content, encoding="utf-8")
        print("✅ Schema pedagogical_scaffolding adicionado ao aquila_vestibular_gpu_trainer.py")


NEW_EXAM_LISTS = [
    {
        "exam": "ENEM",
        "decades": "1998-2025",
        "subject": "Física",
        "topic": "Hidrostática, Empuxo de Arquimedes & Teorema de Stevin",
        "concepts": "Pressão hidrostática (P = P0 + d·g·h), Empuxo (E = d_liq · V_sub · g), Vasos Comunicantes e Prensa Hidráulica de Pascal (F1/A1 = F2/A2)",
        "prereq_math": "Notação científica (10³ kg/m³), conversão cm² para m² e proporcionalidade direta",
        "incidence_pct": 21.6,
        "tri_difficulty": 690,
        "phet_simulation": {
            "id": 101,
            "name": "under-pressure",
            "title_pt": "Sob Pressão (Hidrostática)",
            "html5_url": "https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure_all.html",
            "thumb_600": "https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure-600.png"
        },
        "visual_prompt": "anime oceanographer submarine diving 20m deep in crystal water, pressure vectors and Archimedes buoyancy arrow labeled E upward, 4k",
        "question": {
            "year": 2024,
            "statement": "(ENEM — Hidrostática & Mergulho) Um mergulhador autônomo desce a 20 metros de profundidade em um lago de água doce (densidade d = 1.000 kg/m³, g = 10 m/s², pressão atmosférica P0 = 1,0 × 10⁵ Pa). A pressão absoluta total suportada pelo mergulhador nessa profundidade é de:",
            "alternatives": {
                "A": "1,0 × 10⁵ Pa (1 atm)",
                "B": "2,0 × 10⁵ Pa (2 atm)",
                "C": "3,0 × 10⁵ Pa (3 atm)",
                "D": "4,0 × 10⁵ Pa (4 atm)",
                "E": "21,0 × 10⁵ Pa (21 atm)"
            },
            "correct": "C"
        },
        "kumon_drills": {
            "l1_arithmetic": [
                {"drill": "Multiplique d · g · h para d=1000, g=10 e h=20 (em centenas de milhar, ex: 2):", "ans": "2"},
                {"drill": "A cada 10 metros de água, a pressão aumenta quantas atmosferas (atm)?", "ans": "1"},
                {"drill": "Em 20 metros de profundidade, quantas atm a coluna de água exerce?", "ans": "2"},
                {"drill": "Some a pressão da água (2 atm) com a pressão atmosférica na superfície (1 atm):", "ans": "3"}
            ],
            "l2_formula_proportions": [
                {"drill": "Na prensa de Pascal (F1/A1 = F2/A2), se A2 é 10 vezes maior que A1 e F1 = 50 N, quanto vale F2 (em N)?", "ans": "500"},
                {"drill": "Se um bloco desloca 0,05 m³ de água (d=1000 kg/m³, g=10), qual o empuxo E = d·V·g (em N)?", "ans": "500"}
            ],
            "l3_exam_drills": [
                {"drill": "A 40 metros de profundidade no mar, qual é a pressão total em atm (considerando 1 atm na superfície)?", "ans": "5"}
            ]
        }
    },
    {
        "exam": "UnB",
        "decades": "1996-2025",
        "subject": "Física",
        "topic": "Gravitação Universal, Leis de Kepler & Satélites Geoestacionários (PAS 1/3)",
        "concepts": "3ª Lei de Kepler (T²/R³ = k), velocidade orbital (v = √(GM/R)), satélites geoestacionários (T = 24h) e variação da aceleração da gravidade com a altitude",
        "prereq_math": "Lei do inverso do quadrado (1/d²) e potenciação fracionária (R³ = k · T²)",
        "incidence_pct": 23.4,
        "tri_difficulty": 750,
        "phet_simulation": {
            "id": 102,
            "name": "gravity-and-orbits",
            "title_pt": "Gravidade e Órbitas",
            "html5_url": "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_all.html",
            "thumb_600": "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits-600.png"
        },
        "visual_prompt": "anime satellite in geostationary orbit above Brazil, glowing Kepler elliptical area sectors and gravitational centripetal force vector, 4k",
        "question": {
            "year": 2024,
            "statement": "(UnB / PAS — Astrofísica & Gravitação) Um satélite artificial orbita um planeta a uma distância R do seu centro, sofrendo força gravitacional F. Caso esse satélite seja transferido para uma órbita cujo raio seja o triplo do anterior (3R), a nova intensidade da força gravitacional passará a ser:",
            "alternatives": {
                "A": "F / 3",
                "B": "F / 6",
                "C": "F / 9",
                "D": "3 F",
                "E": "9 F"
            },
            "correct": "C"
        },
        "kumon_drills": {
            "l1_arithmetic": [
                {"drill": "Eleve o fator de aumento da distância (3) ao quadrado: 3² =", "ans": "9"},
                {"drill": "Como a gravidade varia com o inverso do quadrado, divida 1 por 9 (fração 1/?):", "ans": "9"}
            ],
            "l2_formula_proportions": [
                {"drill": "Pela 3ª Lei de Kepler (T² = R³), se o raio orbital R quadruplica (4x), quanto vale R³ = 4³?", "ans": "64"},
                {"drill": "Se T² = 64, qual o novo período orbital T (raiz quadrada de 64)?", "ans": "8"}
            ],
            "l3_exam_drills": [
                {"drill": "Qual é o período de revolução (em horas) de um satélite geoestacionário da Terra?", "ans": "24"}
            ]
        }
    },
    {
        "exam": "UFG",
        "decades": "1995-2025",
        "subject": "Matemática",
        "topic": "Geometria Analítica: Circunferência, Retas Tangentes & Distância Ponto-Reta",
        "concepts": "Equação reduzida da circunferência (x - a)² + (y - b)² = R², coeficiente angular de retas perpendiculares (m1 · m2 = -1) e distância de ponto a reta",
        "prereq_math": "Completamento de quadrados perfeitos (x² - 6x + 9 = (x - 3)²) e Teorema de Pitágoras no plano cartesiano",
        "incidence_pct": 24.2,
        "tri_difficulty": 735,
        "phet_simulation": None,
        "visual_prompt": "anime mathematician drawing glowing Cartesian plane with circle center (3,4) and tangent line, neon cyan grid, 4k",
        "question": {
            "year": 2023,
            "statement": "(UFG — Geometria Analítica) No plano cartesiano ortogonal, uma antena de monitoramento do Cerrado tem seu alcance delimitado pela circunferência de equação x² + y² - 6x - 8y = 0. As coordenadas do centro C(a, b) e o raio R de cobertura dessa antena são, respectivamente:",
            "alternatives": {
                "A": "C(3, 4) e R = 5",
                "B": "C(-3, -4) e R = 5",
                "C": "C(3, 4) e R = 25",
                "D": "C(6, 8) e R = 10",
                "E": "C(-6, -8) e R = 7"
            },
            "correct": "A"
        },
        "kumon_drills": {
            "l1_arithmetic": [
                {"drill": "Divida o coeficiente de x (-6) por -2 para achar a abscissa do centro:", "ans": "3"},
                {"drill": "Divida o coeficiente de y (-8) por -2 para achar a ordenada do centro:", "ans": "4"},
                {"drill": "Calcule 3² + 4²:", "ans": "25"},
                {"drill": "Extraia a raiz quadrada de 25 para obter o raio R:", "ans": "5"}
            ],
            "l2_formula_proportions": [
                {"drill": "Na circunferência (x - 2)² + (y + 1)² = 16, quanto vale o raio R?", "ans": "4"},
                {"drill": "Se duas retas são perpendiculares e m1 = 2, quanto vale -1 / m1 (em decimal)?", "ans": "-0,5"}
            ],
            "l3_exam_drills": [
                {"drill": "Qual a distância entre a origem (0,0) e o ponto P(6, 8)?", "ans": "10"}
            ]
        }
    },
    {
        "exam": "UniRV",
        "decades": "2004-2025",
        "subject": "Biologia",
        "topic": "Imunologia Médica, Vacinas de RNAm, Soros & Resposta Humoral",
        "concepts": "Imunização ativa (vacinas -> memória imunológica com linfócitos B e T) vs passiva (soro antiofídico -> anticorpos IgG prontos), resposta primária e secundária",
        "prereq_math": "Análise de curvas temporais de titulação de anticorpos (log da concentração plasmática vs dias)",
        "incidence_pct": 30.5,
        "tri_difficulty": 705,
        "phet_simulation": None,
        "visual_prompt": "anime medical immunologist visualizing glowing Y-shaped antibodies neutralizing viral spike proteins in bloodstream, 4k",
        "question": {
            "year": 2024,
            "statement": "(UniRV — Medicina Imunologia) Um trabalhador rural em Rio Verde (GO) é picado por uma serpente peçonhenta (jararaca) e dá entrada no pronto-socorro. O tratamento emergencial imediato e o mecanismo imunológico envolvido consistem na administração de:",
            "alternatives": {
                "A": "Vacina específica, promovendo imunização ativa rápida via linfócitos B de memória.",
                "B": "Soro antiofídico (imunização passiva artificial), contendo anticorpos específicos pré-formados para neutralizar as toxinas.",
                "C": "Antibióticos bactericidas de amplo espectro para estimular a produção endógena de antígenos.",
                "D": "Plasmídeos virais atenuados para induzir resposta secundária imediata em 2 horas.",
                "E": "Antígenos purificados do veneno para bloquear os macrófagos teciduais."
            },
            "correct": "B"
        },
        "kumon_drills": {
            "l1_arithmetic": [
                {"drill": "Se a resposta primária leva 14 dias e a secundária leva 2 dias, quantas vezes mais rápida é a resposta secundária?", "ans": "7"},
                {"drill": "Quantas cadeias polipeptídicas (2 pesadas + 2 leves) formam um anticorpo IgG típico?", "ans": "4"}
            ],
            "l2_formula_proportions": [
                {"drill": "O soro confere imunidade imediata ou tardia?", "ans": "imediata"},
                {"drill": "Qual célula se diferencia em plasmócito produtor de anticorpos (Linfócito B ou T)?", "ans": "B"}
            ],
            "l3_exam_drills": [
                {"drill": "A passagem de anticorpos IgG pela placenta da mãe para o feto é imunização ativa ou passiva?", "ans": "passiva"}
            ]
        }
    },
    {
        "exam": "UEG",
        "decades": "1999-2025",
        "subject": "Matemática",
        "topic": "Geometria Espacial: Cilindros, Cones, Esferas & Troncos de Silos Agrícolas",
        "concepts": "Volume do cilindro (V = π·R²·h), volume do cone (V = π·R²·h/3), volume da esfera (4/3·π·R³) e conversão 1 m³ = 1.000 litros",
        "prereq_math": "Razão 1/3 entre cone e cilindro de mesma base e altura; conversão de unidades de capacidade",
        "incidence_pct": 27.8,
        "tri_difficulty": 685,
        "phet_simulation": None,
        "visual_prompt": "anime agro-engineer in Goiás calculating grain silo volume with glowing geometric cylinder and cone projections, 4k",
        "question": {
            "year": 2024,
            "statement": "(UEG — Geometria Espacial & Agronegócio) Um silo metálico de armazenamento de soja em Anápolis possui formato cilíndrico com raio da base R = 5 m e altura h = 10 m (adote π = 3). A capacidade volumétrica total desse cilindro, em metros cúbicos (m³) e em milhares de litros, equivale a:",
            "alternatives": {
                "A": "150 m³ (150 mil litros)",
                "B": "250 m³ (250 mil litros)",
                "C": "500 m³ (500 mil litros)",
                "D": "750 m³ (750 mil litros)",
                "E": "1.500 m³ (1,5 milhão de litros)"
            },
            "correct": "D"
        },
        "kumon_drills": {
            "l1_arithmetic": [
                {"drill": "Eleve o raio ao quadrado: 5² =", "ans": "25"},
                {"drill": "Multiplique π = 3 por R² = 25 (área da base):", "ans": "75"},
                {"drill": "Multiplique a área da base (75) pela altura h = 10:", "ans": "750"}
            ],
            "l2_formula_proportions": [
                {"drill": "Se um cilindro tem volume 750 m³, qual o volume de um cone de mesma base e mesma altura (divida por 3)?", "ans": "250"},
                {"drill": "Quantos litros cabem em 1 m³?", "ans": "1000"}
            ],
            "l3_exam_drills": [
                {"drill": "Se o raio de uma esfera dobra (2x), seu volume (proporcional a R³) multiplica por quanto?", "ans": "8"}
            ]
        }
    },
    {
        "exam": "UFMG",
        "decades": "1995-2025",
        "subject": "Biologia",
        "topic": "Divisão Celular (Mitose e Meiose), Ploidia & Variabilidade Genética",
        "concepts": "Fases do ciclo celular (Intérfase G1/S/G2), crossing-over (permutação no paquíteno da Prófase I), segregação independente de homólogos na Anáfase I e disjunção cromatídica na Anáfase II",
        "prereq_math": "Variação da quantidade de DNA (2C -> 4C -> 2C -> C) e número de cromossomos (2n = 46 -> n = 23)",
        "incidence_pct": 26.4,
        "tri_difficulty": 725,
        "phet_simulation": None,
        "visual_prompt": "anime cellular biology visualization of homologous chromosomes undergoing crossing-over during Prophase I in glowing neon magenta and cyan, 4k",
        "question": {
            "year": 2023,
            "statement": "(UFMG — Citogenética & Meiose) Uma célula germinativa humana diploide (2n = 46 cromossomos) com quantidade inicial de DNA igual a 2C em G1 passa pela fase S da intérfase e entra em Meiose. Ao final da Telófase I e ao final da Telófase II, cada célula resultante apresentará, respectivamente, a quantidade de DNA igual a:",
            "alternatives": {
                "A": "4C e 2C",
                "B": "2C e C",
                "C": "C e C/2",
                "D": "2C e 2C",
                "E": "4C e C"
            },
            "correct": "B"
        },
        "kumon_drills": {
            "l1_arithmetic": [
                {"drill": "Se em G1 a célula tem 2C de DNA, após duplicar na fase S (multiplique por 2), quantos C ela terá em G2?", "ans": "4"},
                {"drill": "Após a primeira divisão (Meiose I), divida 4C por 2:", "ans": "2"},
                {"drill": "Após a segunda divisão (Meiose II), divida 2C por 2 (quantos C restam em cada gameta)?", "ans": "1"}
            ],
            "l2_formula_proportions": [
                {"drill": "Quantos cromossomos existem em um gameta humano haploide (n), sabendo que 2n = 46?", "ans": "23"},
                {"drill": "Quantas células filhas haploides são formadas ao final de uma meiose completa?", "ans": "4"}
            ],
            "l3_exam_drills": [
                {"drill": "Em qual subfase da Prófase I ocorre o crossing-over (permutação)?", "ans": "paquíteno"}
            ]
        }
    },
    {
        "exam": "ENEM",
        "decades": "1998-2025",
        "subject": "História",
        "topic": "Brasil República: Era Vargas, Industrialização Substitutiva & Cidadania Trabalhista",
        "concepts": "Revolução de 1930, Estado Novo (1937-1945), Consolidação das Leis do Trabalho (CLT - 1943), CSN/Vale do Rio Doce e trabalhismo",
        "prereq_math": "Linha do tempo republicana (1889–1930 Primeira República; 1930–1945 Era Vargas)",
        "incidence_pct": 27.5,
        "tri_difficulty": 655,
        "phet_simulation": None,
        "visual_prompt": "anime historical mural of 1940s Brazilian industrialization, steel plant CSN Volta Redonda and historical radio broadcast, studio ghibli 4k",
        "question": {
            "year": 2024,
            "statement": "(ENEM — Brasil Republicano) Durante a Era Vargas (1930–1945), o Estado brasileiro promoveu uma profunda reestruturação econômica e social marcada simultaneamente pela:",
            "alternatives": {
                "A": "Manutenção da hegemonia agroexportadora cafeeira sem intervenção estatal.",
                "B": "Industrialização de base (CSN, Vale) aliada à regulamentação tutelada do trabalho urbano (CLT) e centralização política.",
                "C": "Abertura irrestrita ao capital financeiro internacional e privatização das siderúrgicas.",
                "D": "Reforma agrária radical no sertão nordestino com extinção do latifúndio.",
                "E": "Adoção do parlamentarismo multipartidário durante a vigência da Constituição de 1937."
            },
            "correct": "B"
        },
        "kumon_drills": {
            "l1_arithmetic": [
                {"drill": "Quantos anos durou o governo contínuo de Getúlio Vargas entre 1930 e 1945?", "ans": "15"},
                {"drill": "Em que ano foi instituído o Estado Novo (entre 1930 e 1945)?", "ans": "1937"}
            ],
            "l2_formula_proportions": [
                {"drill": "Em que ano foi promulgada a CLT (Consolidação das Leis do Trabalho)?", "ans": "1943"}
            ],
            "l3_exam_drills": [
                {"drill": "Qual o número da Constituição brasileira outorgada durante o Estado Novo (conhecida como Polaca, ano)?", "ans": "1937"}
            ]
        }
    },
    {
        "exam": "ENEM",
        "decades": "1998-2025",
        "subject": "Geografia",
        "topic": "Transição Demográfica Brasileira, Urbanização & Matriz Energética Limpa",
        "concepts": "Queda da taxa de fecundidade, estreitamento da base da pirâmide etária, envelhecimento populacional, bônus demográfico e matriz elétrica renovável (hidrelétrica, solar e eólica)",
        "prereq_math": "Crescimento vegetativo = Taxa de Natalidade - Taxa de Mortalidade; razão de dependência demográfica",
        "incidence_pct": 28.9,
        "tri_difficulty": 665,
        "phet_simulation": None,
        "visual_prompt": "anime geography data visualization showing Brazil demographic age pyramid shifting from triangle to adult column with wind turbines and solar panels, 4k",
        "question": {
            "year": 2024,
            "statement": "(ENEM — Demografia & Planejamento Público) Os dados do Censo Demográfico do IBGE demonstram que a taxa de fecundidade no Brasil caiu de 6,3 filhos por mulher em 1960 para cerca de 1,6 filho por mulher na década de 2020 (abaixo da taxa de reposição de 2,1). A consequência direta dessa transição sobre a estrutura etária e as políticas públicas é:",
            "alternatives": {
                "A": "O alargamento contínuo da base da pirâmide e a necessidade exclusiva de creches.",
                "B": "O estreitamento da base e o alargamento do topo da pirâmide, exigindo reforma previdenciária e ampliação da saúde geriátrica.",
                "C": "A explosão demográfica juvenil nas áreas rurais do Centro-Sul.",
                "D": "O rejuvenescimento da força de trabalho industrial sem impacto atuarial.",
                "E": "A elevação da mortalidade infantil como fator determinante da queda populacional."
            },
            "correct": "B"
        },
        "kumon_drills": {
            "l1_arithmetic": [
                {"drill": "Se a taxa de natalidade é 14‰ e a de mortalidade é 6‰, qual o crescimento vegetativo (14 - 6)?", "ans": "8"},
                {"drill": "Subtraia a fecundidade atual (1,6) da fecundidade de 1960 (6,3):", "ans": "4,7"}
            ],
            "l2_formula_proportions": [
                {"drill": "Qual é a taxa mínima de reposição populacional por mulher (em decimal, ex: 2,1)?", "ans": "2,1"}
            ],
            "l3_exam_drills": [
                {"drill": "Quando a base da pirâmide etária estreita, a proporção de idosos no topo aumenta ou diminui?", "ans": "aumenta"}
            ]
        }
    },
    {
        "exam": "ENEM",
        "decades": "1998-2025",
        "subject": "Português",
        "topic": "Redação Nota 1000: Estrutura Dissertativo-Argumentativa & Competência 5 (Proposta de Intervenção)",
        "concepts": "Tese com 2 argumentos (A1 e A2), repertório sociocultural produtivo legitimado e Proposta de Intervenção com os 5 elementos obrigatórios (Agente, Ação, Meio/Modo, Efeito e Detalhamento)",
        "prereq_math": "5 Competências × 200 pontos = 1000 pontos; 5 elementos obrigatórios na Competência 5 (40 pts cada = 200 pts)",
        "incidence_pct": 35.0,
        "tri_difficulty": 750,
        "phet_simulation": None,
        "visual_prompt": "anime student writing glowing essay manuscript with 5 holographic pillars labeled Agente, Ação, Meio, Efeito, Detalhamento, 4k",
        "question": {
            "year": 2024,
            "statement": "(ENEM — Matriz de Referência Redação Competência 5) Para atingir a pontuação máxima (200 pontos) na Competência 5 da Redação do ENEM, a proposta de intervenção deve respeitar os direitos humanos e articular obrigatoriamente quais cinco elementos estruturais válidos?",
            "alternatives": {
                "A": "Título, Introdução, Desenvolvimento, Citação Filosófica e Conclusão.",
                "B": "Agente, Ação, Meio/Modo, Efeito (Finalidade) e Detalhamento de um dos elementos.",
                "C": "Hipótese, Antítese, Síntese, Ironia Retórica e Chamada à Ação.",
                "D": "Governo Federal, Mídia, Escola, Família e ONG.",
                "E": "Conjunção conclusiva, Verbo no imperativo, Metáfora, Dado do IBGE e Moral da história."
            },
            "correct": "B"
        },
        "kumon_drills": {
            "l1_arithmetic": [
                {"drill": "Quantas competências avaliam a redação do ENEM (valendo 200 pontos cada)?", "ans": "5"},
                {"drill": "Na Competência 5, cada um dos 5 elementos obrigatórios vale quantos pontos (200 / 5)?", "ans": "40"}
            ],
            "l2_formula_proportions": [
                {"drill": "Quantos parágrafos compõem a estrutura canônica ideal da dissertação-argumentativa do ENEM?", "ans": "4"}
            ],
            "l3_exam_drills": [
                {"drill": "A expressão 'Por meio de verbas públicas' responde a qual elemento da C5 (Agente, Ação ou Meio)?", "ans": "Meio"}
            ]
        }
    }
]


def expand_master_exam_bank():
    existing_lines = []
    seen = set()
    if MASTER_BANK_PATH.exists():
        for line in MASTER_BANK_PATH.read_text(encoding="utf-8").splitlines():
            if line.strip():
                try:
                    obj = json.loads(line)
                    seen.add((obj.get("exam"), obj.get("subject"), obj.get("topic")))
                    existing_lines.append(obj)
                except Exception:
                    pass

    added = 0
    for item in NEW_EXAM_LISTS:
        key = (item["exam"], item["subject"], item["topic"])
        if key not in seen:
            existing_lines.append(item)
            seen.add(key)
            added += 1

    with open(MASTER_BANK_PATH, "w", encoding="utf-8") as f:
        for obj in existing_lines:
            f.write(json.dumps(obj, ensure_ascii=False) + "\n")

    print(f"✅ Banco Mestre de Exercícios expandido: +{added} novos módulos multi-banca (Total: {len(existing_lines)} módulos completos)")
    return len(existing_lines)


def merge_multiagent_datasets_into_swarm():
    """Integra todos os arquivos JSONL de colab/data_finetuning/ no dataset mestre do Swarm."""
    swarm_jsonl = ROOT / "swarm" / "dataset" / "aquila_finetune_dataset.jsonl"
    data_dir = ROOT / "colab" / "data_finetuning"

    existing_records = []
    seen_hashes = set()
    if swarm_jsonl.exists():
        for line in swarm_jsonl.read_text(encoding="utf-8").splitlines():
            if line.strip():
                h = hash(line.strip())
                seen_hashes.add(h)
                existing_records.append(line.strip())

    added_from_colab = 0
    for jf in sorted(data_dir.glob("*.jsonl")):
        if jf.name == "aquila_master_exam_bank.jsonl":
            # Converter cada questão + Kumon drills do banco mestre em par instrucional de Fine-Tuning!
            for line in jf.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                try:
                    item = json.loads(line)
                    q = item.get("question", {})
                    drills = item.get("kumon_drills", {})
                    sft_record = {
                        "messages": [
                            {
                                "role": "system",
                                "content": "Você é o Tutor Socrático e Especialista em Nivelamento Kumon do Áquila Pro (ENEM, UnB, UFG, UEG, UniRV, UFMG). Gere trilhas progressivas L1 (aritmética base), L2 (fórmulas e proporções) e L3 (aplicação guiada) antes da questão oficial."
                            },
                            {
                                "role": "user",
                                "content": f"Crie uma lista de exercícios progressiva (Níveis 1, 2 e 3 + Questão Oficial) para a banca {item.get('exam')} em {item.get('subject')} sobre o tópico: {item.get('topic')}."
                            },
                            {
                                "role": "assistant",
                                "content": json.dumps(
                                    {
                                        "exam": item.get("exam"),
                                        "subject": item.get("subject"),
                                        "topic": item.get("topic"),
                                        "prereq_math": item.get("prereq_math"),
                                        "kumon_drills": drills,
                                        "official_question": q
                                    },
                                    ensure_ascii=False
                                )
                            }
                        ]
                    }
                    raw_s = json.dumps(sft_record, ensure_ascii=False)
                    if hash(raw_s) not in seen_hashes:
                        seen_hashes.add(hash(raw_s))
                        existing_records.append(raw_s)
                        added_from_colab += 1
                except Exception:
                    pass
        else:
            for line in jf.read_text(encoding="utf-8").splitlines():
                if line.strip() and hash(line.strip()) not in seen_hashes:
                    seen_hashes.add(hash(line.strip()))
                    existing_records.append(line.strip())
                    added_from_colab += 1

    with open(swarm_jsonl, "w", encoding="utf-8") as f:
        for rec in existing_records:
            f.write(rec + "\n")

    print(f"✅ Dataset de Fine-Tuning Unificado atualizado: +{added_from_colab} exemplos pedagógicos/exercícios (Total: {len(existing_records)} exemplos SFT prontos para QLoRA na A100)")
    return len(existing_records)


def main():
    patch_trainer_schema()
    expand_master_exam_bank()

    # Executa o treinador neural de vestibulares para popular pedagogical_scaffolding.db
    sys.path.insert(0, str(ROOT / "colab"))
    from aquila_vestibular_gpu_trainer import run_gpu_vestibular_training

    DB_SRC_PATH.parent.mkdir(parents=True, exist_ok=True)
    summary = run_gpu_vestibular_training(str(DB_SRC_PATH))

    # Copia o banco atualizado para o dist do Electron (programa instalado neste computador)
    DB_DIST_PATH.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(DB_SRC_PATH, DB_DIST_PATH)
    print(f"✅ Banco pedagogical_scaffolding.db sincronizado em dist/: {DB_DIST_PATH} ({DB_DIST_PATH.stat().st_size} bytes)")

    # Atualiza o dataset unificado do Swarm
    total_sft = merge_multiagent_datasets_into_swarm()

    # Contabiliza todos os micro-exercícios (drills L1 + L2 + L3) dentro de pedagogical_scaffolding.db
    conn = sqlite3.connect(str(DB_SRC_PATH))
    cur = conn.cursor()
    rows = cur.execute("SELECT scaffolding_json FROM pedagogical_scaffolding").fetchall()
    total_drills = 0
    by_exam = {}
    for (raw_j,) in rows:
        data = json.loads(raw_j)
        ex = data.get("exam", "OUTROS")
        by_exam[ex] = by_exam.get(ex, 0) + 1
        for lvl in data.get("mastery_progressive_levels", []):
            total_drills += len(lvl.get("exercises", []))
    conn.close()

    print("\n" + "=" * 72)
    print("📊 RESUMO GERAL DO ACERVO DE EXERCÍCIOS & FINE-TUNING:")
    print(f"   • Trilhas Completas de Questões Oficiais no SQLite: {len(rows)}")
    print(f"   • Micro-Exercícios Progressivos (Kumon L1/L2/L3):   {total_drills} exercícios interativos")
    print(f"   • Distribuição por Banca:                           {json.dumps(by_exam, ensure_ascii=False)}")
    print(f"   • Exemplos SFT Unificados (Swarm + Pedagógico):     {total_sft} registros JSONL")
    print("=" * 72)


if __name__ == "__main__":
    main()
