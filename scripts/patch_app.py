import os

file_path = r'c:\aquila\apps\electron\src\App.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add 'ai-studio' and 'activity-factory' to Page type
target1 = "'classroom-dashboard';"
repl1 = "'classroom-dashboard' | 'ai-studio' | 'activity-factory';"
if target1 in content:
    content = content.replace(target1, repl1, 1)
    print("Updated Page type")
else:
    print("target1 not found")

# 2. Add 'ai-studio', 'activity-factory', 'mastery-chamber' to isTeacherPage
target2 = "'tasks', 'whiteboard', 'daily-report'"
repl2 = "'tasks', 'whiteboard', 'daily-report', 'mastery-chamber', 'ai-studio', 'activity-factory'"
if target2 in content:
    content = content.replace(target2, repl2, 1)
    print("Updated isTeacherPage")
else:
    print("target2 not found")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied to App.tsx")
