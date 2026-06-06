import re

with open('frontend/src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace lazy imports
content = re.sub(r"const\s+([A-Za-z0-9_]+)\s*=\s*lazy\(\(\)\s*=>\s*import\('([^']+)'\)\);", r"import \1 from '\2';", content)

# Remove Suspense wrapper tags
content = re.sub(r'<Suspense fallback=\{.*?\}>', '', content)
content = re.sub(r'</Suspense>', '', content)

with open('frontend/src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
