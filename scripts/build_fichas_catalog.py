import json

catalog = {
    "title": "Física Fichas Desenhadas",
    "author": "Yuri Matos (Revisão de Concursos & Revisão de ENEM)",
    "total_fichas": 312,
    "total_pages": 323,
    "method": "Método N.A.V. (Neuro-Associação Visual)",
    "blocks": [
        {
            "id": "bloco-1",
            "number": 1,
            "name": "As Ferramentas e o Movimento (Cinemática)",
            "subtitle": "Do básico das unidades até os movimentos circulares",
            "page_start": 11,
            "page_end": 73,
            "topics": [
                {"name": "Sistema Internacional de Unidades (SI) e Conversão de Densidade", "pages": [11, 13]},
                {"name": "Conversão de Velocidade e Volume/Capacidade", "pages": [14, 16]},
                {"name": "Notação Científica: Estrutura, Operações e Glóbulos Vermelhos", "pages": [17, 19]},
                {"name": "Notação Científica: Conversão e Cálculo de Carga Elétrica", "pages": [20, 22]},
                {"name": "Ordem de Grandeza: Definição e Aplicação Prática", "pages": [23, 25]},
                {"name": "Vetores: Conceitos, Soma e Regra do Polígono", "pages": [26, 28]},
                {"name": "Decomposição Vetorial (Seno, Cosseno e Aplicação)", "pages": [29, 31]},
                {"name": "Cinemática: Referencial, Posição e Trajetória", "pages": [32, 34]},
                {"name": "Velocidade Média e Viagem do Caminhoneiro", "pages": [35, 37]},
                {"name": "Movimento Retilíneo Uniforme (MRU) e Encontro de Móveis", "pages": [38, 40]},
                {"name": "Gráficos do MRU (Posição x Tempo) e Interpretação", "pages": [41, 43]},
                {"name": "Aceleração Média e Classificação dos Movimentos", "pages": [44, 46]},
                {"name": "Movimento Uniformemente Variado (MUV) e Função da Posição", "pages": [47, 49]},
                {"name": "Equação de Torricelli e Frenagem de Emergência", "pages": [50, 52]},
                {"name": "Gráficos do MUV e Cálculo de Deslocamento pela Área", "pages": [53, 55]},
                {"name": "Queda Livre e Aplicação Prática", "pages": [56, 58]},
                {"name": "Lançamento Vertical e Simetria do Movimento", "pages": [59, 61]},
                {"name": "Lançamento Horizontal e Independência dos Movimentos", "pages": [62, 64]},
                {"name": "Lançamento Oblíquo e Decomposição", "pages": [65, 67]},
                {"name": "Movimento Circular Uniforme (MCU): Período, Frequência e Velocidades", "pages": [68, 70]},
                {"name": "Aceleração Centrípeta e Transmissão de Movimento", "pages": [71, 73]}
            ]
        },
        {
            "id": "bloco-2",
            "number": 2,
            "name": "A Causa dos Movimentos (Dinâmica)",
            "subtitle": "As Leis de Newton e as forças que governam o mundo",
            "page_start": 74,
            "page_end": 109,
            "topics": [
                {"name": "1ª Lei de Newton (Inércia) e Cinto de Segurança", "pages": [74, 76]},
                {"name": "2ª Lei de Newton (Princípio Fundamental) e Blocos", "pages": [77, 79]},
                {"name": "3ª Lei de Newton (Ação e Reação) e Impulso", "pages": [80, 82]},
                {"name": "Força Peso, Massa e Elevadores", "pages": [83, 85]},
                {"name": "Força de Tração e Polias Fixas", "pages": [86, 88]},
                {"name": "Polias Móveis e Talha Exponencial", "pages": [89, 91]},
                {"name": "Força de Atrito Estático e Bloco em Repouso", "pages": [92, 94]},
                {"name": "Força de Atrito Cinético e Freios ABS", "pages": [95, 97]},
                {"name": "Plano Inclinado (Sem Atrito) e Decomposição de Forças", "pages": [98, 100]},
                {"name": "Plano Inclinado com Atrito e Bloco 'Preguiçoso'", "pages": [101, 103]},
                {"name": "Força Elástica (Lei de Hooke) e Bloco Suspenso", "pages": [104, 106]},
                {"name": "Resultante Centrípeta, Lombadas e Depressões", "pages": [107, 109]}
            ]
        },
        {
            "id": "bloco-3",
            "number": 3,
            "name": "Energia e Impulso",
            "subtitle": "Conservação, colisões e equilíbrio (estática)",
            "page_start": 110,
            "page_end": 148,
            "topics": [
                {"name": "Trabalho Mecânico e Teorema da Energia Cinética", "pages": [110, 112]},
                {"name": "Potência Mecânica, Velocidade e Elevadores", "pages": [113, 115]},
                {"name": "Rendimento, Eficiência e Motor Térmico", "pages": [116, 118]},
                {"name": "Energia Cinética e Variação de Velocidade", "pages": [119, 121]},
                {"name": "Energia Potencial Gravitacional e Referencial", "pages": [122, 124]},
                {"name": "Energia Potencial Elástica e Lançadores", "pages": [125, 127]},
                {"name": "Conservação da Energia Mecânica (Montanha-Russa)", "pages": [128, 130]},
                {"name": "Sistemas Dissipativos (Atrito e Calor)", "pages": [131, 133]},
                {"name": "Impulso, Quantidade de Movimento e Gráficos", "pages": [134, 136]},
                {"name": "Colisões (Choques), Coeficiente de Restituição e 'Grude'", "pages": [137, 139]},
                {"name": "Equilíbrio de Ponto Material e Centro de Massa", "pages": [140, 142]},
                {"name": "Torque (Momento), Gangorras e Rotação", "pages": [143, 145]},
                {"name": "Alavancas: Tipos (Interfixa, Interpotente, Inter-resistente)", "pages": [146, 148]}
            ]
        },
        {
            "id": "bloco-4",
            "number": 4,
            "name": "Fluidos (Hidrostática)",
            "subtitle": "Pressão, empuxo e líquidos",
            "page_start": 149,
            "page_end": 166,
            "topics": [
                {"name": "Densidade e Pressão (Conceitos e Aplicação)", "pages": [149, 151]},
                {"name": "Teorema de Stevin e Pressão em Líquidos", "pages": [152, 154]},
                {"name": "Princípio de Pascal e Prensa Hidráulica", "pages": [155, 157]},
                {"name": "Tubos em U, Líquidos Imiscíveis e Manômetros", "pages": [158, 160]},
                {"name": "Teorema de Arquimedes: Empuxo e Flutuação", "pages": [161, 163]},
                {"name": "Peso Aparente e Condições de Flutuação", "pages": [164, 166]}
            ]
        },
        {
            "id": "bloco-5",
            "number": 5,
            "name": "Calor e Temperatura (Termologia)",
            "subtitle": "Do aquecimento às máquinas térmicas",
            "page_start": 167,
            "page_end": 205,
            "topics": [
                {"name": "Termometria: Escalas (Celsius, Fahrenheit, Kelvin)", "pages": [167, 169]},
                {"name": "Dilatação Térmica Linear e Juntas de Dilatação", "pages": [170, 172]},
                {"name": "Dilatação Superficial, Volumétrica e dos Líquidos", "pages": [173, 175]},
                {"name": "Calorimetria: Calor Sensível e Comportamento Anômalo da Água", "pages": [176, 178]},
                {"name": "Capacidade Térmica e Equivalente em Água", "pages": [179, 181]},
                {"name": "Calor Latente e Curvas de Aquecimento", "pages": [182, 184]},
                {"name": "Trocas de Calor e Equilíbrio Térmico", "pages": [185, 187]},
                {"name": "Propagação de Calor (Condução, Convecção, Irradiação)", "pages": [188, 190]},
                {"name": "Gases Ideais: Equação de Clapeyron", "pages": [191, 193]},
                {"name": "Transformações Gasosas (Isotérmica, Isobárica, Isocórica)", "pages": [194, 196]},
                {"name": "1ª Lei da Termodinâmica e Balanço Energético", "pages": [197, 199]},
                {"name": "2ª Lei da Termodinâmica: Entropia e Irreversibilidade", "pages": [200, 202]},
                {"name": "Ciclo de Carnot e Máquinas Térmicas Ideais", "pages": [203, 205]}
            ]
        },
        {
            "id": "bloco-6",
            "number": 6,
            "name": "Luz e Imagem (Óptica)",
            "subtitle": "Espelhos, lentes e visão",
            "page_start": 206,
            "page_end": 238,
            "topics": [
                {"name": "Óptica Geométrica: Princípios e Sombra/Penumbra", "pages": [206, 208]},
                {"name": "Reflexão da Luz e Espelhos Planos (Leis e Imagens)", "pages": [209, 211]},
                {"name": "Espelhos Planos: Campo Visual e Associação", "pages": [212, 214]},
                {"name": "Espelhos Esféricos: Côncavo e Convexo (Elementos)", "pages": [215, 217]},
                {"name": "Espelhos Esféricos: Formação de Imagens (Raios Notáveis)", "pages": [218, 220]},
                {"name": "Equação de Gauss e Aumento Linear (Espelhos)", "pages": [221, 223]},
                {"name": "Refração da Luz e Lei de Snell-Descartes", "pages": [224, 226]},
                {"name": "Reflexão Total e Ângulo Limite (Fibra Óptica)", "pages": [227, 229]},
                {"name": "Lentes Esféricas: Convergentes e Divergentes", "pages": [230, 232]},
                {"name": "Lentes Esféricas: Formação de Imagens e Vergência", "pages": [233, 235]},
                {"name": "Olho Humano e Defeitos da Visão (Miopia/Hipermetropia)", "pages": [236, 238]}
            ]
        },
        {
            "id": "bloco-7",
            "number": 7,
            "name": "O Mundo das Ondas (Ondulatória)",
            "subtitle": "Som, frequência e fenômenos ondulatórios",
            "page_start": 239,
            "page_end": 259,
            "topics": [
                {"name": "Ondulatória: Classificação e Elementos da Onda", "pages": [239, 241]},
                {"name": "Equação Fundamental da Ondulatória", "pages": [242, 244]},
                {"name": "Fenômenos Ondulatórios: Reflexão, Refração e Difração", "pages": [245, 247]},
                {"name": "Interferência de Ondas e Experiência de Young", "pages": [248, 250]},
                {"name": "Acústica: Qualidades Fisiológicas do Som", "pages": [251, 253]},
                {"name": "Efeito Doppler (Aproximação e Afastamento)", "pages": [254, 256]},
                {"name": "Tubos Sonoros e Cordas Vibrantes", "pages": [257, 259]}
            ]
        },
        {
            "id": "bloco-8",
            "number": 8,
            "name": "Eletricidade (O Grande Vilão)",
            "subtitle": "Eletrostática e Eletrodinâmica (Circuitos)",
            "page_start": 260,
            "page_end": 310,
            "topics": [
                {"name": "Eletrostática: Carga Elétrica e Processos de Eletrização", "pages": [260, 262]},
                {"name": "Lei de Coulomb (Força Elétrica)", "pages": [263, 265]},
                {"name": "Campo Elétrico (Vetor e Linhas de Força)", "pages": [266, 268]},
                {"name": "Potencial Elétrico e Trabalho da Força Elétrica", "pages": [269, 271]},
                {"name": "Superfícies Equipotenciais e Campo Uniforme", "pages": [272, 274]},
                {"name": "Corrente Elétrica e Tipos", "pages": [275, 277]},
                {"name": "1ª Lei de Ohm e Resistência", "pages": [278, 280]},
                {"name": "2ª Lei de Ohm (Resistividade e Dimensões)", "pages": [281, 283]},
                {"name": "Potência Elétrica e Energia Consumida (kWh)", "pages": [284, 286]},
                {"name": "Associação de Resistores em Série", "pages": [287, 289]},
                {"name": "Associação de Resistores em Paralelo", "pages": [290, 292]},
                {"name": "Associação Mista de Resistores", "pages": [293, 295]},
                {"name": "Geradores Reais e Equação do Gerador", "pages": [296, 298]},
                {"name": "Associação em Paralelo e Aplicação Residencial", "pages": [299, 301]},
                {"name": "Curto-Circuito e Dispositivos de Segurança (Fusíveis/Disjuntores)", "pages": [302, 304]},
                {"name": "Geradores Reais, Receptores e Lei de Pouillet", "pages": [305, 307]},
                {"name": "Medidores Elétricos: Amperímetro e Voltímetro", "pages": [308, 310]}
            ]
        },
        {
            "id": "bloco-9",
            "number": 9,
            "name": "Magnetismo e Física Moderna",
            "subtitle": "Campos magnéticos e o início da relatividade",
            "page_start": 311,
            "page_end": 322,
            "topics": [
                {"name": "Magnetismo: Ímãs, Campo Terrestre e Inseparabilidade", "pages": [311, 313]},
                {"name": "Força Magnética (Lorentz) e Regras da Mão", "pages": [314, 316]},
                {"name": "Indução Eletromagnética: Faraday, Lenz e Transformadores", "pages": [317, 319]},
                {"name": "Física Moderna: Efeito Fotoelétrico e Relatividade", "pages": [320, 322]}
            ]
        }
    ]
}

with open(r'c:\aquila\data\inbox\fisica\fichas_desenhadas_catalogo.json', 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

print('Catálogo salvo com sucesso! Total de blocos:', len(catalog['blocks']))
