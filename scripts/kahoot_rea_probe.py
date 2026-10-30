import urllib.request
import urllib.parse
import ssl
import re
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*'
}

kahoot_id = "05c029d8-4b5a-4451-a570-24d2146c412d"

# Potential Kahoot API endpoints for quizes / drafts / creator
potential_endpoints = [
    f"https://create.kahoot.it/rest/kahoots/{kahoot_id}",
    f"https://create.kahoot.it/rest/kahoots/{kahoot_id}/card/?includeKahoot=true",
    f"https://play.kahoot.it/rest/kahoots/{kahoot_id}",
    f"https://apis.kahoot.it/kahoots/{kahoot_id}",
    f"https://create.kahoot.it/rest/drafts/{kahoot_id}",
    f"https://create.kahoot.it/details/{kahoot_id}",
    f"https://create.kahoot.it/rest/v2/kahoots/{kahoot_id}"
]

print(f"=== REA / AGENT REACH: Investigating Kahoot ID: {kahoot_id} ===")

for url in potential_endpoints:
    print(f"\n[PROBE] GET {url}")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=8) as resp:
            status = resp.getcode()
            ctype = resp.headers.get('Content-Type', '')
            data = resp.read()
            print(f"  -> HTTP {status} | Type: {ctype} | Size: {len(data)} bytes")
            if 'json' in ctype:
                js = json.loads(data.decode('utf-8'))
                print("  -> JSON Keys:", list(js.keys())[:10])
                if "title" in js:
                    print("  -> Title:", js.get("title"))
                if "questions" in js:
                    print("  -> Questions count:", len(js.get("questions", [])))
                    for idx, q in enumerate(js.get("questions", [])[:3]):
                        print(f"     Q{idx+1}: {q.get('question')} (type: {q.get('type')}, time: {q.get('time')}ms)")
                with open(r'c:\aquila\logs\kahoot_data.json', 'w', encoding='utf-8') as f:
                    json.dump(js, f, ensure_ascii=False, indent=2)
                print("  -> SALVO EM logs/kahoot_data.json")
                break
    except urllib.error.HTTPError as he:
        print(f"  -> HTTP {he.code}: {he.reason}")
    except Exception as e:
        print(f"  -> Erro: {e}")
