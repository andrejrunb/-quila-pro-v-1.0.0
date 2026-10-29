with open('scripts/build_full_interview_data_part9.py', 'r', encoding='utf-8') as f:
    text = f.read()

target = '"docs/pedagogical/",\n             "docs/pedagogical/WHITE_PAPER_TRI_AQUILA.md",'
replacement = '"docs/pedagogical/WHITE_PAPER_TRI_AQUILA.md",'

assert target in text, "Target not found!"
text = text.replace(target, replacement)

with open('scripts/build_full_interview_data_part9.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Successfully fixed AQ-376 in part9.")
