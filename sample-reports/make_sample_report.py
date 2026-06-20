"""Generate a realistic sample medical report PDF for testing the
Document Analysis (Report) feature end-to-end.

Run:  python sample-reports/make_sample_report.py
Output: sample-reports/sample_cardiology_report.pdf
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)

OUT = Path(__file__).resolve().parent / "sample_cardiology_report.pdf"

styles = getSampleStyleSheet()
h_hosp = ParagraphStyle("hosp", parent=styles["Title"], fontSize=18, spaceAfter=2, textColor=colors.HexColor("#1e3a8a"))
h_sub = ParagraphStyle("sub", parent=styles["Normal"], fontSize=9, textColor=colors.grey, spaceAfter=10)
h_sec = ParagraphStyle("sec", parent=styles["Heading2"], fontSize=12, spaceBefore=10, spaceAfter=4, textColor=colors.HexColor("#1e3a8a"))
body = ParagraphStyle("body", parent=styles["Normal"], fontSize=10, leading=14)
small = ParagraphStyle("small", parent=styles["Normal"], fontSize=8.5, textColor=colors.grey)

doc = SimpleDocTemplate(str(OUT), pagesize=A4,
                        topMargin=18 * mm, bottomMargin=16 * mm,
                        leftMargin=18 * mm, rightMargin=18 * mm)

story = []

story.append(Paragraph("Greenfield Diagnostic Centre", h_hosp))
story.append(Paragraph("Cardiology Department &middot; NABL-accredited Laboratory &middot; Reg. No. GDC/CARD/4471", h_sub))
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a")))
story.append(Spacer(1, 8))

# Patient / report meta
meta = [
    ["Patient Name:", "Mr. Rahul Verma", "Report No.:", "GDC-2026-008812"],
    ["Age / Sex:", "58 Years / Male", "Collected On:", "12 June 2026, 08:15"],
    ["Patient ID:", "GDC-PT-33920", "Reported On:", "12 June 2026, 17:40"],
    ["Referring Doctor:", "Dr. A. Nair, MD (Cardiology)", "Sample:", "Serum / Whole blood"],
]
t = Table(meta, colWidths=[28 * mm, 60 * mm, 28 * mm, 50 * mm])
t.setStyle(TableStyle([
    ("FONT", (0, 0), (-1, -1), "Helvetica", 9),
    ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 9),
    ("FONT", (2, 0), (2, -1), "Helvetica-Bold", 9),
    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#222222")),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
]))
story.append(t)
story.append(Spacer(1, 6))

# Clinical summary
story.append(Paragraph("Clinical History", h_sec))
story.append(Paragraph(
    "58-year-old male, known hypertensive for 9 years, presenting with exertional chest tightness "
    "and breathlessness (NYHA Class II) for the past 3 weeks. Family history of coronary artery "
    "disease. Evaluated for ischemic heart disease.", body))
story.append(Spacer(1, 4))

# Lipid + cardiac panel
story.append(Paragraph("Lipid Profile &amp; Cardiac Markers", h_sec))
rows = [
    ["Test", "Result", "Unit", "Reference Range", "Flag"],
    ["Total Cholesterol", "268", "mg/dL", "< 200", "HIGH"],
    ["LDL Cholesterol", "182", "mg/dL", "< 100", "HIGH"],
    ["HDL Cholesterol", "34", "mg/dL", "> 40", "LOW"],
    ["Triglycerides", "256", "mg/dL", "< 150", "HIGH"],
    ["Troponin I", "0.06", "ng/mL", "< 0.04", "HIGH"],
    ["NT-proBNP", "612", "pg/mL", "< 125", "HIGH"],
    ["hs-CRP", "4.8", "mg/L", "< 3.0", "HIGH"],
    ["Fasting Blood Glucose", "138", "mg/dL", "70 - 100", "HIGH"],
    ["HbA1c", "7.1", "%", "< 5.7", "HIGH"],
    ["Serum Creatinine", "1.0", "mg/dL", "0.7 - 1.3", "NORMAL"],
]
lab = Table(rows, colWidths=[48 * mm, 24 * mm, 20 * mm, 38 * mm, 22 * mm])
style = [
    ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9.5),
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONT", (0, 1), (-1, -1), "Helvetica", 9),
    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cccccc")),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f6fb")]),
    ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
]
# Colour the HIGH/LOW flags red, NORMAL green.
for i, r in enumerate(rows[1:], start=1):
    flag = r[-1]
    if flag in ("HIGH", "LOW"):
        style.append(("TEXTCOLOR", (4, i), (4, i), colors.HexColor("#c0392b")))
        style.append(("FONT", (4, i), (4, i), "Helvetica-Bold", 9))
    else:
        style.append(("TEXTCOLOR", (4, i), (4, i), colors.HexColor("#1e8449")))
lab.setStyle(TableStyle(style))
story.append(lab)
story.append(Spacer(1, 8))

# ECG / Echo
story.append(Paragraph("ECG &amp; Echocardiography", h_sec))
story.append(Paragraph(
    "<b>ECG:</b> Sinus rhythm, rate 88/min. ST-segment depression of 1.5 mm in leads V4-V6 "
    "suggestive of lateral wall ischemia. <br/>"
    "<b>2D Echo:</b> Mild left ventricular hypertrophy. Regional wall motion abnormality in the "
    "lateral wall. Left ventricular ejection fraction (LVEF) estimated at 48% (mildly reduced). "
    "Grade I diastolic dysfunction.", body))
story.append(Spacer(1, 6))

# Impression
story.append(Paragraph("Impression", h_sec))
story.append(Paragraph(
    "Findings are consistent with <b>coronary artery disease with myocardial ischemia</b> on a "
    "background of dyslipidemia, type 2 diabetes mellitus, and hypertension. Mildly elevated "
    "Troponin I and NT-proBNP indicate early myocardial strain. Coronary angiography is advised "
    "to assess the need for revascularisation (angioplasty / CABG).", body))
story.append(Spacer(1, 6))

# Recommendations
story.append(Paragraph("Recommendations", h_sec))
story.append(Paragraph(
    "1. Cardiology consultation for coronary angiography.<br/>"
    "2. Initiate / optimise statin and antiplatelet therapy.<br/>"
    "3. Strict glycaemic and blood-pressure control.<br/>"
    "4. Lifestyle modification: low-fat diet, supervised exercise, smoking cessation.", body))
story.append(Spacer(1, 14))

story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "This is a computer-generated sample report created for software testing only. "
    "Not a real patient and not for clinical use. &mdash; Dr. A. Nair, MD (Cardiology)", small))

doc.build(story)
print(f"Wrote {OUT}")
