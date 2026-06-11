import sys
import pypdf
import re

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r"c:\Users\klara\Documents\Nepelemes ügyek\Gavá\ERP Access\Gava Access ERP Wiki\Access VBA kódok.pdf"

try:
    reader = pypdf.PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
        
    # Extract all Form_ names
    forms = set(re.findall(r'Form_([a-zA-Z0-9_ öüóűőúéáí]+)', text))
    print("Forms found in PDF:")
    for f in sorted(forms):
        print(f" - {f.strip()}")
        
    print("\n" + "="*50 + "\n")
    
    # Search for OpenForm commands
    open_forms = set(re.findall(r'DoCmd\.OpenForm\s+"([^"]+)"', text))
    print("DoCmd.OpenForm calls found:")
    for of in sorted(open_forms):
        print(f" - {of}")

    print("\n" + "="*50 + "\n")
    
    # Try to find what buttons are on "Fuvarok main page" or related
    # Let's search for "fuvarok" (case insensitive) and print a bit of context
    for m in re.finditer(r'(?i)fuvarok', text):
        start = max(0, m.start() - 50)
        end = min(len(text), m.end() + 200)
        snippet = text[start:end].replace('\n', ' ')
        if 'DoCmd.OpenForm' in snippet:
            print(f"Found 'fuvarok' near OpenForm: {snippet}")

except Exception as e:
    print(f"Error: {e}")
