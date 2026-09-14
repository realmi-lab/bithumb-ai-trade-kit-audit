"""Verify relative Markdown file targets in the fixed official commit. Read-only network calls."""
import urllib.request,json,re,posixpath
from pathlib import Path
commit='2b6304261c81f48256e63b0588db2ca1c44df52f'
tree=json.load(urllib.request.urlopen('https://api.github.com/repos/bithumb-official/bithumb-ai-trade-kit/git/trees/'+commit+'?recursive=1'))
files={x['path'] for x in tree['tree']};rows=[]
for name in sorted(files):
 if not name.endswith('.md'):continue
 text=urllib.request.urlopen('https://raw.githubusercontent.com/bithumb-official/bithumb-ai-trade-kit/'+commit+'/'+name).read().decode()
 for line_no,line in enumerate(text.splitlines(),1):
  for link in re.findall(r'\]\(([^)]+)\)',line):
   if '://' in link or link.startswith('#'):continue
   target=link.split('#')[0]
   if target and posixpath.normpath(posixpath.join(posixpath.dirname(name),target)) not in files:
    rows.append({'file':name,'line':line_no,'link':link})
Path('md-review-20260914/missing-links.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print(json.dumps(rows,ensure_ascii=False,indent=2))
