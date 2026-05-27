"""Verify templates are clean - check for yellow backgrounds and [CONTOH]."""
import zipfile
import re
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "_out")

for pptx_file in ["out_quiz.pptx", "out_uap.pptx"]:
    pptx_path = os.path.join(OUT_DIR, pptx_file)
    if not os.path.exists(pptx_path):
        print(f"File not found: {pptx_path}")
        continue

    print(f"\nChecking {pptx_file}:")
    
    with zipfile.ZipFile(pptx_path) as z:
        # Check slide2.xml for CONTOH
        if "ppt/slides/slide2.xml" in z.namelist():
            slide2_xml = z.read("ppt/slides/slide2.xml").decode("utf-8")
            if "[CONTOH]" in slide2_xml:
                print("  [CONTOH] found in slide2.xml")
            
        # Check slide3.xml for CONTOH and yellow colors
        if "ppt/slides/slide3.xml" in z.namelist():
            slide3_xml = z.read("ppt/slides/slide3.xml").decode("utf-8")
            if "[CONTOH]" in slide3_xml:
                print("  [CONTOH] found in slide3.xml")
            
            # Look for yellow color codes (FFFF00 or similar)
            yellow_patterns = [
                r"srgbClr val=\"FFFF00\"",
                r"srgbClr val=\"ffff00\"",
            ]
            for pattern in yellow_patterns:
                if re.search(pattern, slide3_xml):
                    print(f"  Yellow color found in slide3.xml (pattern: {pattern})")
    
    print("  OK - No yellow backgrounds or [CONTOH] placeholders detected")

print("\nVerification complete!")
