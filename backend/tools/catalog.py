"""Tool: list_procedures — browse the treatment catalog by specialty.

Lets a patient who doesn't know the exact procedure name discover what's on
offer. Called with no specialty it returns the CATEGORIES (cardiac, oncology,
orthopaedics, ...) with a count and a price-from. Called with a specialty it
returns every PROCEDURE in that category (label + slug + from-price + how many
hospitals offer it). The agent walks the patient: categories -> pick one ->
treatments -> pick one -> plan with find_hospitals (pass the returned slug).

Everything is derived from the cost matrix via procedure_catalog(), so it always
reflects exactly what the partner hospitals actually price — no invented names.
"""

from __future__ import annotations

from collections import defaultdict

from ..contract import procedure_catalog

# Specialty key (as stored in the cost matrix) -> patient-friendly display name.
_SPECIALTY_NAMES: dict[str, str] = {
    "cardiac": "Cardiac & Heart",
    "ent": "ENT (Ear, Nose & Throat)",
    "general-surgery": "General Surgery",
    "gynecology": "Gynaecology & Fertility",
    "neurosurgery": "Neurosurgery & Spine",
    "oncology": "Oncology (Cancer Care)",
    "ophthalmology": "Ophthalmology (Eye Care)",
    "orthopedics": "Orthopaedics (Bones & Joints)",
    "urology": "Urology & Kidney",
}

# Plain-language category words -> specialty key, so "heart"/"brain"/"eye" resolve.
_SPECIALTY_SYNONYMS: dict[str, str] = {
    "heart": "cardiac", "cardiac": "cardiac", "cardiology": "cardiac",
    "ent": "ent", "ear": "ent", "nose": "ent", "throat": "ent", "sinus": "ent",
    "general": "general-surgery", "general surgery": "general-surgery",
    "abdominal": "general-surgery", "hernia": "general-surgery",
    "gynaecology": "gynecology", "gynecology": "gynecology", "gynae": "gynecology",
    "women": "gynecology", "fertility": "gynecology", "ivf": "gynecology",
    "neuro": "neurosurgery", "neurology": "neurosurgery", "neurosurgery": "neurosurgery",
    "brain": "neurosurgery", "spine": "neurosurgery", "spinal": "neurosurgery",
    "onco": "oncology", "oncology": "oncology", "cancer": "oncology",
    "tumor": "oncology", "tumour": "oncology",
    "eye": "ophthalmology", "ophthalmology": "ophthalmology", "vision": "ophthalmology",
    "ortho": "orthopedics", "orthopedic": "orthopedics", "orthopaedic": "orthopedics",
    "orthopedics": "orthopedics", "orthopaedics": "orthopedics",
    "bone": "orthopedics", "bones": "orthopedics", "joint": "orthopedics",
    "knee": "orthopedics", "hip": "orthopedics",
    "uro": "urology", "urology": "urology", "kidney": "urology",
    "renal": "urology", "prostate": "urology",
}

# Acronyms to upper-case when prettifying slug-derived labels.
_ACRONYMS = {
    "acl", "cabg", "pcnl", "turp", "fess", "imrt", "hipec", "ivf", "orif",
    "crs", "mvr", "avr", "icd", "ercp", "tur",
}


def _pretty(label: str) -> str:
    return " ".join(w.upper() if w.lower() in _ACRONYMS else w.capitalize()
                     for w in label.split())


def _resolve_specialty(text: str) -> str | None:
    t = (text or "").strip().lower()
    if not t:
        return None
    if t in _SPECIALTY_NAMES:
        return t
    # match against display names
    for key, name in _SPECIALTY_NAMES.items():
        if t == name.lower() or t in name.lower():
            return key
    # synonym phrases
    for phrase, key in _SPECIALTY_SYNONYMS.items():
        if phrase in t:
            return key
    return None


def _grouped() -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for entry in procedure_catalog().values():
        groups[entry.get("specialty") or "other"].append(entry)
    return groups


def list_procedures(specialty: str = "") -> dict:
    """Browse the available treatments, grouped by medical specialty.

    Use this when a patient asks what treatments/procedures are available, or
    isn't sure of the exact name. Call it with NO specialty to list the
    categories (cardiac, oncology, orthopaedics, ...); then, once the patient
    picks one, call it again WITH that specialty to list the treatments in it.
    Hand the chosen procedure's `slug` to find_hospitals as the condition.

    Args:
        specialty: Empty to list all categories. Otherwise a category in plain
            language — "cardiac", "heart", "cancer", "eye", "kidney", "bones",
            "neurology", etc. — to list the treatments within it.

    Returns:
        dict with "status":
          - "categories": "categories" is a list of {key, name, count,
            price_from_usd, examples}.
          - "procedures": "specialty" is {key, name} and "procedures" is a list
            of {slug, label, price_from_usd, offered_by_count}, cheapest first.
          - "unknown_specialty": the text didn't match a category; "categories"
            is included so you can re-offer the valid ones.
    """
    groups = _grouped()

    if not (specialty or "").strip():
        cats = []
        for key in sorted(groups, key=lambda k: _SPECIALTY_NAMES.get(k, k)):
            procs = groups[key]
            prices = [p["usd_min"] for p in procs if p.get("usd_min") is not None]
            examples = [_pretty(p["label"]) for p in
                        sorted(procs, key=lambda x: -x.get("offered_by_count", 0))[:3]]
            cats.append({
                "key": key,
                "name": _SPECIALTY_NAMES.get(key, key.title()),
                "count": len(procs),
                "price_from_usd": min(prices) if prices else None,
                "examples": examples,
            })
        return {"status": "categories", "categories": cats}

    key = _resolve_specialty(specialty)
    if not key or key not in groups:
        cats = [{"key": k, "name": _SPECIALTY_NAMES.get(k, k.title()), "count": len(v)}
                for k, v in sorted(groups.items(), key=lambda kv: _SPECIALTY_NAMES.get(kv[0], kv[0]))]
        return {
            "status": "unknown_specialty",
            "requested": specialty,
            "categories": cats,
        }

    procs = sorted(groups[key], key=lambda x: (x.get("usd_min") is None, x.get("usd_min") or 0))
    return {
        "status": "procedures",
        "specialty": {"key": key, "name": _SPECIALTY_NAMES.get(key, key.title())},
        "procedures": [{
            "slug": p["slug"],
            "label": _pretty(p["label"]),
            "price_from_usd": p.get("usd_min"),
            "offered_by_count": p.get("offered_by_count", 0),
        } for p in procs],
    }
