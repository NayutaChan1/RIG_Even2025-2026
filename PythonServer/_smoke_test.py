from __future__ import annotations

import os
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import main

OUT = os.path.join(HERE, "_out")
os.makedirs(OUT, exist_ok=True)

MOCK_DESC = "COMP6799049-Database Technology BA06  721"
MOCK_LINK = "https://line.me/ti/g/MOCK_GROUP_ABC"

MOCK_COURSE = {
    "course_code": "COMP6799049",
    "course_name": "Database Technology",
    "software": [
        {"name": "Android SDK API 35"},
        {"name": "Frida 17.6.2"},
        {"name": "Python 3.12.4"},
        {"name": "apktool v2.7.0"},
    ],
    "info": [
        {
            "component": "Quiz",
            "meeting": 6,
            "extension": "DOCX",
            "notes": [
                "Held for 100 minutes at the beginning of the practicum",
                "Each group contains 1 - 3 members (for F2F practicum session)",
                "Maximum file size 50 Mb",
                "Using lab.slc.net",
            ],
        },
        {
            "component": "UAP",
            "meeting": 12,
            "extension": "PDF",
            "notes": [
                "Held for 120 minutes at the beginning of the practicum",
                "Each group contains 1 members",
                "Maximum file size 75 Mb",
            ],
        },
    ],
}


def assert_eq(label, got, want):
    status = "OK " if got == want else "FAIL"
    print(f"  {status}  {label}: got={got!r} want={want!r}")
    assert got == want, f"{label} mismatch"


def test_parse_description():
    print("[1] parse_description")
    kd, nama, kls = main.parse_description(MOCK_DESC)
    assert_eq("KdMtk", kd, "COMP6799049")
    assert_eq("NamaMtk", nama, "Database Technology")
    assert_eq("KdKelas", kls, "BA06")


def test_parse_notes():
    print("[2] parse_notes")
    parsed = main.parse_notes(MOCK_COURSE["info"][0]["notes"])
    assert_eq("duration",     parsed["duration"],      "100 menit di awal")
    assert_eq("participants", parsed["participants"],  "1 - 3 orang")
    assert_eq("max_file",     parsed["max_file_size"], "50 MB")

    parsed2 = main.parse_notes(MOCK_COURSE["info"][1]["notes"])
    assert_eq("participants(solo)", parsed2["participants"], "1 orang")


def test_pick_info():
    print("[3] pick_info_entry")
    quiz = main.pick_info_entry(MOCK_COURSE["info"], "quiz")
    uap = main.pick_info_entry(MOCK_COURSE["info"], "uap")
    assert_eq("quiz.meeting", quiz["meeting"], 6)
    assert_eq("uap.meeting",  uap["meeting"], 12)


def _read_text_nodes(pptx_path: str, slide_xml: str) -> list[str]:
    import re
    with zipfile.ZipFile(pptx_path) as z:
        xml = z.read(slide_xml).decode("utf-8")
    return re.findall(r"<a:t>([^<]*)</a:t>", xml)


def test_build(template_type: str, expected_meeting: str):
    print(f"[4-{template_type}] build_pptx + inspect output")
    template_path = os.path.join(main.PPT_DIR, main.TEMPLATE_FILES[template_type])
    assert os.path.exists(template_path), template_path

    pptx_bytes = main.build_pptx(
        template_path=template_path,
        template_type=template_type,
        kd_mtk="COMP6799049",
        nama_mtk="Database Technology",
        kd_kelas="BA06",
        line_group_link=MOCK_LINK,
        course=MOCK_COURSE,
    )

    out_path = os.path.join(OUT, f"out_{template_type}.pptx")
    with open(out_path, "wb") as f:
        f.write(pptx_bytes)
    print(f"  wrote {out_path} ({len(pptx_bytes)} bytes)")

    s2 = _read_text_nodes(out_path, "ppt/slides/slide2.xml")
    joined2 = "".join(s2)
    assert "COMP6799049" in joined2, f"slide2 missing KdMtk: {joined2}"
    assert "Database Technology" in joined2, f"slide2 missing NamaMtk: {joined2}"
    assert "BA06" in joined2, f"slide2 missing KdKelas: {joined2}"
    assert "KdMtk" not in joined2, f"slide2 still has KdMtk placeholder"
    assert MOCK_LINK in joined2, f"slide2 missing Link Group url"
    assert "[Link Group]" not in joined2
    print("  OK   slide2 header + link replaced")

    s3 = _read_text_nodes(out_path, "ppt/slides/slide3.xml")
    joined3 = "".join(s3)
    assert "COMP6799049" in joined3
    assert "BA06" in joined3
    assert "KdMtk" not in joined3
    assert expected_meeting in s3, f"slide3 should contain meeting {expected_meeting}; got {s3}"
    assert "Android SDK API 35, Frida 17.6.2, Python 3.12.4, apktool v2.7.0" in joined3, (
        f"software string not joined correctly: {joined3}"
    )
    if template_type == "quiz":
        assert "1 - 3 orang" in joined3, f"quiz participants missing: {joined3}"
        assert "100 menit di awal" in joined3
        assert "50 MB" in joined3
        assert "DOCX" in joined3
    else:
        assert "1 orang" in joined3
        assert "120 menit di awal" in joined3
        assert "75 MB" in joined3
        assert "PDF" in joined3
    print(f"  OK   slide3 table populated for {template_type}")

    with zipfile.ZipFile(template_path) as z_in, zipfile.ZipFile(out_path) as z_out:
        in_media  = sorted(n for n in z_in.namelist()  if n.startswith("ppt/media/"))
        out_media = sorted(n for n in z_out.namelist() if n.startswith("ppt/media/"))
        new_only = set(out_media) - set(in_media)
        assert new_only, f"no new media added (expected QR PNG) — in={in_media} out={out_media}"
        print(f"  OK   new image(s) added: {sorted(new_only)}")


if __name__ == "__main__":
    test_parse_description()
    test_parse_notes()
    test_pick_info()
    test_build("quiz", "6")
    test_build("uap", "12")
    print("\nALL TESTS PASSED")
