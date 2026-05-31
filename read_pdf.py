import fitz  # PyMuPDF
import sys

def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    for i, page in enumerate(doc):
        print(f"--- PAGE {i+1} ---")
        # Extract blocks to get better layout info
        blocks = page.get_text("blocks")
        # Sort blocks top-to-bottom, left-to-right
        blocks.sort(key=lambda b: (b[1], b[0]))
        for b in blocks:
            print(b[4].strip())
    doc.close()

if __name__ == "__main__":
    extract_text(sys.argv[1])
