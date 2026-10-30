# -*- coding: utf-8 -*-
"""
feed_curriculum_to_swarm_finetune.py
Ingere os currículos canônicos do SPE (7º Ano Ciências) e Plurall (33 Módulos Física EM3),
junto aos itens calibrados TRI, expandindo o dataset de fine-tuning (SFT/QLoRA)
para aceleração nas GPUs NVIDIA / Google Colab Pro A100.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = ROOT / "swarm" / "dataset" / "aquila_finetune_dataset.jsonl"
BUNDLE_PATH = ROOT / "swarm" / "dataset" / "colab_sync_bundle.json"

SYSTEM_PROMPT = """Você é a Inteligência Pedagógica Soberana do Ecossistema Áquila Pro.
Sua missão é resolver e orientar docentes e estudantes com rigor científico, fundamentação na BNCC,
parâmetros psicométricos da Teoria de Resposta ao Item (TRI 3PL), resolução socrática e zero alucinação."""

NEW_PAIRS = [
    # --- SPE CIÊNCIAS 7º ANO (VOLUMES 1 A 4) ---
    {
        "user": "Qual é a matriz pedagógica do Volume 1 de Ciências do 7º Ano do Sistema Positivo de Ensino (SPE) adotada no Áquila Pro e quais fenômenos atmosféricos são abordados?",
        "assistant": (
            "No Áquila Pro, o Volume 1 de Ciências do 7º Ano (SPE) foca na Terra, Vida e Fenômenos Atmosféricos (BNCC EF07CI12 e EF07CI13; SAEB D_EF7_CI_V1):\n"
            "1. Capítulo 1: A Terra e a diversidade dos seres vivos (condições que permitiram a biosfera terrestre).\n"
            "2. Capítulo 2: Relações ecológicas harmônicas e desarmônicas nas teias tróficas.\n"
            "3. Capítulo 3: Ar e atmosfera: camadas, efeito estufa natural vs. antrópico e inversão térmica.\n"
            "4. Capítulo 4: Ciclo hidrológico e Rios Voadores: transporte massivo de umidade da bacia amazônica pela evapotranspiração da floresta até o Centro-Oeste e Sudeste do Brasil."
        )
    },
    {
        "user": "Explique o fenômeno dos Rios Voadores e sua relação com a floresta amazônica conforme a habilidade EF07CI13 da BNCC.",
        "assistant": (
            "Os 'Rios Voadores' constituem verdadeiros fluxos aéreos de vapor d'água impulsionados pelos ventos alísios. "
            "A densa cobertura florestal da Amazônia atua como uma bomba biótica de água: por meio da evapotranspiração, "
            "uma árvore de grande porte pode liberar centenas de litros de água na atmosfera por dia. Esse vapor encontra a barreira "
            "topográfica da Cordilheira dos Andes e é defletido para as regiões Centro-Oeste, Sudeste e Sul do Brasil, "
            "sendo o motor fundamental das chuvas, da agricultura e do reabastecimento de reservatórios hidrelétricos nessas bacias."
        )
    },
    {
        "user": "Como o Áquila Pro aborda a evolução biológica e os biomas brasileiros no Volume 2 de Ciências (7º Ano)?",
        "assistant": (
            "O Volume 2 de Ciências aborda a Biodiversidade e os Biomas Brasileiros (BNCC EF07CI07, EF07CI08, EF07CI15):\n"
            "- Botânica e Angiospermas (Cap. 5 e 6): Estruturas reprodutivas (flores, frutos, sementes) e coevolução com agentes polinizadores.\n"
            "- Biomas Brasileiros (Cap. 7): Amazônia, Cerrado, Caatinga, Mata Atlântica, Pantanal e Pampa. Ênfase nas adaptações xeromórficas da Caatinga e raízes profundas/casca suberosa contra fogo no Cerrado.\n"
            "- Tectônica de Placas e Impactos Ambientais (Cap. 8): Deriva continental, anéis de fogo e o impacto antrópico da fragmentação de habitats."
        )
    },
    {
        "user": "Apresente a fundamentação psicométrica TRI e a resolução da questão sobre vacinação infantil (EF07CI10) do Volume 3 de Ciências.",
        "assistant": (
            "Item: TRI-FUND2-CIEN-03 (EF07CI10 - Saúde pública e vacinação).\n"
            "Parâmetros TRI: a=1.20 (discriminação boa), b=-0.70 (item fácil/básico), c=0.20 (chute).\n"
            "Conceito: Imunização ativa. A vacina introduz antígenos atenuados, inativados ou fragmentos de RNAm que estimulam "
            "os linfócitos B a sintetizar anticorpos específicos e criar células de memória imunológica duradoura, impedindo infecções graves subsequentes."
        )
    },
    {
        "user": "Explique a classificação de alavancas e o funcionamento de máquinas simples conforme a habilidade EF07CI01 (Volume 3).",
        "assistant": (
            "Na física de máquinas simples (BNCC EF07CI01), as alavancas são classificadas pela posição relativa do Ponto de Apoio (A), "
            "Força Potente (P) e Força Resistente (R):\n"
            "1. Interfixa: O ponto de apoio está entre a potência e a resistência (ex: tesoura, gangorra).\n"
            "2. Inter-resistente: A força resistente está entre o ponto de apoio e a potência (ex: carrinho de mão, quebra-nozes). Vantagem mecânica sempre > 1.\n"
            "3. Interpotente: A força potente atua entre o apoio e a resistência (ex: pinça, antebraço humano). Prioriza amplitude de movimento."
        )
    },
    {
        "user": "Qual a diferença entre calor e temperatura segundo a termologia do 7º ano (Volume 4, EF07CI02)?",
        "assistant": (
            "Temperatura é a grandeza física macroscópica que mede o grau médio de agitação térmica molecular de um corpo. "
            "Calor, por sua vez, é energia térmica em trânsito espontâneo entre dois corpos devido exclusivamente a uma diferença de temperatura entre eles. "
            "Propaga-se por três mecanismos:\n"
            "1. Condução: de molécula a molécula nos sólidos (ex: cabo de metal aquecido na sopa).\n"
            "2. Convecção: deslocamento de matéria em fluidos por diferença de densidade (correntes de ar/água quente sobem e frias descem).\n"
            "3. Irradiação: propagação de ondas eletromagnéticas (infravermelho), sem necessidade de meio material (calor do Sol até a Terra)."
        )
    },

    # --- PLURALL FÍSICA ENSINO MÉDIO (33 MÓDULOS) ---
    {
        "user": "Como é estruturada a matriz curricular de Física do Ensino Médio no Plurall (Coleção Física+ Anglo) catalogada no Áquila Pro?",
        "assistant": (
            "A coleção de Física+ do Ensino Médio catalogada abrange 33 módulos temáticos divididos em 4 cadernos:\n"
            "- Caderno 1 (Mód 1 a 8): Gráficos Cinemáticos, Propagação Retilínea, MRU/MRUV, Espelhos Planos e Esféricos de Gauss, Vetores e Engrenagens (Coroa/Catraca).\n"
            "- Caderno 2 (Mód 9 a 16): Refração, Prismas, Leis de Newton, Plano Inclinado e Atrito, Força Centrípeta, Óptica da Visão (Lentes/Miopia) e Dilatação Térmica.\n"
            "- Caderno 3 (Mód 17 a 25): Relatividade ($E=mc^2$), Potência Mecânica, Calorimetria, Gravitação, Balística, Máquinas Térmicas (Carnot), Conservação de Momento e Efeito Fotoelétrico.\n"
            "- Caderno 4 (Mód 26 a 33): Hidrostática (Arquimedes/Empuxo), Lei de Coulomb, Torque/Estática, Deflexão em Campo Elétrico, Acústica, Circuitos de Kirchhoff e Efeito Doppler."
        )
    },
    {
        "user": "Resolva a questão TRI-FIS-01 de óptica geométrica sobre a equação de Gauss para espelhos côncavos.",
        "assistant": (
            "Enunciado: Objeto a 30 cm de espelho côncavo com raio R = 40 cm.\n"
            "Resolução Passo a Passo:\n"
            "1. Distância focal: Para espelho côncavo, f = R/2 = 40/2 = +20 cm.\n"
            "2. Equação de Gauss: 1/f = 1/p + 1/p'\n"
            "   1/20 = 1/30 + 1/p' => 1/p' = 1/20 - 1/30 = (3 - 2)/60 = 1/60\n"
            "   Logo, p' = +60 cm.\n"
            "3. Natureza: Como p' > 0, a imagem é real (formada pelo cruzamento dos próprios raios refletidos) e invertida (Aumento linear A = -p'/p = -60/30 = -2)."
        )
    },
    {
        "user": "Como se calcula o acoplamento por correia/corrente entre coroa e catraca em cinemática rotacional (Módulo 8 Plurall)?",
        "assistant": (
            "No acoplamento periférico por corrente ou correia (ex: coroa dianteira de raio $R_A$ ou dentes $N_A$ ligada à catraca traseira de raio $R_B$ ou dentes $N_B$):\n"
            "1. A velocidade linear da correia é contínua e igual em ambas: $v_A = v_B$.\n"
            "2. Como $v = \\omega \\cdot R = 2\\pi f \\cdot R$, temos: $f_A \\cdot R_A = f_B \\cdot R_B$ ou $f_A \\cdot N_A = f_B \\cdot N_B$.\n"
            "3. Exemplo (TRI-FIS-02): Coroa com 48 dentes a 1,5 Hz e catraca com 16 dentes:\n"
            "   $1,5 \\cdot 48 = f_B \\cdot 16 \\implies f_B = 72 / 16 = 4,5\\text{ voltas/s}$ (270 rpm)."
        )
    },
    {
        "user": "Qual o rendimento máximo teórico de uma máquina térmica e como Carnot formulou a 2ª Lei da Termodinâmica (Módulo 22)?",
        "assistant": (
            "Sadi Carnot demonstrou que nenhuma máquina térmica operando entre duas temperaturas $T_{\\text{quente}}$ e $T_{\\text{fria}}$ pode ser mais eficiente que uma máquina reversível ideal (Ciclo de Carnot):\n"
            "$$\\eta_{\\text{Carnot}} = 1 - \\frac{T_{\\text{fria}}}{T_{\\text{quente}}}$$\n"
            "Onde as temperaturas DEVEM estar obrigatoriamente na escala absoluta Kelvin ($K = °C + 273$).\n"
            "Exemplo (TRI-FIS-03): $T_Q = 527°C = 800 K$ e $T_F = 127°C = 400 K$.\n"
            "$\\eta = 1 - (400 / 800) = 0,50$ (50%). Recebendo 2.000 J da fonte quente, o trabalho máximo útil realizável é $W = 0,50 \\cdot 2.000\\text{ J} = 1.000\\text{ J}$."
        )
    },
    {
        "user": "Como funciona o Efeito Doppler sonoro e qual a fórmula para observador em repouso e ambulância em aproximação (Módulo 33 Plurall)?",
        "assistant": (
            "O Efeito Doppler é a alteração aparente da frequência de uma onda percebida pelo observador devido ao movimento relativo entre a fonte emissora e o observador.\n"
            "Na aproximação da fonte em relação a um observador em repouso ($v_{\\text{obs}} = 0$):\n"
            "- As frentes de onda se comprimem na direção do movimento, diminuindo o comprimento de onda aparente ($\\lambda' < \\lambda$) e aumentando a frequência percebida ($f' > f$, som mais agudo):\n"
            "$$f' = f \\cdot \\left( \\frac{v_{\\text{som}}}{v_{\\text{som}} - v_{\\text{fonte}}} \\right)$$\n"
            "Exemplo (TRI-FIS-05): $f = 900\\text{ Hz}$, $v_{\\text{som}} = 340\\text{ m/s}$, $v_{\\text{fonte}} = 34\\text{ m/s}$:\n"
            "$$f' = 900 \\cdot \\left( \\frac{340}{340 - 34} \\right) = 900 \\cdot \\frac{340}{306} = 900 \\cdot \\frac{10}{9} = 1.000\\text{ Hz}.$$"
        )
    }
]

def main():
    if not DATASET_PATH.exists():
        DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)
        DATASET_PATH.touch()

    # Carregar mensagens existentes para evitar duplicatas
    existing_contents = set()
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                for m in data.get("messages", []):
                    if m.get("role") == "user":
                        existing_contents.add(m.get("content").strip()[:80])
            except Exception:
                pass

    added_count = 0
    with open(DATASET_PATH, "a", encoding="utf-8") as f:
        for p in NEW_PAIRS:
            prompt_key = p["user"].strip()[:80]
            if prompt_key not in existing_contents:
                sample = {
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": p["user"]},
                        {"role": "assistant", "content": p["assistant"]}
                    ]
                }
                f.write(json.dumps(sample, ensure_ascii=False) + "\n")
                existing_contents.add(prompt_key)
                added_count += 1

    # Atualizar contagem no bundle do Colab
    total_lines = sum(1 for line in open(DATASET_PATH, "r", encoding="utf-8") if line.strip())
    if BUNDLE_PATH.exists():
        try:
            bundle = json.loads(BUNDLE_PATH.read_text(encoding="utf-8"))
            bundle["finetune_dataset_count"] = total_lines
            bundle["last_curriculum_sync"] = "SPE_CIENCIAS_7ANO_AND_PLURALL_FISICA_EM3"
            BUNDLE_PATH.write_text(json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception as e:
            print(f"Aviso ao atualizar bundle: {e}")

    print(f"Sucesso! Inseridos +{added_count} pares pedagógicos no dataset SFT/QLoRA.")
    print(f"Total de pares prontos para as GPUs NVIDIA/Colab A100: {total_lines}")

if __name__ == "__main__":
    main()
