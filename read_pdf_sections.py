import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

path = os.path.join(os.path.dirname(__file__), 'pdf_content.txt')

try:
    with open(path, encoding='utf-16-le', errors='replace') as f:
        content = f.read()
except Exception as e:
    # try other encodings
    for enc in ['utf-8', 'utf-16', 'cp1250', 'latin-1']:
        try:
            with open(path, encoding=enc, errors='replace') as f:
                content = f.read()
            print(f"Opened with {enc}")
            break
        except:
            pass

# Find "Main page Területek" section
idx = content.find('Main page Ter')
print(f"Found at index: {idx}")
if idx >= 0:
    print(content[max(0,idx-200):idx+3000])
else:
    # Try searching for buttons referenced from main pages
    for term in ['Rakod', 'Fuvarmegbiz', 'Telephelyek', 'Planning', 'Bejelentkezés']:
        idx2 = content.find(f'Form_{term}')
        if idx2 >= 0:
            print(f"\n=== Form_{term} at {idx2} ===")
            print(content[max(0,idx2-50):idx2+400])
