import zipfile
import os

template_dir = os.path.join(os.path.dirname(__file__), "..", "PPT")
templates = [
    "02. [For Mhs] [Not For Share] - Briefing Pelaksanaan TM Even 2526.pptx",
    "02. [For Mhs] [Not For Share] - Briefing Pelaksanaan UAP dan Kumpul Proyek Even 2526.pptx",
]

print("Verifying template cleanup:\n")

for template_name in templates:
    template_path = os.path.join(template_dir, template_name)
    print(f"Template: {template_name}")
    
    with zipfile.ZipFile(template_path) as z:
        for slide_num in [2, 3]:
            slide_path = f"ppt/slides/slide{slide_num}.xml"
            if slide_path in z.namelist():
                xml_content = z.read(slide_path).decode('utf-8')
                
                if "<a:highlight>" in xml_content:
                    print(f"  [WARN] slide{slide_num}: <a:highlight> elements still present")
                elif "FFFF00" in xml_content or "ffff00" in xml_content:
                    print(f"  [WARN] slide{slide_num}: Yellow color code (FFFF00) still present")
                else:
                    print(f"  [OK] slide{slide_num}: No yellow highlights")
                
                if "[CONTOH]" in xml_content:
                    print(f"  [WARN] slide{slide_num}: [CONTOH] placeholder still present")
    
    print()

print("Verification complete!")
