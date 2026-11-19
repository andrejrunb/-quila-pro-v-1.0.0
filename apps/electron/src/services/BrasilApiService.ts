/**
 * BrasilApiService.ts — Integração gratuita (sem chave) com BrasilAPI + fallback ViaCEP
 *
 * Usado na MVP 0.1 para reduzir digitação e erros manuais:
 *  - Autocompletar endereço por CEP na Matrícula Inteligente (Secretaria)
 *  - Importar Feriados Nacionais oficiais no Calendário Letivo (Coordenação)
 */

export interface CepAddress {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  provider: 'BrasilAPI' | 'ViaCEP';
}

export interface NationalHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  type: string;
}

const cepCache = new Map<string, CepAddress>();
const holidayCache = new Map<number, NationalHoliday[]>();

const FALLBACK_FIXED_HOLIDAYS = (year: number): NationalHoliday[] => [
  { date: `${year}-01-01`, name: 'Confraternização Universal', type: 'national' },
  { date: `${year}-04-21`, name: 'Tiradentes', type: 'national' },
  { date: `${year}-05-01`, name: 'Dia do Trabalho', type: 'national' },
  { date: `${year}-09-07`, name: 'Independência do Brasil', type: 'national' },
  { date: `${year}-10-12`, name: 'Nossa Senhora Aparecida', type: 'national' },
  { date: `${year}-11-02`, name: 'Finados', type: 'national' },
  { date: `${year}-11-15`, name: 'Proclamação da República', type: 'national' },
  { date: `${year}-11-20`, name: 'Dia Nacional de Zumbi e da Consciência Negra', type: 'national' },
  { date: `${year}-12-25`, name: 'Natal', type: 'national' },
];

export async function lookupCep(rawCep: string): Promise<CepAddress | null> {
  const digits = (rawCep || '').replace(/\D/g, '');
  if (digits.length !== 8) return null;

  if (cepCache.has(digits)) {
    return cepCache.get(digits)!;
  }

  // 1. BrasilAPI (gratuita, sem chave)
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const addr: CepAddress = {
        cep: digits,
        street: data.street || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
        provider: 'BrasilAPI',
      };
      cepCache.set(digits, addr);
      return addr;
    }
  } catch {
    // aciona fallback ViaCEP
  }

  // 2. Fallback ViaCEP (gratuito, sem chave)
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (!data.erro) {
        const addr: CepAddress = {
          cep: digits,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          provider: 'ViaCEP',
        };
        cepCache.set(digits, addr);
        return addr;
      }
    }
  } catch {
    // offline ou indisponível
  }

  return null;
}

export async function fetchNationalHolidays(year: number): Promise<{ holidays: NationalHoliday[]; source: 'BrasilAPI' | 'offline-fallback' }> {
  if (holidayCache.has(year)) {
    return { holidays: holidayCache.get(year)!, source: 'BrasilAPI' };
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const parsed: NationalHoliday[] = data.map((item: any) => ({
          date: String(item.date || ''),
          name: String(item.name || 'Feriado Nacional'),
          type: String(item.type || 'national'),
        })).filter((h) => /^\d{4}-\d{2}-\d{2}$/.test(h.date));
        if (parsed.length > 0) {
          holidayCache.set(year, parsed);
          return { holidays: parsed, source: 'BrasilAPI' };
        }
      }
    }
  } catch {
    // fallback offline
  }

  return { holidays: FALLBACK_FIXED_HOLIDAYS(year), source: 'offline-fallback' };
}
