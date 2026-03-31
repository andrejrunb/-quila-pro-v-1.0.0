# 📹 Sistema de Mapeamento de Câmeras - Áquila Pro

## Visão Geral

O Sistema Áquila Pro utiliza um **modelo híbrido de mapeamento de câmeras** que combina:
1. **Captura automática de imagens** das câmeras
2. **Interface interativa** para o usuário desenhar/editar o mapa
3. **Análise inteligente** para sugerir posições ideais de câmeras
4. **Integração em tempo real** entre câmeras e mapa

---

## 🎯 Fluxo de Funcionamento

### Fase 1: Captura e Processamento Inicial

```
Câmeras Ligadas na Escola
        ↓
Captura de Frames (RTSP/HTTP)
        ↓
Processamento com OpenCV
        ↓
Detecção de Estruturas (paredes, portas, janelas)
        ↓
Geração de Imagem Base para Mapa
        ↓
Envio para Frontend
```

**O que acontece:**
- Câmeras capturam vídeo contínuo
- Sistema extrai frames periodicamente
- Processamento de imagem detecta estruturas físicas
- Cria uma "imagem base" da área monitorada

**Exemplo de Detecção:**
```python
# Pseudocódigo - Detecção de estruturas
import cv2
import numpy as np

frame = capture_camera_frame()
gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

# Detectar bordas (paredes, portas)
edges = cv2.Canny(gray, 100, 200)

# Detectar linhas (estrutura do ambiente)
lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=50, maxLineGap=10)

# Detectar contornos (objetos)
contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

return {
    "edges": edges,
    "lines": lines,
    "contours": contours,
    "structureMap": generate_structure_map(lines, contours)
}
```

---

### Fase 2: Interface Interativa do Usuário

```
Frontend Carrega Imagem Base
        ↓
Usuário Vê Mapa com Estruturas Detectadas
        ↓
Usuário Pode:
  ├─ Editar/Desenhar Estruturas
  ├─ Adicionar Elementos Manuais
  ├─ Marcar Áreas de Interesse
  └─ Posicionar Câmeras no Mapa
        ↓
Usuário Salva Mapa Customizado
```

**Componentes da UI:**

```typescript
// Componente de Editor de Mapa
<MapEditor>
  <Canvas ref={canvasRef} />
  
  <Toolbar>
    <DrawingTools>
      - Desenhar paredes
      - Desenhar portas
      - Desenhar janelas
      - Desenhar escadas
    </DrawingTools>
    
    <CameraTools>
      - Adicionar câmera
      - Remover câmera
      - Editar posição
      - Editar ângulo de visão
    </CameraTools>
    
    <AreaTools>
      - Marcar área crítica
      - Marcar zona de entrada
      - Marcar zona de saída
    </AreaTools>
  </Toolbar>
  
  <Properties>
    - Informações da câmera selecionada
    - Cobertura de visão
    - Resolução
    - Ângulo de visão
  </Properties>
</MapEditor>
```

---

### Fase 3: Análise Inteligente de Posicionamento

O sistema analisa o mapa e **sugere as melhores posições** para câmeras:

```
Mapa Customizado do Usuário
        ↓
Análise de Cobertura Atual
  ├─ Áreas cobertas
  ├─ Áreas sem cobertura (blind spots)
  └─ Sobreposição de câmeras
        ↓
Análise de Prioridades
  ├─ Entradas/saídas
  ├─ Áreas críticas (pátio, corredores)
  ├─ Pontos de risco (escadas, isoladas)
  └─ Áreas públicas vs privadas
        ↓
Geração de Sugestões com IA
  ├─ Posição ideal (X, Y)
  ├─ Ângulo recomendado
  ├─ Tipo de câmera (PTZ, fixa, etc)
  ├─ Prioridade (alta, média, baixa)
  └─ Justificativa da sugestão
        ↓
Apresentação ao Usuário
```

**Algoritmo de Análise (Pseudocódigo):**

