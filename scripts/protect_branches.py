import os
import subprocess
import urllib.request
import urllib.error
import json
import re

token = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')
if not token:
    try:
        # Extrai token da URL remota do Git se disponível em memória
        remote_url = subprocess.check_output(['git', 'remote', 'get-url', 'origin'], text=True).strip()
        match = re.search(r'https://[^:]+:([^@]+)@github\.com', remote_url)
        if match:
            token = match.group(1)
    except Exception:
        pass

if not token:
    print("GITHUB_TOKEN not found in environment or git remote.")
    exit(1)

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Aquila-Auditor',
    'Content-Type': 'application/json'
}

branches = ['main', 'clean-release-v1']

payload = {
    "required_status_checks": {
        "strict": True,
        "contexts": [
            "Security and Secret Audit",
            "TypeScript Strict Check and ESLint",
            "Automated Test Suite and LGPD Integrity",
            "Production Build Verification"
        ]
    },
    "enforce_admins": False,
    "required_pull_request_reviews": None,
    "restrictions": None,
    "allow_force_pushes": False,
    "allow_deletions": False
}

for b in branches:
    url = f"https://api.github.com/repos/andrejrunb/-quila-pro-v-1.0.0/branches/{b}/protection"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='PUT')
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            print(f"Successfully configured Enterprise protection for {b}!")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        print(f"HTTP Error {e.code} for {b}: {err_msg}")
    except Exception as e:
        print(f"Error for {b}: {e}")
