import zipfile
import xml.dom.minidom as minidom
import os

template_path = os.path.join(os.path.dirname(__file__), "..", "PPT", 
    "02. [For Mhs] [Not For Share] - Briefing Pelaksanaan TM Even 2526.pptx")

with zipfile.ZipFile(template_path) as z:
    slide3_xml = z.read("ppt/slides/slide3.xml").decode("utf-8")
    
try:
    dom = minidom.parseString(slide3_xml)
    pretty = dom.toprettyxml(indent="  ")
    lines = pretty.split('\n')
    for i, line in enumerate(lines):
        if 'FFFF00' in line or 'ffff00' in line:
            start = max(0, i-3)
            end = min(len(lines), i+4)
            print(f"Yellow found at line {i}:")
            for j in range(start, end):
                marker = " >>> " if j == i else "     "
                print(f"{marker}{lines[j]}")
            print()
except Exception as e:
    print(f"Error: {e}")
    for i, line in enumerate(slide3_xml.split('\n')):
        if 'FFFF00' in line or 'ffff00' in line:
            print(f"Line {i}: {line}")
