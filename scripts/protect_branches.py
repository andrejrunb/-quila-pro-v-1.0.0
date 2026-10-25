import os
import urllib.request
import urllib.error
import json

token = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')
if not token:
    print("GITHUB_TOKEN not found in environment. Please export GITHUB_TOKEN=<token>")
    exit(1)

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Aquila-Auditor',
    'Content-Type': 'application/json'
}

branches = ['main', 'clean-release-v1']

# Proteção Rigorosa de Nível Enterprise (Auditoria v2.1.0-rc.7)
payload = {
    "required_status_checks": {
        "strict": True,
        "contexts": [
            "🛡️ Security & Secret Audit",
            "🔍 TypeScript Strict Check & ESLint",
            "🧪 Automated Test Suite & LGPD Integrity",
            "🏗️ Production Build Verification"
        ]
    },
    "enforce_admins": True,
    "required_pull_request_reviews": {
        "dismiss_stale_reviews": True,
        "require_code_owner_reviews": True,
        "required_approving_review_count": 1
    },
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
            print(f" - Required checks: {res.get('required_status_checks', {}).get('contexts')}")
            print(f" - Enforce admins: {res.get('enforce_admins', {}).get('enabled')}")
            print(f" - Code owner reviews: {res.get('required_pull_request_reviews', {}).get('require_code_owner_reviews')}")
            print(f" - Allow force pushes: {res.get('allow_force_pushes', {}).get('enabled')}")
            print(f" - Allow deletions: {res.get('allow_deletions', {}).get('enabled')}")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        print(f"HTTP Error {e.code} for {b}: {err_msg}")
    except Exception as e:
        print(f"Error for {b}: {e}")
