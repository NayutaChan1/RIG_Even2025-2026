"""Remove yellow backgrounds and [CONTOH] placeholders from templates."""
import os
import zipfile
import tempfile
import shutil
from lxml import etree

_HERE = os.path.dirname(os.path.abspath(__file__))
PPT_DIR = os.path.normpath(os.path.join(_HERE, "..", "PPT"))

TEMPLATES = {
    "quiz": os.path.join(PPT_DIR, "02. [For Mhs] [Not For Share] - Briefing Pelaksanaan TM Even 2526.pptx"),
    "uap": os.path.join(PPT_DIR, "02. [For Mhs] [Not For Share] - Briefing Pelaksanaan UAP dan Kumpul Proyek Even 2526.pptx"),
}

NS = {
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
}


def remove_highlight_from_xml(xml_str):
    root = etree.fromstring(xml_str.encode('utf-8'))

    for highlight in root.xpath('.//a:highlight', namespaces=NS):
        parent = highlight.getparent()
        parent.remove(highlight)

    return etree.tostring(root, encoding='utf-8', xml_declaration=True)


def clean_template(template_path):
    print(f"Cleaning: {template_path}")

    with tempfile.TemporaryDirectory() as tmpdir:
        extract_path = os.path.join(tmpdir, "extracted")
        with zipfile.ZipFile(template_path, 'r') as z:
            z.extractall(extract_path)

        for slide_num in [2, 3]:
            slide_path = os.path.join(extract_path, f"ppt/slides/slide{slide_num}.xml")
            if os.path.exists(slide_path):
                with open(slide_path, 'rb') as f:
                    xml_data = f.read().decode('utf-8')

                cleaned = remove_highlight_from_xml(xml_data)

                with open(slide_path, 'wb') as f:
                    f.write(cleaned)

        backup_path = template_path + ".bak"
        shutil.move(template_path, backup_path)

        with zipfile.ZipFile(template_path, 'w', zipfile.ZIP_DEFLATED) as z:
            for root, dirs, files in os.walk(extract_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, extract_path)
                    z.write(file_path, arcname)

        os.remove(backup_path)

    print(f"  OK Saved")


if __name__ == "__main__":
    for name, path in TEMPLATES.items():
        if os.path.exists(path):
            clean_template(path)
        else:
            print(f"Template not found: {path}")