```python
def analyze_camera_coverage(school_map, existing_cameras):
    """
    Analisa o mapa da escola e sugere posições ideais para câmeras
    """
    
    # 1. Detectar áreas críticas
    critical_areas = detect_critical_areas(school_map)
    # Resultado: [(entrada_principal, HIGH), (pátio, HIGH), (escadas, MEDIUM), ...]
    
    # 2. Calcular cobertura atual
    coverage_map = calculate_coverage(existing_cameras, school_map)
    # Resultado: matriz 2D com % de cobertura em cada ponto
    
    # 3. Identificar blind spots
    blind_spots = find_blind_spots(coverage_map, threshold=0.3)
    # Resultado: [(x1, y1, area1), (x2, y2, area2), ...]
    
    # 4. Gerar sugestões
    suggestions = []
    for area in critical_areas:
        if area not in coverage_map or coverage_map[area] < 0.8:
            # Calcular posição ideal
            ideal_position = calculate_ideal_position(
                area=area,
                existing_cameras=existing_cameras,
                school_map=school_map
            )
            
            suggestion = {
                "position": ideal_position,
                "angle": calculate_optimal_angle(area, ideal_position),
                "camera_type": recommend_camera_type(area),
                "priority": calculate_priority(area),
                "coverage_improvement": calculate_coverage_gain(ideal_position),
                "justification": generate_justification(area, ideal_position)
            }
            suggestions.append(suggestion)
    
    return sorted(suggestions, key=lambda x: x['priority'], reverse=True)
```

**Exemplo de Sugestão:**

```json
{
  "id": "suggestion_001",
  "position": {
    "x": 150,
    "y": 200,
    "floor": 1
  },
  "angle": {
    "pan": 45,
    "tilt": 15,
    "zoom": 1.5
  },
  "cameraType": "PTZ (Pan-Tilt-Zoom)",
  "priority": "HIGH",
  "coverageImprovement": {
    "newCoverage": "92%",
    "previousCoverage": "65%",
    "gain": "27%"
  },
  "blindSpotsResolved": 3,
  "justification": "Posição estratégica na entrada principal. Cobrirá 3 áreas atualmente sem monitoramento (corredor norte, escadas de emergência, zona de saída). Ângulo de 45° oferece melhor visão frontal dos rostos dos alunos.",
  "estimatedCost": "$2500",
  "installationDifficulty": "MEDIUM"
}
```

---

## 🗺️ Estrutura do Mapa

### Dados Armazenados

```typescript
interface SchoolMap {
  id: string;
  schoolName: string;
  floor: number;
  
  // Estrutura física
  structures: Structure[];
  
  // Câmeras
  cameras: CameraPlacement[];
  
  // Áreas de interesse
  criticalAreas: CriticalArea[];
  
  // Análise
  analysis: CoverageAnalysis;
  
  // Metadados
  createdAt: Date;
  updatedAt: Date;
  createdBy: User;
}

interface Structure {
  id: string;
  type: "wall" | "door" | "window" | "stairs" | "custom";
  points: Point[];
  properties: {
    color?: string;
    label?: string;
    material?: string;
  };
}

interface CameraPlacement {
  id: string;
  name: string;
  position: Point3D;
  angle: {
    pan: number;    // 0-360°
    tilt: number;   // -90 a +90°
    zoom: number;   // 1-10x
  };
  type: "fixed" | "ptz" | "dome" | "bullet";
  resolution: "720p" | "1080p" | "2k" | "4k";
  fov: number;     // Field of View em graus
  coverage: Polygon;  // Área de cobertura no mapa
  status: "active" | "inactive" | "suggested";
  rtspUrl?: string;
}

interface CriticalArea {
  id: string;
  name: string;
  type: "entrance" | "exit" | "playground" | "corridor" | "staircase" | "isolated";
  polygon: Point[];
  priority: "HIGH" | "MEDIUM" | "LOW";
  riskLevel: number;  // 0-100
}

interface CoverageAnalysis {
  totalArea: number;
  coveredArea: number;
  coveragePercentage: number;
  blindSpots: BlindSpot[];
  recommendations: CameraRecommendation[];
  lastAnalyzedAt: Date;
}
```

---

## 🤖 Detecção em Tempo Real

### Como Funciona a Integração

```
Mapa Criado pelo Usuário
        ↓
Sistema Conhece Posições das Câmeras
        ↓
Câmeras Capturam Vídeo
        ↓
Processamento com IA (YOLO, DeepSORT)
        ↓
Detecção de Pessoas
        ↓
Correlação com Mapa
  ├─ Qual câmera detectou?
  ├─ Qual posição no mapa?
  ├─ Qual área crítica?
  └─ Qual aluno?
        ↓
Alertas Inteligentes
  ├─ Saída não autorizada
  ├─ Presença em área restrita
  ├─ Aglomeração
  └─ Comportamento anômalo
```

**Exemplo de Detecção Integrada:**

