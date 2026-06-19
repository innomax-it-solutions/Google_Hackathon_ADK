#!/usr/bin/env python3
"""
One-off extractor: healtour/old/innomyzo_healtourin.sql  ->  frontend/src/data/healtour/*.json

Why this exists
---------------
The legacy Healtour content lives only in a MySQL dump. The React app is the
deployed product and must not depend on PHP or a live DB, so we snapshot the
content into static JSON (mirroring the backend/data/*.json convention).

The dump uses `INSERT INTO `tbl` VALUES (...)` with NO explicit column list,
so column order is taken from each CREATE TABLE block. Strings are single-quoted
with backslash escapes; NULL is a bare literal.

Re-run with:  python frontend/scripts/extract_healtour_data.py
Idempotent: overwrites the JSON outputs.
"""

import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
SQL_PATH = os.path.join(REPO, "healtour", "old", "innomyzo_healtourin.sql")
OUT_DIR = os.path.join(REPO, "frontend", "src", "data", "healtour")

# ----------------------------------------------------------------------------
# Low-level SQL parsing
# ----------------------------------------------------------------------------

def read_sql():
    with open(SQL_PATH, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def table_columns(sql, table):
    """Return ordered column names from the CREATE TABLE block."""
    m = re.search(r"CREATE TABLE `%s` \((.*?)\n\) ENGINE" % re.escape(table), sql, re.S)
    if not m:
        return []
    cols = []
    for line in m.group(1).splitlines():
        line = line.strip()
        cm = re.match(r"`([^`]+)`", line)
        if cm and not line.upper().startswith(("PRIMARY KEY", "UNIQUE KEY", "KEY", "CONSTRAINT")):
            cols.append(cm.group(1))
    return cols


_ESCAPES = {"n": "\n", "r": "\r", "t": "\t", "0": "\0", "b": "\b", "Z": "\x1a"}


def parse_values(sql, table):
    """Tokenize all `INSERT INTO `table` VALUES ...;` rows into lists of tuples."""
    rows = []
    for ins in re.finditer(r"INSERT INTO `%s` VALUES " % re.escape(table), sql):
        i = ins.end()
        n = len(sql)
        cur = []          # current row's fields
        field = []        # current field chars
        in_str = False
        is_null_token = ""
        depth = 0
        quoted_field = False
        while i < n:
            c = sql[i]
            if in_str:
                if c == "\\" and i + 1 < n:
                    nxt = sql[i + 1]
                    field.append(_ESCAPES.get(nxt, nxt))
                    i += 2
                    continue
                if c == "'":
                    in_str = False
                    i += 1
                    continue
                field.append(c)
                i += 1
                continue
            # not in string
            if c == "'":
                in_str = True
                quoted_field = True
                i += 1
                continue
            if c == "(":
                depth += 1
                cur = []
                field = []
                quoted_field = False
                is_null_token = ""
                i += 1
                continue
            if c == ",":
                if depth == 1:
                    cur.append(_finalize(field, quoted_field, is_null_token))
                    field = []
                    quoted_field = False
                    is_null_token = ""
                i += 1
                continue
            if c == ")":
                cur.append(_finalize(field, quoted_field, is_null_token))
                rows.append(cur)
                field = []
                quoted_field = False
                is_null_token = ""
                depth -= 1
                i += 1
                continue
            if c == ";" and depth == 0:
                break
            # bare token char (numbers / NULL)
            if not c.isspace():
                is_null_token += c
                field.append(c)
            i += 1
    return rows


def _finalize(field, quoted, token):
    val = "".join(field)
    if not quoted:
        t = token.strip()
        if t == "NULL" or t == "":
            return None
    return val


def rows_as_dicts(sql, table):
    cols = table_columns(sql, table)
    out = []
    for r in parse_values(sql, table):
        if len(r) != len(cols):
            # tolerate minor schema drift by zipping shortest
            pass
        out.append(dict(zip(cols, r)))
    return out


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------

def to_int(v, default=0):
    try:
        return int(str(v).strip())
    except (TypeError, ValueError):
        return default


def strip_html(s):
    if not s:
        return ""
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"&nbsp;", " ", s)
    s = re.sub(r"&amp;", "&", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def id_list(text):
    """Parse comma/space separated id strings from the denormalized text cols."""
    if not text:
        return []
    return [to_int(x) for x in re.split(r"[,\s]+", str(text)) if x.strip().isdigit()]


def write_json(name, data):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  wrote {name:18} {len(data):4} records")


# ----------------------------------------------------------------------------
# Build
# ----------------------------------------------------------------------------

def main():
    print(f"Reading {os.path.relpath(SQL_PATH, REPO)} ...")
    sql = read_sql()

    # --- lookups ---
    depts = rows_as_dicts(sql, "tbl_department")
    dep_by_id = {to_int(d["dep_id"]): d for d in depts}

    designations = rows_as_dicts(sql, "tbl_designation")
    desig_by_id = {to_int(d["designation_id"]): d["designation_name"] for d in designations}

    countries = {to_int(c["country_id"]): c["country_name"] for c in rows_as_dicts(sql, "tbl_countries")}
    states = {to_int(s["state_id"]): s["state_name"] for s in rows_as_dicts(sql, "tbl_states")}
    cities = {to_int(c["city_id"]): c["city_name"] for c in rows_as_dicts(sql, "tbl_cities")}
    categories = {to_int(c["category_id"]): c for c in rows_as_dicts(sql, "tbl_category")}
    wel_loc = {to_int(w["id"]): w["name"] for w in rows_as_dicts(sql, "tbl_wel_loc")}

    # junction tables (optional)
    def junction(table, a, b):
        m = {}
        for r in rows_as_dicts(sql, table):
            m.setdefault(to_int(r.get(a)), []).append(to_int(r.get(b)))
        return m

    hosp_depts = junction("tbl_hospital_departments", "hospital_id", "department_id")
    hosp_treats = junction("tbl_hospital_treatments", "hospital_id", "treatment_id")
    doc_depts = junction("tbl_doctor_departments", "doctor_id", "department_id")
    doc_treats = junction("tbl_doctor_treatments", "doctor_id", "treatment_id")

    # accreditation id -> logo filename (no display names exist in the dump)
    accred_logo = {to_int(a["accreditation_id"]): a["accreditation_logo"]
                   for a in rows_as_dicts(sql, "tbl_accreditations")}

    # --- departments ---
    departments = []
    for d in depts:
        departments.append({
            "id": to_int(d["dep_id"]),
            "name": (d.get("dep_name") or "").strip(),
            "slug": d.get("dep_slug"),
            "description": strip_html(d.get("dep_detail")),
            "descriptionHtml": d.get("dep_detail") or "",
            "photo": d.get("dep_photo"),
            "showOnHome": str(d.get("show_on_home") or "").strip() in ("1", "Active", "active"),
            "metaTitle": d.get("meta_title"),
            "metaDescription": d.get("meta_description"),
            "metaKeyword": d.get("meta_keyword"),
        })
    write_json("departments.json", departments)

    # --- treatments ---
    treatments = []
    for t in rows_as_dicts(sql, "tbl_treatment"):
        dep = dep_by_id.get(to_int(t.get("dep_id")))
        treatments.append({
            "id": to_int(t["id"]),
            "name": (t.get("name") or "").strip(),
            "slug": t.get("slug"),
            "shortDescription": strip_html(t.get("short_description")),
            "description": strip_html(t.get("description")),
            "descriptionHtml": t.get("description") or "",
            "photo": t.get("photo"),
            "departmentId": to_int(t.get("dep_id")),
            "department": (dep.get("dep_name").strip() if dep else None),
            "departmentSlug": (dep.get("dep_slug") if dep else None),
            "costMin": t.get("cost_range_min"),
            "costMax": t.get("cost_range_max"),
            "days": to_int(t.get("days")),
            "duration": t.get("duration"),
            "videoTitle": t.get("video_title"),
            "videoIframe": t.get("video_iframe"),
            "showOnHome": to_int(t.get("show_on_home")) == 1,
            "metaTitle": t.get("meta_title"),
            "metaDescription": t.get("meta_description"),
        })
    write_json("treatments.json", treatments)
    treat_by_id = {x["id"]: x for x in treatments}

    # --- hospitals ---
    hospitals = []
    for h in rows_as_dicts(sql, "tbl_hospital"):
        hid = to_int(h["id"])
        dep_ids = hosp_depts.get(hid) or id_list(h.get("departments"))
        treat_ids = hosp_treats.get(hid) or id_list(h.get("treatments"))
        hospitals.append({
            "id": hid,
            "name": (h.get("name") or "").strip(),
            "slug": h.get("slug"),
            "photo": h.get("photo"),
            "city": cities.get(to_int(h.get("city_id"))),
            "state": states.get(to_int(h.get("state_id"))),
            "country": countries.get(to_int(h.get("country_id"))),
            "address": (h.get("address") or "").strip(),
            "numberOfBeds": to_int(h.get("number_of_beds")),
            "numberOfDoctors": to_int(h.get("number_of_doctors")),
            "yearEstablished": to_int(h.get("year_of_establishment")),
            "departments": sorted({dep_by_id[i]["dep_name"].strip() for i in dep_ids if i in dep_by_id}),
            "departmentIds": dep_ids,
            "treatmentSlugs": [treat_by_id[i]["slug"] for i in treat_ids if i in treat_by_id],
            "accreditationLogos": [accred_logo[i] for i in id_list(h.get("accreditations")) if i in accred_logo],
            "description": strip_html(h.get("details")),
            "descriptionHtml": h.get("details") or "",
            "phone": h.get("phone"),
            "email": h.get("email"),
            "website": h.get("website"),
            "showOnHome": to_int(h.get("show_on_home")) == 1,
            "priority": to_int(h.get("priority_display")),
            "metaTitle": h.get("meta_title"),
            "metaDescription": h.get("meta_description"),
        })
    write_json("hospitals.json", hospitals)
    hosp_by_id = {x["id"]: x for x in hospitals}

    # --- doctors ---
    doctors = []
    for d in rows_as_dicts(sql, "tbl_doctor"):
        did = to_int(d["id"])
        status = (d.get("status") or "").strip().lower()
        if status and status not in ("active", "1", "enabled", ""):
            continue  # skip inactive/draft doctors
        dep_ids = doc_depts.get(did) or id_list(d.get("departments"))
        treat_ids = doc_treats.get(did) or id_list(d.get("treatments"))
        hosp = hosp_by_id.get(to_int(d.get("hospital_id")))
        doctors.append({
            "id": did,
            "name": (d.get("name") or "").strip(),
            "slug": d.get("slug"),
            "photo": d.get("photo"),
            "designation": desig_by_id.get(to_int(d.get("designation_id"))),
            "hospitalId": to_int(d.get("hospital_id")),
            "hospital": (hosp.get("name") if hosp else None),
            "hospitalSlug": (hosp.get("slug") if hosp else None),
            "city": cities.get(to_int(d.get("city_id"))),
            "country": countries.get(to_int(d.get("country_id"))),
            "departments": sorted({dep_by_id[i]["dep_name"].strip() for i in dep_ids if i in dep_by_id}),
            "treatmentSlugs": [treat_by_id[i]["slug"] for i in treat_ids if i in treat_by_id],
            "experience": d.get("experience"),
            "bio": strip_html(d.get("detail")),
            "bioHtml": d.get("detail") or "",
            "awards": strip_html(d.get("awards")),
            "careerHighlights": strip_html(d.get("Career_Highlights")),
            "interests": d.get("interests"),
            "showOnHome": to_int(d.get("show_on_home")) == 1,
            "metaTitle": d.get("meta_title"),
            "metaDescription": d.get("meta_description"),
        })
    write_json("doctors.json", doctors)

    # --- blogs (news) ---
    blogs = []
    for b in rows_as_dicts(sql, "tbl_news"):
        cat = categories.get(to_int(b.get("category_id")))
        blogs.append({
            "id": to_int(b["news_id"]),
            "title": (b.get("news_title") or "").strip(),
            "slug": b.get("news_slug"),
            "excerpt": strip_html(b.get("news_content"))[:240],
            "contentHtml": b.get("news_content") or "",
            "date": b.get("news_date"),
            "photo": b.get("photo"),
            "category": (cat.get("category_name") if cat else None),
            "categorySlug": (cat.get("category_slug") if cat else None),
            "publisher": b.get("publisher"),
            "views": to_int(b.get("total_view")),
            "metaTitle": b.get("meta_title"),
            "metaDescription": b.get("meta_description"),
        })
    write_json("blogs.json", blogs)

    # --- patient stories ---
    stories = []
    for s in rows_as_dicts(sql, "tbl_patient"):
        cat = categories.get(to_int(s.get("category_id")))
        stories.append({
            "id": to_int(s["story_id"]),
            "title": (s.get("story_title") or "").strip(),
            "slug": s.get("story_slug"),
            "excerpt": strip_html(s.get("story_content"))[:240],
            "contentHtml": s.get("story_content") or "",
            "date": s.get("story_date"),
            "photo": s.get("photo"),
            "category": (cat.get("category_name") if cat else None),
            "publisher": s.get("publisher"),
            "views": to_int(s.get("total_view")),
            "metaTitle": s.get("meta_title"),
            "metaDescription": s.get("meta_description"),
        })
    write_json("stories.json", stories)

    # --- wellness ---
    wellness = []
    for w in rows_as_dicts(sql, "tbl_wellness"):
        wellness.append({
            "id": to_int(w["id"]),
            "name": (w.get("name") or "").strip(),
            "slug": w.get("slug"),
            "shortDescription": strip_html(w.get("short_description")),
            "description": strip_html(w.get("description")),
            "descriptionHtml": w.get("description") or "",
            "benefits": [x.strip() for x in re.split(r"[\n,]", strip_html(w.get("benefits")) or "") if x.strip()],
            "photo": w.get("photo"),
            "thumbnail": w.get("thumbnail"),
            "price": w.get("price"),
            "discountPercentage": to_int(w.get("discount_percentage")),
            "location": wel_loc.get(to_int(w.get("wellness_location_id"))),
            "isNew": to_int(w.get("is_new")) == 1,
            "metaTitle": w.get("meta_title"),
            "metaDescription": w.get("meta_description"),
        })
    write_json("wellness.json", wellness)

    print("Done.")


if __name__ == "__main__":
    main()
