// ============================================================================
// 🐚 RAEA MOTION GRAPHICS COMPOSITION — BIOLOGIA: FILO MOLLUSCA (60 FPS)
// ============================================================================
// Componente de animação científica gerado para a engine RAEA (shinyobjectz/raea).
// Apresenta a anatomia, fisiologia e evolução das classes dos Moluscos:
//   - Gastrópodes (Rádula raspadora, torção visceral e pé rastejador)
//   - Bivalves (Concha bivalve, brânquias filtradoras e pé em machado)
//   - Cefalópodes (Propulsão a jato por sifão, cromatóforos e sistema fechado)
// ============================================================================

import React from "react";
import { 
  AbsoluteFill, 
  Composition, 
  Sequence, 
  interpolate, 
  spring, 
  useCurrentFrame, 
  useVideoConfig, 
  Easing, 
  registerRoot 
} from "raea";

const W = 1920;
const H = 1080;
const FPS = 60;
const TOTAL_FRAMES = 1500; // 25 segundos a 60 FPS

// ----------------------------------------------------------------------------
// ESTILOS E TOKENS VISUAIS
// ----------------------------------------------------------------------------
const COLORS = {
  bgGradient: "radial-gradient(ellipse at center, #0f1e36 0%, #050b14 100%)",
  cyanAccent: "#00f5d4",
  magentaAccent: "#f72585",
  goldAccent: "#ffd166",
  blueGlow: "#4cc9f0",
  textPrimary: "#f8f9fa",
  textSecondary: "#94a3b8",
  cardBg: "rgba(15, 23, 42, 0.85)",
  cardBorder: "rgba(56, 189, 248, 0.3)"
};

