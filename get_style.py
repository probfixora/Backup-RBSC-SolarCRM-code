import fitz
import sys

doc = fitz.open(sys.argv[1])
for i, page in enumerate(doc[:1]):
    print(f"PAGE {i+1}")
    blocks = page.get_text("dict")["blocks"]
    for block in blocks:
        if "lines" in block:
            for line in block["lines"]:
                for span in line["spans"]:
                    # ensure size and color
                    color_hex = f"#{span['color']:06x}" if span['color'] >= 0 else "#000000"
                    # clean text
                    text = span["text"].strip().replace("\n", " ").encode('ascii', 'ignore').decode()
                    if text:
                        print(f"{text[:40]:<40} Color: {color_hex} Size: {span['size']:.1f} Font: {span['font']}")
doc.close()
