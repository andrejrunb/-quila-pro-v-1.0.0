import { NextRequest, NextResponse } from "next/server";

// Modelo Oficial Gemini Nano Banana (2026 GA)
const NANO_BANANA_MODEL = "gemini-nano-banana-2.1";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

interface GenerateAvatarRequest {
  heroName: string;
  heroDescription: string;
  mood?: "happy" | "angry" | "crying";
  type?: "hero" | "pet" | "cosmetic";
}

const MOOD_INSTRUCTIONS = {
  happy: "Expressão facial: Sorriso amigável e confiante, olhos abertos e expressivos, humor alegre de vitória e celebração.",
  angry: "Expressão facial: Olhar sério, sobrancelhas cerradas em determinação de batalha e modo desafio focado.",
  crying: "Expressão facial: Olhinhos marejados cômicos com pequenas gotinhas de lágrimas estilo anime/cartoon, boquinha triste de ter errado a questão."
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    const body: GenerateAvatarRequest = await req.json();
    const { heroName, heroDescription, mood = "happy", type = "hero" } = body;

    let prompt = "";

    if (type === "hero") {
      prompt = `
Uma ilustração de busto 3D de alta qualidade no estilo mobile cartoon premium de jogos como Brawl Stars e Clash Royale.
Personagem: ${heroName} (${heroDescription}).
${MOOD_INSTRUCTIONS[mood]}

REGRAS RIGOROSAS DE ENQUADRAMENTO E GABARITO VISUAL:
- Enquadramento: Centralizado, vista estritamente frontal (sem rotação de perfil), busto do peito até o topo da cabeça.
- Proporção anatômica: Linha dos olhos localizada a 45% do topo da imagem. Topo da cabeça com espaço livre para chapéus.
- Fundo: FUNDO VERDE CHROMA KEY PURO LISO (#00FF00), totalmente uniforme, sem sombras, sem gradiente.
- Traço: Bordas limpas e nítidas para recorte perfeito, sem óculos ou chapéus adicionais.
- Cores vibrantes com iluminação suave estilo render 3D estilizado.
      `.trim();
    } else if (type === "pet") {
      prompt = `
Uma ilustração 3D fofa e estilizada de um mascote companheiro (pet) de videogame mobile.
Mascote: ${heroName} — ${heroDescription}.
Estilo: Cartoon 3D vibrante, adorável, cores saturadas neon.
REGRAS:
- Vista frontal centralizada, ocupando 80% do enquadramento quadrado 1:1.
- FUNDO VERDE CHROMA KEY PURO LISO (#00FF00), sem sombras projetadas no chão.
      `.trim();
    } else {
      prompt = `
Um item colecionável de videogame mobile (acessório cosmético).
Item: ${heroName} — ${heroDescription}.
Estilo: Render 3D estilizado de alta definição, detalhes metálicos ou holográficos neon.
REGRAS:
- Centralizado em ângulo frontal perfeito.
- FUNDO VERDE CHROMA KEY PURO LISO (#00FF00), sem reflexos externos.
- Objeto isolado sem manequim ou cabeça humana por trás.
      `.trim();
    }

    // Chamada à API oficial do Gemini com o Nano Banana
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: NANO_BANANA_MODEL,
        input: prompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Erro na API do Gemini: ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extrai a imagem em Base64
    let base64Image: string | null = null;
    if (data.output_image?.data) {
      base64Image = data.output_image.data;
    } else if (Array.isArray(data.steps)) {
      for (const step of data.steps) {
        for (const item of step.content || []) {
          if (item.type === "image" && item.data) {
            base64Image = item.data;
            break;
          }
        }
        if (base64Image) break;
      }
    }

    if (!base64Image) {
      return NextResponse.json(
        { error: "Nenhuma imagem retornada pelo modelo Nano Banana." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      model: NANO_BANANA_MODEL,
      imageUri: `data:image/png;base64,${base64Image}`
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