// ----------------------------------------------------------------------------
// ATO 1: INTRODUÇÃO AO FILO MOLLUSCA & PLANO CORPORAL BÁSICO (Quadros 0 a 360)
// ----------------------------------------------------------------------------
function IntroScene() {
  const f = useCurrentFrame();
  const titleSpring = spring({ frame: f, fps: FPS, config: { damping: 14, stiffness: 100 } });
  const titleY = interpolate(titleSpring, [0, 1], [-200, 80]);
  const titleOpacity = interpolate(f, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  
  // Pulsação das partículas oceânicas
  const floatY = Math.sin(f / 20) * 12;

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Título Principal com Spring Motion */}
      <div style={{
        position: "absolute",
        top: titleY,
        opacity: titleOpacity,
        textAlign: "center"
      }}>
        <div style={{ 
          fontSize: 22, 
          letterSpacing: "0.4em", 
          color: COLORS.cyanAccent, 
          fontWeight: 700, 
          textTransform: "uppercase" 
        }}>
          Ciências da Natureza • Zoologia dos Invertebrados
        </div>
        <h1 style={{ 
          fontSize: 76, 
          fontWeight: 900, 
          color: COLORS.textPrimary, 
          margin: "8px 0 0 0",
          textShadow: "0 0 35px rgba(0, 245, 212, 0.4)"
        }}>
          FILO MOLLUSCA
        </h1>
        <p style={{ fontSize: 24, color: COLORS.textSecondary, marginTop: 4 }}>
          "Corpo Mole" • Triblásticos • Celomados • Simetria Bilateral • 100.000+ Espécies
        </p>
      </div>

      {/* Diagrama Esquemático do Plano Corporal Básico (Cabeça, Pé, Massa Visceral, Manto) */}
      <div style={{
        position: "absolute",
        top: 280 + floatY,
        width: 1100,
        height: 520,
        background: COLORS.cardBg,
        borderRadius: 28,
        border: `1px solid ${COLORS.cardBorder}`,
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        display: "flex",
        overflow: "hidden"
      }}>
        {/* Renderização SVG da Anatomia do Molusco Hipotético Ancestral */}
        <div style={{ flex: 1.3, position: "relative", padding: 30 }}>
          <svg viewBox="0 0 600 400" style={{ width: "100%", height: "100%" }}>
            {/* Concha Protetora de CaCO3 */}
            <path
              d="M 120 280 C 120 120, 480 120, 500 280 Z"
              fill="url(#conchaGrad)"
              stroke="#ffd166"
              strokeWidth="4"
              opacity={interpolate(f, [30, 60], [0, 1], { extrapolateRight: "clamp" })}
            />
            {/* Manto (Epiderme secretora) */}
            <path
              d="M 130 280 C 135 150, 470 150, 490 280"
              fill="none"
              stroke="#f72585"
              strokeWidth="6"
              strokeDasharray="8 4"
            />
            {/* Massa Visceral com Órgãos e Coração */}
            <ellipse cx="320" cy="240" rx="140" ry="70" fill="rgba(76, 201, 240, 0.25)" stroke="#4cc9f0" strokeWidth="3" />
            {/* Pé Muscular Ventral para Locomoção */}
            <path
              d="M 100 320 C 200 350, 400 350, 520 320 C 480 370, 160 370, 100 320 Z"
              fill="#00f5d4"
              opacity="0.85"
            />
            {/* Cabeça com Tentáculos Oculares */}
            <circle cx="90" cy="290" r="35" fill="#00f5d4" opacity="0.9" />
            <line x1="80" y1="260" x2="60" y2="210" stroke="#00f5d4" strokeWidth="5" strokeLinecap="round" />
            <circle cx="60" cy="205" r="8" fill="#ffd166" />
            
            {/* Rádula (Língua raspadora de quitina) em ação */}
            <path
              d="M 70 300 Q 55 310 75 320"
              fill="none"
              stroke="#ffd166"
              strokeWidth="6"
              strokeLinecap="round"
            />

            <defs>
              <linearGradient id="conchaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#78350f" stopOpacity="0.9" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Painel Lateral com as 4 Estruturas Chave */}
        <div style={{ flex: 1, padding: "40px 30px", borderLeft: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
          {[
            { label: "1. Pé Muscular Ventral", desc: "Responsável pela rastejamento, escavação ou natação a jato.", color: "#00f5d4" },
            { label: "2. Massa Visceral", desc: "Abriga os sistemas digestório, excretor, reprodutor e circulatório.", color: "#4cc9f0" },
            { label: "3. Manto (Pálio)", desc: "Dobra de epiderme que secreta a concha calcária e forma a cavidade.", color: "#f72585" },
            { label: "4. Rádula", desc: "Fita quitinosa com dentículos que raspa algas e tecidos alimentares.", color: "#ffd166" }
          ].map((item, idx) => {
            const delay = 40 + idx * 15;
            const itemSpring = spring({ frame: Math.max(0, f - delay), fps: FPS });
            return (
              <div key={idx} style={{ transform: `translateX(${(1 - itemSpring) * 60}px)`, opacity: itemSpring }}>
                <div style={{ color: item.color, fontWeight: 700, fontSize: 18 }}>{item.label}</div>
                <div style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 2 }}>{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ----------------------------------------------------------------------------
// ATO 2: AS 3 GRANDES CLASSES (Quadros 360 a 1100)
// ----------------------------------------------------------------------------
function ClassesShowcase() {
  const f = useCurrentFrame();

  const classesData = [
    {
      name: "GASTRÓPODES",
      exemplos: "Caracóis, Caramujos e Lesmas",
      habitat: "Marinho, Dulcícola e Terrestre",
      destaque: "Torção corporal de 180º e concha espiral única. Pé ventral largo.",
      cor: "#00f5d4",
      icon: "🐌"
    },
    {
      name: "BIVALVES",
      exemplos: "Ostras, Mexilhões e Marisco",
      habitat: "Aquático (Exclusivamente filtradores)",
      destaque: "Concha com 2 valvas articuladas. Brânquias ciliadas filtradoras e SEM rádula.",
      cor: "#4cc9f0",
      icon: "🦪"
    },
    {
      name: "CEFALÓPODES",
      exemplos: "Polvos, Lulas e Náutilos",
      habitat: "Marinho (Predadores ágeis)",
      destaque: "Olhos complexos com cristalino, tentáculos com ventosas e propulsão a jato por sifão.",
      cor: "#f72585",
      icon: "🐙"
    }
  ];

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 100px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h2 style={{ fontSize: 52, fontWeight: 900, color: COLORS.textPrimary, margin: 0 }}>
          AS TRÊS PRINCIPAIS CLASSES
        </h2>
        <p style={{ fontSize: 20, color: COLORS.textSecondary }}>
          Adaptações morfológicas extraordinárias que conquistaram dos oceanos profundos à terra firme
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40, width: "100%", maxWidth: 1600 }}>
        {classesData.map((cls, i) => {
          const cardSpring = spring({ frame: Math.max(0, f - i * 20), fps: FPS });
          const cardScale = interpolate(cardSpring, [0, 1], [0.8, 1]);
          const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                background: COLORS.cardBg,
                borderRadius: 24,
                border: `2px solid ${cls.cor}55`,
                padding: "40px 30px",
                transform: `scale(${cardScale})`,
                opacity: cardOpacity,
                boxShadow: `0 20px 45px rgba(0,0,0,0.5), 0 0 25px ${cls.cor}22`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: 90, marginBottom: 15, filter: "drop-shadow(0 0 15px rgba(255,255,255,0.3))" }}>
                {cls.icon}
              </div>
              <h3 style={{ fontSize: 32, fontWeight: 800, color: cls.cor, margin: "0 0 8px 0" }}>
                {cls.name}
              </h3>
              <div style={{ color: COLORS.goldAccent, fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                {cls.exemplos}
              </div>
              <div style={{
                background: "rgba(255,255,255,0.06)",
                padding: "8px 16px",
                borderRadius: 12,
                fontSize: 14,
                color: COLORS.textSecondary,
                marginBottom: 20
              }}>
                📍 {cls.habitat}
              </div>
              <p style={{ fontSize: 16, color: COLORS.textPrimary, lineHeight: 1.6, margin: 0 }}>
                {cls.destaque}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ----------------------------------------------------------------------------
// ATO 3: FISIOLOGIA COMPARADA (Quadros 1100 a 1500)
// ----------------------------------------------------------------------------
function PhysiologyScene() {
  const f = useCurrentFrame();
  const pulse = Math.abs(Math.sin(f / 15));

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: 1400,
        background: COLORS.cardBg,
        borderRadius: 32,
        border: `1px solid ${COLORS.cyanAccent}66`,
        padding: "50px 60px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.7)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ color: COLORS.magentaAccent, fontWeight: 700, letterSpacing: "0.2em", fontSize: 18, textTransform: "uppercase" }}>
            Fisiologia Soberana & Circulação
          </span>
          <h2 style={{ fontSize: 48, fontWeight: 900, color: COLORS.textPrimary, margin: "6px 0 0 0" }}>
            SISTEMA CIRCULATÓRIO & PIGMENTOS RESPIRATÓRIOS
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 50 }}>
          {/* Circulatório Aberto */}
          <div style={{
            background: "rgba(0, 245, 212, 0.05)",
            border: "1px solid rgba(0, 245, 212, 0.3)",
            borderRadius: 20,
            padding: 30
          }}>
            <h4 style={{ color: COLORS.cyanAccent, fontSize: 24, margin: "0 0 10px 0" }}>
              Circulação Aberta (Lacunar)
            </h4>
            <div style={{ fontSize: 15, color: COLORS.textSecondary, marginBottom: 15 }}>
              Presente em <strong>Gastrópodes</strong> e <strong>Bivalves</strong>
            </div>
            <p style={{ fontSize: 16, color: COLORS.textPrimary, lineHeight: 1.6 }}>
              O coração bombeia a hemolinfa para vasos que desembocam em lacunas celomáticas (hemocele), banhando diretamente os tecidos sob baixa pressão arterial.
            </p>
          </div>

          {/* Circulatório Fechado */}
          <div style={{
            background: "rgba(247, 37, 133, 0.05)",
            border: `1px solid rgba(247, 37, 133, ${0.3 + pulse * 0.4})`,
            borderRadius: 20,
            padding: 30,
            boxShadow: `0 0 30px rgba(247, 37, 133, ${pulse * 0.2})`
          }}>
            <h4 style={{ color: COLORS.magentaAccent, fontSize: 24, margin: "0 0 10px 0" }}>
              Circulação Fechada (Alta Pressão)
            </h4>
            <div style={{ fontSize: 15, color: COLORS.textSecondary, marginBottom: 15 }}>
              Exclusividade dos <strong>Cefalópodes</strong> (Polvos e Lulas)
            </div>
            <p style={{ fontSize: 16, color: COLORS.textPrimary, lineHeight: 1.6 }}>
              Sangue sempre no interior de vasos capilares com 3 corações (1 sistêmico e 2 branquiais) impulsionando o sangue azul de <strong>hemocianina</strong> rica em cobre para suportar predação veloz.
            </p>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ----------------------------------------------------------------------------
// COMPOSIÇÃO MESTRE RAEA
// ----------------------------------------------------------------------------
export function MoluscosBioRaeaCinema() {
  return (
    <AbsoluteFill style={{ background: COLORS.bgGradient, fontFamily: "'Inter', sans-serif" }}>
      {/* Sequência 1: Introdução & Plano Corporal (0 a 360 = 6s) */}
      <Sequence from={0} durationInFrames={360}>
        <IntroScene />
      </Sequence>

      {/* Sequência 2: As 3 Classes de Destaque (360 a 1080 = 12s) */}
      <Sequence from={360} durationInFrames={720}>
        <ClassesShowcase />
      </Sequence>

      {/* Sequência 3: Fisiologia & Circulação (1080 a 1500 = 7s) */}
      <Sequence from={1080} durationInFrames={420}>
        <PhysiologyScene />
      </Sequence>
    </AbsoluteFill>
  );
}

// Registro oficial no Root do RAEA Engine
registerRoot(() => (
  <Composition
    id="moluscos-bio-cinema"
    component={MoluscosBioRaeaCinema}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={TOTAL_FRAMES}
  />
));
