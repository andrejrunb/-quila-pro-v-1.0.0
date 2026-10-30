import urllib.request
import re

url = "https://create.kahoot.it/creator/05c029d8-4b5a-4451-a570-24d2146c412d"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
html = urllib.request.urlopen(req).read().decode('utf-8')

with open("c:/aquila/logs/kahoot_creator.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Saved HTML, length:", len(html))

# Check for initial state or json
matches = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
print("Inline script count:", len(matches))
for i, m in enumerate(matches):
    if len(m.strip()) > 0:
        print(f"\n[Inline Script {i}]")
        print(m.strip()[:400])

srcs = re.findall(r'src=["\']([^"\']+)["\']', html)
print("\nScript SRCs:")
for s in srcs:
    if "js" in s:
        print(" ", s)
