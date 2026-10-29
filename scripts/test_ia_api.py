import urllib.request
import json

identifier = 'cultoDever'
url = f'https://archive.org/metadata/{identifier}'
req = urllib.request.Request(url, headers={'User-Agent': 'AquilaPro-Curator/1.0 (Educational Academic Non-Profit Curator; mailto:dev@aquila.local)'})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        server = data.get('server')
        dir_path = data.get('dir')
        files = data.get('files', [])
        metadata = data.get('metadata', {})
        print(f"Identifier: {identifier}")
        print(f"Server: {server}, Dir: {dir_path}")
        print(f"Metadata Title: {metadata.get('title')}")
        print(f"Total files: {len(files)}")
        for f in files[:8]:
            print(f"  - {f.get('name')} | Format: {f.get('format')} | Size: {f.get('size')}")
except Exception as e:
    print('Error:', e)
