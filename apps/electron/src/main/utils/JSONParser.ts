/**
 * JSON PARSER UTILITY
 * -------------------
 * Extrai e limpa JSON de respostas de LLMs, lidando com blocos de markdown,
 * espaços em branco e textos introdutórios.
 */
export class JSONParser {
  /**
   * Tenta extrair o primeiro objeto ou array JSON válido de uma string.
   */
  public static parseSafe<T>(text: string): T {
    try {
      // 1. Remover blocos de código markdown (```json ... ``` ou ``` ...)
      let cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1');
      
      // 2. Tentar encontrar o primeiro '{' ou '[' e o último '}' ou ']'
      const firstBrace = cleaned.indexOf('{');
      const firstBracket = cleaned.indexOf('[');
      
      let start = -1;
      let end = -1;
      
      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
        end = cleaned.lastIndexOf('}');
      } else if (firstBracket !== -1) {
        start = firstBracket;
        end = cleaned.lastIndexOf(']');
      }
      
      if (start === -1 || end === -1 || end < start) {
        // Se não encontrar delimitadores, tenta o parse da string inteira (fallback)
        return JSON.parse(cleaned.trim());
      }
      
      const jsonCandidate = cleaned.substring(start, end + 1);
      return JSON.parse(jsonCandidate);
    } catch (err) {
      console.error('[JSONParser] Falha ao parsear JSON:', err);
      throw new Error(`Invalid JSON format: ${err}`);
    }
  }
}