```python
def process_camera_feed_with_map(camera_id, frame, school_map):
    """
    Processa feed da câmera com conhecimento do mapa
    """
    
    # 1. Detectar pessoas no frame
    detections = yolo_detect(frame)
    # Resultado: [{"person": {...}, "bbox": [x1, y1, x2, y2], "confidence": 0.95}, ...]
    
    # 2. Obter posição da câmera no mapa
    camera = school_map.get_camera(camera_id)
    camera_position = camera.position
    camera_fov = camera.coverage  # Polígono de cobertura
    
    # 3. Mapear detecções para coordenadas do mapa
    for detection in detections:
        # Converter bbox do frame para coordenadas do mapa
        map_position = convert_frame_to_map_coordinates(
            bbox=detection['bbox'],
            camera=camera,
            frame_size=(1920, 1080)
        )
        
        # 4. Verificar se está em área crítica
        critical_area = school_map.get_critical_area_at(map_position)
        
        # 5. Verificar se é comportamento anômalo
        if is_anomalous(detection, critical_area):
            alert = generate_alert(
                person=detection,
                location=map_position,
                critical_area=critical_area,
                camera=camera,
                reason="unauthorized_area"
            )
            send_alert(alert)
    
    return detections_with_map_context
```

---

## 🎨 Interface do Usuário

### Página de Mapeamento

```
┌─────────────────────────────────────────────────────────┐
│  Áquila Pro - Mapeamento de Câmeras                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Escola: ABC] [Andar: 1] [Zoom: 100%]                 │
│                                                         │
│  ┌──────────────────────┬──────────────────────────┐   │
│  │                      │  Ferramentas:            │   │
│  │                      │  ☐ Desenhar Parede      │   │
│  │                      │  ☐ Desenhar Porta       │   │
│  │                      │  ☐ Desenhar Janela      │   │
│  │   [MAPA DA ESCOLA]   │  ☐ Adicionar Câmera     │   │
│  │                      │  ☐ Marcar Área Crítica  │   │
│  │   📷 Câm 1 (ativa)   │                          │   │
│  │   📷 Câm 2 (ativa)   │  Sugestões:             │   │
│  │   📷 Câm 3 (inativa) │  ⭐ Sugestão 1 (HIGH)   │   │
│  │   ⚠️ Blind Spot 1    │  ⭐ Sugestão 2 (MED)    │   │
│  │   ⚠️ Blind Spot 2    │  ⭐ Sugestão 3 (LOW)    │   │
│  │                      │                          │   │
│  │  Cobertura: 78%      │  [Analisar] [Salvar]    │   │
│  └──────────────────────┴──────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Painel de Sugestões

Quando o usuário clica em "Analisar", o sistema mostra:

```
┌─────────────────────────────────────────────────────────┐
│  Análise de Cobertura - Recomendações                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Cobertura Atual: 78% | Potencial: 95%                 │
│                                                         │
│  ┌─ SUGESTÃO 1 (ALTA PRIORIDADE) ─────────────────┐   │
│  │ Posição: Entrada Principal                      │   │
│  │ Tipo: PTZ (Pan-Tilt-Zoom)                       │   │
│  │ Melhoria: +15% de cobertura                     │   │
│  │ Justificativa: Monitora entrada principal e     │   │
│  │ corredores adjacentes. Resolve 3 blind spots.   │   │
│  │ [Adicionar ao Mapa] [Ver Detalhes]              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ SUGESTÃO 2 (MÉDIA PRIORIDADE) ─────────────────┐   │
│  │ Posição: Pátio (canto NE)                       │   │
│  │ Tipo: Câmera Fixa                               │   │
│  │ Melhoria: +8% de cobertura                      │   │
│  │ Justificativa: Cobertura do pátio atualmente    │   │
│  │ limitada. Ideal para monitorar brincadeiras.    │   │
│  │ [Adicionar ao Mapa] [Ver Detalhes]              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ SUGESTÃO 3 (BAIXA PRIORIDADE) ──────────────────┐  │
│  │ Posição: Corredor Sul                           │   │
│  │ Tipo: Câmera Dome                               │   │
│  │ Melhoria: +4% de cobertura                      │   │
│  │ Justificativa: Redundância. Melhora cobertura   │   │
│  │ em caso de falha de câmera adjacente.            │   │
│  │ [Adicionar ao Mapa] [Ver Detalhes]              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Aplicar Todas] [Descartar] [Salvar Análise]          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 💾 Fluxo de Dados Completo

