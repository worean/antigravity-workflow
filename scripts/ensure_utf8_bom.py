import os
import sys

def ensure_bom(filepath):
    if not os.path.isfile(filepath):
        return
    with open(filepath, 'rb') as f:
        content = f.read()
    if not content.startswith(b'\xef\xbb\xbf'):
        with open(filepath, 'wb') as f:
            f.write(b'\xef\xbb\xbf' + content)
        print(f"Added BOM: {filepath}")
    else:
        print(f"Already has BOM: {filepath}")

if __name__ == '__main__':
    for p in sys.argv[1:]:
        ensure_bom(p)
