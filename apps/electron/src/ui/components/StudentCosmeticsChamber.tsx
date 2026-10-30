import React, { useState, useEffect } from 'react';
import {
  Sparkles, Award, Shield, Palette, Layers, Star, Zap,
  CheckCircle, Lock, Crown, Gem, Gift, HelpCircle, Eye,
  ChevronRight, Compass, Flame, Box, User
} from 'lucide-react';
import './StudentCosmeticsChamber.css';

export interface CosmeticCardItem {
  id: string;
  title: string;
  discipline: string;
  rarity: 'Comum' | 'Rara' | 'Épica' | 'Lendária' | 'Campeão';
  rarityColor: string;
  category: 'skin_avatar' | 'banner_bg' | 'moldura_frame' | 'emblema_badge' | 'emote_animado';
  previewIcon: string;
  historicalRef: string;
  bnccSkill: string;
  costAureus: number;
  unlocked: boolean;
  equipped: boolean;
  description: string;
}

export const CLASH_ROYALE_STYLE_COSMETICS: CosmeticCardItem[] = [
  // AVATARES & SKINS (MODALIDADE PERSONAGEM)
  {
    id: 'cosm_tesla_master',
    title: 'Nikola Tesla • Mestre dos Raios',
    discipline: 'Física',
    rarity: 'Campeão',
    rarityColor: '#06b6d4', // Teal/Cyan
    category: 'skin_avatar',
    previewIcon: '⚡',
    historicalRef: 'Expedição da Eletricidade & Corrente Alternada',
    bnccSkill: 'EM13CNT106',
    costAureus: 1200,
    unlocked: true,
    equipped: true,
    description: 'Traje épico com bobina de indução pulsante e aura de faíscas em corrente alternada.'
  },
  {
    id: 'cosm_firmina_guardia',
    title: 'Maria Firmina dos Reis • Pioneira das Letras',
    discipline: 'Literatura',
    rarity: 'Lendária',
    rarityColor: '#eab308', // Gold/Yellow
    category: 'skin_avatar',
    previewIcon: '📜',
    historicalRef: 'Autora de Úrsula (1859) & Primeira Romancista Negra',
    bnccSkill: 'EM13LP48',
    costAureus: 1000,
    unlocked: false,
    equipped: false,
    description: 'Vestimenta de gala imperial com manuscritos iluminados e pena de ouro autoral.'
  },
  {
    id: 'cosm_ada_lovelace',
    title: 'Ada Lovelace • Tecelã de Algoritmos',
    discipline: 'Matemática & Computação',
    rarity: 'Épica',
    rarityColor: '#a855f7', // Purple
    category: 'skin_avatar',
    previewIcon: '💾',
    historicalRef: 'Primeira Programadora da História & Máquina Analítica',
    bnccSkill: 'EM13MAT504',
    costAureus: 800,
    unlocked: true,
    equipped: false,
    description: 'Estética steampunk vitoriana com matrizes perfuradas flutuantes e engrenagens mecânicas.'
  },

  // BANNERS DE PERFIL (BACKGROUND CLASH ROYALE STYLE)
  {
    id: 'banner_wardenclyffe',
    title: 'Torre de Wardenclyffe Noturna',
    discipline: 'Física & Engenharia',
    rarity: 'Lendária',
    rarityColor: '#eab308',
    category: 'banner_bg',
    previewIcon: '🗼',
    historicalRef: 'Torre Transmissora de Energia sem Fios de Long Island',
    bnccSkill: 'EM13CNT308',
    costAureus: 650,
    unlocked: true,
    equipped: true,
    description: 'Cenário panorâmico com relâmpagos violeta e céu estrelado sob a lendária torre de Tesla.'
  },
  {
    id: 'banner_machado_academia',
    title: 'Gabinete Bruxo do Cosme Velho',
    discipline: 'Língua Portuguesa',
    rarity: 'Rara',
    rarityColor: '#f97316', // Orange
    category: 'banner_bg',
    previewIcon: '📚',
    historicalRef: 'Fundação da Academia Brasileira de Letras (1897)',
    bnccSkill: 'EM13LP01',
    costAureus: 450,
    unlocked: false,
    equipped: false,
    description: 'Estante de jacarandá repleta de primeiras edições de Dom Casmurro e Quincas Borba.'
  },
  {
    id: 'banner_floresta_merian',
    title: 'Expedição Botânica do Suriname',
    discipline: 'Biologia',
    rarity: 'Épica',
    rarityColor: '#a855f7',
    category: 'banner_bg',
    previewIcon: '🦋',
    historicalRef: 'Maria Sibylla Merian & Metamorfose dos Insetos (1705)',
    bnccSkill: 'EM13CNT202',
    costAureus: 600,
    unlocked: false,
    equipped: false,
    description: 'Floresta tropical exuberante com borboletas azuis Morpho e ilustrações científicas aquareladas.'
  },

  // MOLDURAS DE PERFIL / FRAMES (CHAMPION & EVOLUTION TIERS)
  {
    id: 'frame_plasma_arc',
    title: 'Moldura Arco de Plasma Trifásico',
    discipline: 'Física',
    rarity: 'Campeão',
    rarityColor: '#06b6d4',
    category: 'moldura_frame',
    previewIcon: '🔷',
    historicalRef: 'Motor de Indução Polifásico de Tesla',
    bnccSkill: 'EM13CNT106',
    costAureus: 900,
    unlocked: true,
    equipped: true,
    description: 'Borda metálica escovada com arcos elétricos animados de alta voltagem contornando a foto do perfil.'
  },
  {
    id: 'frame_louros_literarios',
    title: 'Moldura Ramos de Louro Dourado',
    discipline: 'Humanidades',
    rarity: 'Rara',
    rarityColor: '#f97316',
    category: 'moldura_frame',
    previewIcon: '🌿',
    historicalRef: 'Reconhecimento Máximo em Oratória e Produção Textual',
    bnccSkill: 'EM13LP48',
    costAureus: 350,
    unlocked: false,
    equipped: false,
    description: 'Moldura de ouro nobre polido inspirada nas honrarias clássicas da literatura universal.'
  },

  // EMBLEMAS & BADGES DE MAESTRIA (3 SLOTS EXIBÍVEIS)
  {
    id: 'badge_resolucao_problemas',
    title: 'Emblema Coerência em Resolução de Problemas',
    discipline: 'Exames & Vestibulares',
    rarity: 'Lendária',
    rarityColor: '#eab308',
    category: 'emblema_badge',
    previewIcon: '🛡️',
    historicalRef: 'Consistência de Coerência Pedagógica Teoria de Resposta ao Item',
    bnccSkill: 'EM13MAT309',
    costAureus: 500,
    unlocked: true,
    equipped: true,
    description: 'Reconhece consistência metodológica em exercícios diagnósticos (visibilidade privada por padrão).'
  },
  {
    id: 'badge_olimpiada_oba',
    title: 'Distintivo Prática Astro-Física (Preparatório OBA)',
    discipline: 'Astronomia',
    rarity: 'Campeão',
    rarityColor: '#06b6d4',
    category: 'emblema_badge',
    previewIcon: '🥇',
    historicalRef: 'Olimpíada Brasileira de Astronomia e Astronáutica',
    bnccSkill: 'EM13CNT204',
    costAureus: 750,
    unlocked: true,
    equipped: true,
    description: 'Concedido após estudo e resolução de desafios formativos de gravitação e mecânica celeste.'
  },

  // EMOTES ANIMADOS DE REAÇÃO EM DUELOS PEDAGÓGICOS
  {
    id: 'emote_tesla_eureca',
    title: 'Emote Tesla Eureca! (Relâmpago na Lâmpada)',
    discipline: 'Física',
    rarity: 'Comum',
    rarityColor: '#9ca3af',
    category: 'emote_animado',
    previewIcon: '💡',
    historicalRef: 'Invenção da Lâmpada Fluorescente sem Fios',
    bnccSkill: 'EM13CNT106',
    costAureus: 200,
    unlocked: true,
    equipped: true,
    description: 'Tesla ergue uma lâmpada fluorescente que acende no ar com som de centelha.'
  },
  {
    id: 'emote_machado_ironia',
    title: 'Emote Machado da Piscadela Irônica',
    discipline: 'Literatura',
    rarity: 'Épica',
    rarityColor: '#a855f7',
    category: 'emote_animado',
    previewIcon: '🧐',
    historicalRef: 'Ironia Fina Machadiana',
    bnccSkill: 'EM13LP01',
    costAureus: 500,
    unlocked: false,
    equipped: false,
    description: 'Machado ajeita o pince-nez com sorriso enigmático ao acertar uma questão complexa.'
  }
];