```
┌─────────────────────────────────────────────────────────┐
│ 1. CAPTURA                                              │
│ Câmeras → Frames → Processamento OpenCV                │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 2. MAPEAMENTO                                           │
│ Usuário Edita Mapa → Posiciona Câmeras → Marca Áreas  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 3. ANÁLISE                                              │
│ Sistema Analisa Cobertura → Gera Sugestões → IA       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 4. INTEGRAÇÃO                                           │
│ Mapa Salvo → Câmeras Conhecem Posições → BD Atualizado│
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 5. DETECÇÃO EM TEMPO REAL                              │
│ Câmeras Capturam → IA Detecta → Correlação com Mapa   │
│ → Alertas Inteligentes                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Workflow Completo do Usuário

### Cenário: Primeira Implementação

**Dia 1: Captura Inicial**
```
1. Admin acessa "Mapeamento de Câmeras"
2. Sistema captura frames de todas as câmeras
3. Processamento detecta estruturas (paredes, portas, etc)
4. Mapa base é gerado automaticamente
5. Admin visualiza mapa com estruturas detectadas
```

**Dia 2: Customização**
```
1. Admin edita o mapa (desenha estruturas faltantes)
2. Admin marca áreas críticas (entrada, pátio, escadas)
3. Admin posiciona câmeras no mapa
4. Admin define ângulo e zoom de cada câmera
5. Mapa é salvo no banco de dados
```

**Dia 3: Análise e Otimização**
```
1. Admin clica "Analisar Cobertura"
2. Sistema calcula cobertura atual (78%)
3. Sistema identifica 5 blind spots
4. Sistema gera 3 sugestões de novas câmeras
5. Admin revisa sugestões e aceita as mais relevantes
6. Sugestões são adicionadas ao mapa
```

**Dia 4+: Monitoramento**
```
1. Câmeras ligadas capturam vídeo
2. Sistema detecta pessoas em tempo real
3. IA correlaciona detecções com mapa
4. Alertas são enviados se comportamento anômalo
5. Admin visualiza eventos no mapa interativo
```

---

## 📊 Dados Armazenados no Banco

```sql
-- Tabela de Mapas da Escola
CREATE TABLE school_maps (
  id INT PRIMARY KEY,
  school_id INT NOT NULL,
  floor_number INT,
  map_image_url VARCHAR(500),
  total_area FLOAT,
  covered_area FLOAT,
  coverage_percentage FLOAT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Tabela de Câmeras no Mapa
CREATE TABLE camera_placements (
  id INT PRIMARY KEY,
  map_id INT NOT NULL,
  camera_id INT NOT NULL,
  position_x FLOAT,
  position_y FLOAT,
  position_z FLOAT,
  pan_angle FLOAT,
  tilt_angle FLOAT,
  zoom FLOAT,
  field_of_view FLOAT,
  coverage_polygon JSON,
  status VARCHAR(50),
  rtsp_url VARCHAR(500)
);

-- Tabela de Áreas Críticas
CREATE TABLE critical_areas (
  id INT PRIMARY KEY,
  map_id INT NOT NULL,
  area_name VARCHAR(255),
  area_type VARCHAR(50),
  polygon JSON,
  priority VARCHAR(50),
  risk_level INT
);

-- Tabela de Sugestões
CREATE TABLE camera_suggestions (
  id INT PRIMARY KEY,
  map_id INT NOT NULL,
  suggested_position_x FLOAT,
  suggested_position_y FLOAT,
  suggested_type VARCHAR(50),
  priority VARCHAR(50),
  coverage_improvement FLOAT,
  justification TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP
);
```

---

## 🎯 Resposta Direta às Suas Perguntas

### 1. **Vai fazer um mapa automaticamente ou o usuário desenha?**

**Resposta: HÍBRIDO**
- ✅ Sistema detecta automaticamente estruturas das câmeras
- ✅ Usuário customiza e edita o mapa
- ✅ Usuário marca áreas críticas manualmente
- ✅ Sistema correlaciona tudo

### 2. **Vai fazer detecção através da câmera ou junto com o mapa?**

**Resposta: INTEGRADO**
- ✅ Câmeras capturam vídeo
- ✅ IA detecta pessoas em tempo real
- ✅ Sistema **correlaciona com o mapa** para saber exatamente onde está cada pessoa
- ✅ Alertas são contextualizados (ex: "Aluno saindo pela porta norte")

### 3. **Sistema indicaria as melhores posições para câmeras?**

**Resposta: SIM, COM IA**
- ✅ Analisa cobertura atual
- ✅ Identifica blind spots
- ✅ Sugere posições ideais com prioridade
- ✅ Explica cada sugestão
- ✅ Estima melhoria de cobertura
- ✅ Recomenda tipo de câmera

---

## 🚀 Próximas Implementações

1. **Heatmap de Movimento** - Visualizar áreas mais movimentadas
2. **Análise de Fluxo** - Rastrear movimento de pessoas entre câmeras
3. **Detecção de Objetos** - Identificar mochilas, objetos deixados, etc
4. **Integração com Planta Baixa** - Importar plantas em PDF/CAD
5. **Realidade Aumentada** - Visualizar cobertura em tempo real com RA

---

**Última atualização:** 27 de Fevereiro de 2026
**Versão:** 1.0.0
