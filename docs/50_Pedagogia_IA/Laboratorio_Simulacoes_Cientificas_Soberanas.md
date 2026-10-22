---
title: Laboratório de Simulações Científicas Soberanas (7 Ambientes PhET Soberanos)
date: 2026-10-20
tags:
  - pedagogia
  - ciencias
  - fisica
  - quimica
  - biologia
  - simuladores
  - phet
  - soberania
---

# 🔬 Laboratório de Simulações Científicas Soberanas — Áquila Pro

O **Laboratório de Simulações Científicas Soberanas** integra 7 ambientes experimentais interativos de alta fidelidade física e química, executados inteiramente em HTML5 Canvas e React a 60 FPS, sem qualquer dependência externa, bibliotecas proprietárias de terceiros ou chamadas a nuvem.

Todos os simuladores contam com mentoria histórica socrática de figuras imortais da ciência em domínio público e sintetizador de voz nativo em Português (`pt-BR`) via Web Speech API.

---

## 🗂️ Os 7 Simuladores Integrados

| # | Simulador | Mentores Patronos | Fundamentos Físicos / Químicos / Biológicos | Métricas e Controles em Tempo Real |
|---|---|---|---|---|
| **1** | **Óptica Geométrica & Lentes** | Isaac Newton & Galileu Galilei | Equação de Gauss: $\frac{1}{f} = \frac{1}{p} + \frac{1}{p'}$, Ampliação linear transversal $A = -\frac{p'}{p}$, Lei de Snell-Descartes da Refração $n_1 \sin\theta_1 = n_2 \sin\theta_2$. | Distância focal $f$, distância do objeto $p$, altura do objeto $h$, índice de refração do meio $n$ (ar, água, vidro, diamante). Traçado em tempo real de raios notáveis e classificação da imagem (Real/Virtual, Direita/Invertida, Maior/Menor). |
| **2** | **Balística & Gravidade** | Galileu Galilei & Isaac Newton | Cinemática bidimensional com gravidade variável: $x(t) = v_0 \cos\theta \cdot t$, $y(t) = v_0 \sin\theta \cdot t - \frac{1}{2}gt^2$. Alcance máximo $R = \frac{v_0^2 \sin(2\theta)}{g}$ e altura máxima $H = \frac{v_{0y}^2}{2g}$. | Ângulo de inclinação $\theta$ (0° a 90°), velocidade inicial $v_0$ (5 a 50 m/s), corpos celestes: Terra ($9.8\text{ m/s}^2$), Lua ($1.62\text{ m/s}^2$), Marte ($3.71\text{ m/s}^2$), Júpiter ($24.8\text{ m/s}^2$). Animação balística com rastro dinâmico a 60 FPS. |
| **3** | **Eletrodinâmica & Lei de Ohm** | Marie Curie & Leonardo da Vinci | 1ª Lei de Ohm: $U = R \cdot I$, Potência dissipada por Efeito Joule: $P = U \cdot I = \frac{U^2}{R}$. Associação de resistores em série ($R_{eq} = R_1 + R_2$) e em paralelo ($R_{eq} = \frac{R_1 R_2}{R_1 + R_2}$). | Tensão da fonte $U$ (1 a 48V), resistência $R$ (1 a 100 $\Omega$), chave liga/desliga, tipo de circuito (lâmpada, resistor único, série, paralelo). Cálculo em tempo real de corrente ($I$), potência ($P$) e brilho incandescente. |
| **4** | **Genética Mendeliana** | Gregor Mendel | 1ª Lei de Mendel (Princípio da Segregação dos Fatores), Quadro de Punnett $2 \times 2$, relações de dominância completa e recessividade ($A$ vs $a$). | Seleção de genótipo parental da Geração P ($AA$, $Aa$, $aa$), cruzamento de ervilhas (cor da semente amarela vs verde), cálculo automatizado de proporção genotípica ($1:2:1$) e proporção fenotípica ($3:1$ ou $75\% / 25\%$). |
| **5** | **Tabela Periódica Interativa** | Marie Curie, Dmitri Mendeleev & Antoine Lavoisier | Lei Periódica dos Elementos Químicos, número atômico ($Z$), massa atômica ($A$), distribuição eletrônica por subníveis no Diagrama de Linus Pauling, raio atômico e famílias periódicas. | Dossiê detalhado dos elementos, número atômico, distribuição fundamental, raio atômico estimado em picômetros, notas históricas e aplicações modernas (com destaque especial ao elemento Rádio descoberto por Marie Curie). |
| **6** | **Termodinâmica dos Gases & Ciclo de Carnot** | Sadi Carnot, Lord Kelvin & Émile Clapeyron | Equação de Estado dos Gases Ideais de Clapeyron: $P \cdot V = n \cdot R \cdot T$, Energia interna do gás monoatômico: $U = \frac{3}{2} n R T$, Teorema e Rendimento Máximo de Carnot: $\eta = 1 - \frac{T_f}{T_q}$. | Cilindro pneumático com pistão móvel, $40+$ partículas com velocidade cinética $\propto \sqrt{T}$, manômetro de pressão (atm e kPa), diagramas $P \times V$ com isoterma viva, chama de calor ou resfriamento criogênico na base, presets de fontes térmicas (vapor, turbina, geotérmica). |
| **7** | **Indução Eletromagnética de Faraday-Lenz** | Michael Faraday, Heinrich Lenz & James Clerk Maxwell | Lei da Indução de Faraday-Neumann: $\varepsilon = -N \frac{d\Phi}{dt}$, Fluxo magnético através de espira: $\Phi = \int \vec{B} \cdot d\vec{A}$, Lei de Lenz (oposição do campo induzido ao fluxo indutor). | Solenoide de cobre em perspectiva 3D (5 a 50 espiras), ímã de neodímio móvel (com inversão de polos Norte/Sul), oscilação harmônica automática ou manual, galvanômetro analógico com zero central defletindo com a velocidade $dx/dt$, lâmpada acendendo com brilho proporcional a $|\varepsilon|$. |

---

## 🎨 Arquitetura de Componentes

O módulo reside em:
- **Componente**: `apps/electron/src/ui/components/ScienceSimulators.tsx`
- **Estilos**: `apps/electron/src/ui/components/ScienceSimulators.css`
- **Página Hospedeira**: `apps/electron/src/ui/pages/StudentAILab.tsx` (Aba "🧪 Simuladores Científicos")
- **Rotas Diretas**: `'ai-lab'` e `'simulators'` em `App.tsx`

---

## 💎 Gamificação & Recompensas Pedagógicas

Cada experimento calibrado pelo estudante emite uma notificação de XP soberano:
- **Óptica**: 60 XP
- **Balística**: 75 XP
- **Eletrodinâmica**: 70 XP
- **Genética**: 80 XP
- **Tabela Periódica**: 65 XP
- **Termodinâmica & Carnot**: 80 XP
- **Indução Eletromagnética**: 85 XP

As conquistas são persistidas no portfólio do aluno e exibidas instantaneamente no Portal da Família (`ParentPortal.tsx`) sob a aba "Conquistas & BNCC".