export const StudentCosmeticsChamber: React.FC<{ studentId?: string; onBack?: () => void }> = ({ studentId = 'aluno_demo', onBack }) => {
  const [items, setItems] = useState<CosmeticCardItem[]>(CLASH_ROYALE_STYLE_COSMETICS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [aureusBalance, setAureusBalance] = useState<number>(2450);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);

  useEffect(() => {
    async function syncWithService() {
      try {
        const api = (window as any).aquila?.cosmetics;
        if (!api) return;
        const catalogItems = await api.getCatalog();
        const studentState = await api.getInventory(studentId);
        if (catalogItems && catalogItems.length > 0) {
          const mapped: CosmeticCardItem[] = catalogItems.map((cat: any) => {
            const unlocked = studentState?.unlockedItemIds?.includes(cat.itemId) ?? false;
            const equipped = Object.values(studentState?.equippedSlots || {}).includes(cat.itemId);
            const categoryMap: Record<string, any> = {
              avatar_skin: 'skin_avatar',
              avatar_frame: 'moldura_frame',
              profile_theme: 'banner_bg',
              title: 'emblema_badge',
              emote: 'emote_animado',
              arena_theme: 'banner_bg'
            };
            const rarityMap: Record<string, any> = {
              comum: 'Comum',
              raro: 'Rara',
              epico: 'Épica',
              lendario: 'Lendária',
              campeao: 'Campeão'
            };
            const rarityColors: Record<string, string> = {
              comum: '#9ca3af',
              raro: '#3b82f6',
              epico: '#a855f7',
              lendario: '#eab308',
              campeao: '#06b6d4'
            };
            const icons: Record<string, string> = {
              avatar_skin: '👤',
              avatar_frame: '🖼️',
              profile_theme: '🌄',
              title: '👑',
              emote: '💡',
              arena_theme: '⚔️'
            };
            return {
              id: cat.itemId,
              title: cat.name,
              discipline: cat.subject || 'Interdisciplinar',
              rarity: rarityMap[cat.rarity] || 'Rara',
              rarityColor: rarityColors[cat.rarity] || '#3b82f6',
              category: categoryMap[cat.category] || 'skin_avatar',
              previewIcon: icons[cat.category] || '✨',
              historicalRef: cat.description || cat.name,
              bnccSkill: cat.audit?.grantPolicy || 'BNCC Geral',
              costAureus: cat.priceCoins,
              unlocked,
              equipped,
              description: cat.description || cat.name
            };
          });
          setItems(mapped);
        }
      } catch {
        // Fallback gracioso para os itens locais
      }
    }
    syncWithService();
  }, [studentId]);

  const filteredItems = items.filter(
    item => selectedCategory === 'all' || item.category === selectedCategory
  );

  const equippedAvatar = items.find(i => i.category === 'skin_avatar' && i.equipped);
  const equippedBanner = items.find(i => i.category === 'banner_bg' && i.equipped);
  const equippedFrame = items.find(i => i.category === 'moldura_frame' && i.equipped);
  const equippedBadges = items.filter(i => i.category === 'emblema_badge' && i.equipped);

  const playSfx = (type: 'equip' | 'unlock' | 'warn') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'equip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'unlock') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // AudioContext unavailable or autoplay blocked
    }
  };


  const handleEquip = async (itemId: string) => {
    const api = (window as any).aquila?.cosmetics;
    if (api) {
      try {
        await api.equip(studentId, itemId);
      } catch {
        // fallback
      }
    }
    setItems(prev => {
      const target = prev.find(i => i.id === itemId);
      if (!target) return prev;
      return prev.map(item => {
        if (item.category === target.category) {
          return { ...item, equipped: item.id === itemId };
        }
        return item;
      });
    });
    playSfx('equip');
    setFeedbackMsg({ text: 'Item equipado no seu Battle Banner de Estudante!', type: 'success' });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleUnlock = async (item: CosmeticCardItem) => {
    const api = (window as any).aquila?.cosmetics;
    if (api) {
      try {
        const res = await api.purchase(studentId, item.id, aureusBalance);
        if (!res.success) {
          playSfx('warn');
          setFeedbackMsg({ text: res.error || 'Não foi possível concluir o desbloqueio.', type: 'warn' });
          setTimeout(() => setFeedbackMsg(null), 3500);
          return;
        }
        playSfx('unlock');
        setAureusBalance(res.newBalance);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, unlocked: true } : i));
        setFeedbackMsg({ text: `🎉 Parabéns! Você desbloqueou '${item.title}'!`, type: 'success' });
        setTimeout(() => setFeedbackMsg(null), 3500);
        return;
      } catch {
        // fallback para execução local
      }
    }

    if (aureusBalance < item.costAureus) {
      playSfx('warn');
      setFeedbackMsg({ text: `Saldo insuficiente (${aureusBalance} Aureus). Conclua missões de evidência para receber moedas cosméticas!`, type: 'warn' });
      setTimeout(() => setFeedbackMsg(null), 3500);
      return;
    }
    playSfx('unlock');
    setAureusBalance(prev => prev - item.costAureus);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, unlocked: true } : i));
    setFeedbackMsg({ text: `🎉 Parabéns! Você desbloqueou '${item.title}'!`, type: 'success' });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <main className="cr-chamber-root" role="main" aria-label="Câmara de Cosméticos e Identidade Estudantil Áquila">
      {/* CABEÇALHO DO ESTUDANTE COM MOEDA COSMÉTICA */}
      {onBack && (
        <div style={{ padding: '8px 24px 0 24px' }}>
          <button
            onClick={onBack}
            className="cr-back-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
            aria-label="Voltar para a Área do Aluno"
          >
            ← Voltar ao Portal do Aluno
          </button>
        </div>
      )}
      <header className="cr-chamber-header" role="banner">
        <div className="cr-brand-group">
          <div className="cr-brand-badge" role="note" aria-label="Aviso de Conformidade Educacional">
            <Crown className="w-4 h-4 text-amber-400 mr-1.5 inline" aria-hidden="true" />
            <span>SISTEMA VISUAL ÁQUILA • PERSONALIZAÇÃO PEDAGÓGICA</span>
          </div>
          <h1 className="cr-title">Coleção de Avatares, Banners & Emblemas</h1>
          <p className="cr-subtitle">
            Personalize seu Painel de Identidade Estudantil (Battle Banner Pedagógico). Recompensas cosméticas 100% decorativas, vinculadas ao domínio de habilidades BNCC e sem compras com dinheiro real (Conformidade ECA Digital Lei nº 15.211/2025).
          </p>
        </div>

        <div className="cr-wallet-badge" role="status" aria-label={`Saldo da Moeda Cosmética: ${aureusBalance.toLocaleString('pt-BR')} Aureus`}>
          <Gem className="w-5 h-5 text-amber-300 mr-2" aria-hidden="true" />
          <div className="cr-wallet-info">
            <span className="cr-wallet-label">MOEDA COSMÉTICA</span>
            <span className="cr-wallet-value">{aureusBalance.toLocaleString('pt-BR')} Aureus</span>
          </div>
        </div>
      </header>

      {feedbackMsg && (
        <div
          className={`cr-feedback-toast ${feedbackMsg.type}`}
          role="status"
          aria-live="polite"
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* PREVIEW DO BATTLE BANNER DO ALUNO (ESTILO CLASH ROYALE) */}
      <section className="cr-banner-preview-section" aria-label="Prévia do seu Battle Banner Estudantil">
        <div className="cr-banner-preview-box">
          <div className="cr-banner-bg" style={{ borderColor: equippedFrame?.rarityColor || '#a855f7' }}>
            <div className="cr-banner-bg-art">
              <span className="cr-banner-bg-icon" aria-hidden="true">{equippedBanner?.previewIcon || '🌌'}</span>
              <span className="cr-banner-bg-name">{equippedBanner?.title || 'Banner Padrão Áquila'}</span>
            </div>

            <div className="cr-banner-profile-strip">
              <div className="cr-avatar-frame-wrap" style={{ borderColor: equippedFrame?.rarityColor || '#06b6d4' }}>
                <span className="cr-avatar-emoji" aria-hidden="true">{equippedAvatar?.previewIcon || '⚡'}</span>
              </div>
              <div className="cr-profile-texts">
                <div className="cr-profile-name">
                  <span>Estudante Soberano</span>
                  <span className="cr-level-pill" aria-label="Nível pedagógico 14">Nível 14</span>
                </div>
                <div className="cr-profile-title">{equippedAvatar?.title || 'Explorador da Ciência'}</div>
              </div>
            </div>

            <div className="cr-banner-badges-rack" aria-label="Emblemas de Maestria em exibição">
              {equippedBadges.map(b => (
                <div key={b.id} className="cr-mini-badge-slot" title={`${b.title} (${b.rarity})`} aria-label={`Emblema: ${b.title}`}>
                  <span aria-hidden="true">{b.previewIcon}</span>
                </div>
              ))}
              {equippedBadges.length === 0 && <span className="text-xs text-gray-400">Nenhum emblema equipado</span>}
            </div>
          </div>
        </div>
      </section>

      {/* FILTROS POR CATEGORIA DO SHOPPING */}
      <nav className="cr-category-nav" role="navigation" aria-label="Filtro de Cosméticos por Categoria">
        {[
          { id: 'all', label: 'Tudo', icon: <Box className="w-4 h-4 mr-1.5" aria-hidden="true" /> },
          { id: 'skin_avatar', label: 'Personagens & Skins', icon: <User className="w-4 h-4 mr-1.5" aria-hidden="true" /> },
          { id: 'banner_bg', label: 'Banners de Fundo', icon: <Palette className="w-4 h-4 mr-1.5" aria-hidden="true" /> },
          { id: 'moldura_frame', label: 'Molduras Animadas', icon: <Layers className="w-4 h-4 mr-1.5" aria-hidden="true" /> },
          { id: 'emblema_badge', label: 'Emblemas de Maestria', icon: <Award className="w-4 h-4 mr-1.5" aria-hidden="true" /> },
          { id: 'emote_animado', label: 'Emotes de Duelo', icon: <Zap className="w-4 h-4 mr-1.5" aria-hidden="true" /> },
        ].map(cat => (
          <button
            key={cat.id}
            type="button"
            className={`cr-cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
            aria-pressed={selectedCategory === cat.id}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </nav>

      {/* GRID DE CARTÕES EM ESTILO CLASH ROYALE */}
      <section className="cr-cards-grid" aria-label="Itens Disponíveis para Desbloqueio e Uso">
        {filteredItems.map(item => (
          <article
            key={item.id}
            className={`cr-cosmetic-card ${item.unlocked ? 'unlocked' : 'locked'} ${item.equipped ? 'equipped' : ''}`}
            style={{ '--rarity-glow': item.rarityColor } as any}
            aria-label={`Cartão de ${item.title}`}
          >
            <div className="cr-card-header" style={{ borderBottomColor: item.rarityColor }}>
              <span className="cr-rarity-badge" style={{ backgroundColor: item.rarityColor }} aria-label={`Raridade: ${item.rarity}`}>
                {item.rarity}
              </span>
              <span className="cr-discipline-tag">{item.discipline}</span>
            </div>

            <div className="cr-card-art-box">
              <span className="cr-card-art-emoji" aria-hidden="true">{item.previewIcon}</span>
              {item.equipped && (
                <div className="cr-equipped-ribbon" role="status" aria-label="Item atualmente equipado">
                  <CheckCircle className="w-4 h-4 mr-1 inline" aria-hidden="true" /> EQUIPADO
                </div>
              )}
            </div>

            <div className="cr-card-body">
              <h3 className="cr-card-name">{item.title}</h3>
              <p className="cr-card-ref">🏛️ {item.historicalRef}</p>
              <p className="cr-card-desc">{item.description}</p>
              <div className="cr-card-bncc">Habilidade: <strong>{item.bnccSkill}</strong></div>
            </div>

            <div className="cr-card-action">
              {item.unlocked ? (
                item.equipped ? (
                  <button
                    type="button"
                    className="cr-btn-equipped"
                    disabled
                    aria-label={`${item.title} está em uso no seu banner`}
                  >
                    <CheckCircle className="w-4 h-4 mr-1 inline" aria-hidden="true" /> Em Uso
                  </button>
                ) : (
                  <button
                    type="button"
                    className="cr-btn-equip"
                    onClick={() => handleEquip(item.id)}
                    aria-label={`Equipar ${item.title} no seu banner`}
                  >
                    Equipar
                  </button>
                )
              ) : (
                <button
                  type="button"
                  className="cr-btn-buy"
                  onClick={() => handleUnlock(item)}
                  aria-label={`Desbloquear ${item.title} por ${item.costAureus} moedas Aureus`}
                >
                  <Lock className="w-4 h-4 mr-1.5 inline" aria-hidden="true" /> Desbloquear por {item.costAureus} Aureus
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};

export default StudentCosmeticsChamber;
