import urllib.request
import urllib.parse
import ssl
import re
import json
import time

urls = [
    ("Passeando UnB (Vestibular UnB)", "https://passeandounb.com/vestibular-unb-provas-anteriores/"),
    ("EducaBras (Provas de Vestibular Download)", "https://www.educabras.com/provas_de_vestibular/download"),
    ("Aprenda Jogando", "https://aprendajogando.com/"),
    ("São Paulo Liberdade", "https://saopauloliberdade.com.br/"),
    ("CapacitaCoop (Jogar Mais Aprender)", "https://capacita.coop.br/jogar-mais-aprender"),
    ("Somos Cooperativismo (Jogar e Aprender OCB)", "https://somoscooperativismo.coop.br/solucoes/capacitacoop/jogar-aprender"),
    ("e-Docente PNLD (SOMOS Educação)", "https://www.edocente.com.br/pnld/segmento/ensino-medio"),
    ("Coquinhos (Jogos 12-15 anos)", "https://www.coquinhos.com/category/jogos-para-criancas-12-15-anos/"),
    ("Escola Games (Portal Geral)", "https://www.escolagames.com.br/"),
    ("SEED-PR Escola Digital (Games)", "https://aluno.escoladigital.pr.gov.br/games"),
    ("SMECD Jogos Educativos (Google Sites)", "https://sites.google.com/view/smecd/jogos-educativos"),
    ("Ensinar História (Joelza Domingues)", "https://ensinarhistoria.com.br/jogos-variados/"),
    ("NOAS (Ensino Médio)", "https://www.noas.com.br/ensino-medio"),
    ("Escola Games (Floresta Mágica)", "https://www.escolagames.com.br/jogos/floresta-magica"),
    ("Legends of Learning", "https://www.legendsoflearning.com/"),
    ("NOAA NESDIS (Educational Games & Simulations)", "https://www.nesdis.noaa.gov/about/k-12-education/educational-games-simulations"),
    ("LiveBinder #1568005 (Curated Web Tech)", "https://www.livebinders.com/b/1568005")
]

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
}

results = []

for name, url in urls:
    print(f"Probing {name} -> {url}...")
    item = {
        "name": name,
        "url": url,
        "status": None,
        "content_type": None,
        "title": None,
        "engine_tech": [],
        "adtech_trackers": [],
        "offline_viability": "Desconhecido",
        "api_reach_tier": "Tier 1",
        "embed_iframe": [],
        "interactive_assets": [],
        "sample_links": [],
        "html_size": 0,
        "error": None
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=12) as response:
            item["status"] = response.getcode()
            item["content_type"] = response.info().get_content_type()
            raw_data = response.read(1024 * 512) # first 512KB
            item["html_size"] = len(raw_data)
            html = raw_data.decode('utf-8', errors='ignore')
            
            # Title
            m_title = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
            if m_title:
                item["title"] = m_title.group(1).strip()
                
            # Engine / Tech detection
            if "wp-content" in html or "wordpress" in html.lower():
                item["engine_tech"].append("WordPress CMS")
            if "unity" in html.lower() or "unityloader" in html.lower() or "build.json" in html.lower():
                item["engine_tech"].append("Unity WebGL")
            if "phaser" in html.lower():
                item["engine_tech"].append("Phaser JS Game Engine")
            if "construct" in html.lower() or "c2runtime" in html.lower() or "c3runtime" in html.lower():
                item["engine_tech"].append("Construct 2/3 HTML5")
            if "createjs" in html.lower() or "easeljs" in html.lower():
                item["engine_tech"].append("CreateJS / Adobe Animate Canvas")
            if "pixi" in html.lower():
                item["engine_tech"].append("PixiJS WebGL")
            if "sites.google.com" in url or "googlegroups" in html:
                item["engine_tech"].append("Google Sites Platform")
            if "next" in html or "__NEXT_DATA__" in html:
                item["engine_tech"].append("Next.js / React")
            if "livebinders.com" in url:
                item["engine_tech"].append("LiveBinders Tabbed Binder Architecture")
            if "pdf" in html.lower():
                item["engine_tech"].append("PDF Asset Repository")
                
            # Trackers / AdTech detection
            if "googletagmanager.com" in html or "google-analytics.com" in html or "gtag" in html:
                item["adtech_trackers"].append("Google Analytics / GTM")
            if "googlesyndication.com" in html or "adsbygoogle" in html:
                item["adtech_trackers"].append("Google AdSense (Display Ads)")
            if "connect.facebook.net" in html:
                item["adtech_trackers"].append("Facebook Pixel")
            if "criteo" in html.lower():
                item["adtech_trackers"].append("Criteo Retargeting")
            if "taboola" in html.lower() or "outbrain" in html.lower():
                item["adtech_trackers"].append("Taboola/Outbrain Native Ads")
            if "hotjar" in html.lower():
                item["adtech_trackers"].append("Hotjar Session Recording")
                
            # Iframes / embeds
            iframes = re.findall(r'<iframe[^>]+src=["\'](.*?)["\']', html, re.IGNORECASE)
            item["embed_iframe"] = iframes[:5]
            
            # Asset links (pdf, swf, zip, html5 games)
            interactive = re.findall(r'href=["\']([^"\']+\.(?:pdf|zip|swf|json|mp4))["\']', html, re.IGNORECASE)
            item["interactive_assets"] = list(set(interactive))[:8]
            
            # Sample anchors
            anchors = re.findall(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html, re.IGNORECASE | re.DOTALL)
            clean_anchors = []
            for href, text in anchors:
                txt = re.sub(r'<[^>]+>', '', text).strip()
                if txt and len(txt) > 3 and not href.startswith('#') and not href.startswith('javascript:'):
                    clean_anchors.append(f"{txt} -> {href}")
            item["sample_links"] = clean_anchors[:6]
            
            # Offline Viability Assessment
            if "Google AdSense" in item["adtech_trackers"] or "Criteo Retargeting" in item["adtech_trackers"]:
                item["offline_viability"] = "Restrita Online (Poluição AdTech: Requer Higienização Soberana ou Emulação Local)"
            elif any(x in item["engine_tech"] for x in ["CreateJS / Adobe Animate Canvas", "Phaser JS Game Engine", "Construct 2/3 HTML5", "Unity WebGL"]):
                item["offline_viability"] = "Alta (Ativos HTML5/Canvas/WebGL isoláveis em sandbox local)"
            elif "PDF Asset Repository" in item["engine_tech"]:
                item["offline_viability"] = "Total (PDFs e cadernos de provas baixáveis para SQLite local)"
            else:
                item["offline_viability"] = "Média (Páginas estáticas/HTML extraíveis via API Anything Tier 1)"
                
    except Exception as e:
        item["error"] = str(e)
        print(f"Error on {name}: {e}")
        
    results.append(item)
    time.sleep(0.3)

with open(r'C:\Users\Thaysa\.gemini\antigravity\brain\5fca40fa-e48d-4bc6-bc7a-084bf4a62fe4\scratch\agent_reach_rea_results.json', 'w', encoding='utf-8') as out:
    json.dump(results, out, ensure_ascii=False, indent=2)

print("\n--- PROBE COMPLETO. Resumo gravado em scratch/agent_reach_rea_results.json ---")
