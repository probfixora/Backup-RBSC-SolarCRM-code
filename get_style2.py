import fitz
import sys

doc = fitz.open(sys.argv[1])
out = open('style.txt', 'w', encoding='utf-8')
for i, page in enumerate(doc[:1]):
    out.write(f"PAGE {i+1}\n")
    blocks = page.get_text("dict")["blocks"]
    for block in blocks:
        if "lines" in block:
            for line in block["lines"]:
                for span in line["spans"]:
                    color_hex = f"#{span['color']:06x}" if span['color'] >= 0 else "#000000"
                    text = span["text"].strip().replace("\n", " ").encode('ascii', 'ignore').decode()
                    if text:
                        out.write(f"{text[:30]:<30} Color: {color_hex} Size: {span['size']:.1f} Font: {span['font']}\n")
doc.close()
out.close()
