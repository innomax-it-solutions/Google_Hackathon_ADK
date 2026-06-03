"""Tool: find_hospitals — match a patient to candidate MoU hospitals.

Resolves the patient's plain-language condition to a real procedure slug from the
cost matrix, then returns the hospitals that actually price that procedure,
ranked by affordability against the patient's budget.
"""

from __future__ import annotations

import re

from ..contract import (
    cost_for,
    hospital_by_id,
    hospitals,
    procedure_catalog,
)

# Plain-language phrase -> procedure slug. Only terms that don't already match
# the slug text lexically need to live here; everything else is caught by the
# token-overlap fallback below. Maps to the widely-offered variant by default.
_SYNONYMS: dict[str, str] = {
    "knee replacement": "knee-replacement-unilateral",
    "total knee": "knee-replacement-unilateral",
    "both knees": "knee-replacement-bilateral",
    "bilateral knee": "knee-replacement-bilateral",
    "hip replacement": "hip-replacement-unilateral",
    "both hips": "hip-replacement-bilateral",
    "acl": "acl-reconstruction",
    "shoulder replacement": "shoulder-replacement",
    "fracture": "orif-fracture",
    "broken bone": "orif-fracture",
    "heart bypass": "cabg",
    "bypass surgery": "cabg",
    "coronary bypass": "cabg",
    "open heart": "cabg",
    "angioplasty": "angioplasty-one-stent",
    "stent": "angioplasty-one-stent",
    "heart valve": "valve-replacement-mvr",
    "valve replacement": "valve-replacement-mvr",
    "pacemaker": "pacemaker-single-chamber",
    "angiogram": "coronary-angiogram",
    "kidney transplant": "kidney-transplant",
    "dialysis": "dialysis",
    "kidney stone": "pcnl-unilateral",
    "kidney stones": "pcnl-unilateral",
    "enlarged prostate": "turp",
    "prostate cancer": "radical-prostatectomy",
    "gallbladder": "laparoscopic-cholecystectomy",
    "gall bladder": "laparoscopic-cholecystectomy",
    "hernia": "lap-inguinal-hernia-repair",
    "appendix": "appendicectomy",
    "appendicitis": "appendicectomy",
    "piles": "haemorrhoidectomy",
    "hemorrhoids": "haemorrhoidectomy",
    "haemorrhoids": "haemorrhoidectomy",
    "weight loss surgery": "sleeve-gastrectomy",
    "bariatric": "sleeve-gastrectomy",
    "gastric sleeve": "sleeve-gastrectomy",
    "gastric bypass": "gastric-bypass",
    "hysterectomy": "laparoscopic-hysterectomy",
    "fibroid": "laparoscopic-myomectomy",
    "ivf": "ivf-treatment",
    "fertility": "ivf-treatment",
    "cataract": "cataract-surgery-monofocal",
    "cornea": "cornea-transplant",
    "retina": "retinal-detachment-repair",
    "retinal detachment": "retinal-detachment-repair",
    "spinal fusion": "spine-fixation",
    "spine fusion": "spine-fixation",
    "slipped disc": "micro-lumbar-discectomy",
    "tonsil": "tonsillectomy",
    "sinus": "fess-bilateral",
    "liver transplant": "liver-transplant",
    "bone marrow transplant": "bone-marrow-transplant-auto",
    "chemotherapy": "chemotherapy-basic",
    "chemo": "chemotherapy-basic",
    "radiation": "imrt-radiation",
    "radiotherapy": "imrt-radiation",
    "whipple": "whipple-procedure",
    "brain tumor": "craniotomy",
    "brain tumour": "craniotomy",
    "breast cancer": "mastectomy-simple",
}

_STOP = {"surgery", "operation", "procedure", "treatment", "the", "a", "for", "of", "my"}


def _resolve(condition: str) -> str | None:
    """Map free-text condition to the best procedure slug, or None."""
    c = condition.lower().strip()
    catalog = procedure_catalog()

    if c in catalog:                      # already a valid slug
        return c
    for phrase, slug in _SYNONYMS.items():  # explicit synonyms
        if phrase in c:
            return slug if slug in catalog else None

    # Token-overlap fallback: score each slug by shared words; prefer the
    # widely-offered variant on ties.
    words = {w for w in re.split(r"[^a-z]+", c) if w and w not in _STOP}
    best, best_score = None, 0.0
    for slug, entry in catalog.items():
        slug_words = set(entry["label"].split())
        overlap = len(words & slug_words)
        if not overlap:
            continue
        score = overlap + entry["offered_by_count"] / 1000.0  # tie-break
        if score > best_score:
            best, best_score = slug, score
    return best


def find_hospitals(condition: str, budget_usd: int, origin_country: str) -> dict:
    """Find the best-matching MoU hospitals in India for a patient's condition.

    Call this FIRST. Use the returned hospital_id and matched_procedure when you
    later call estimate_cost.

    Args:
        condition: The condition or procedure in plain language, e.g. "knee replacement", "heart bypass", "kidney transplant".
        budget_usd: The patient's total budget in US dollars.
        origin_country: The patient's country as a 2-letter ISO code, e.g. "AE", "US", "GB".

    Returns:
        A dict with "status" ("ok" or "general_recommendation"), the resolved
        "matched_procedure"/"specialty", and "hospitals": a ranked list (max 4) of
        {hospital_id, name, city, state, tier, international_desk, est_usd_min,
        est_usd_max, within_budget}. Never returns an error or empty list — if the
        condition can't be matched to a procedure, it returns affordable accredited
        hospitals with status "general_recommendation".
    """
    slug = _resolve(condition)
    catalog = procedure_catalog()
    active_ids = {h["id"] for h in hospitals()}

    candidates: list[dict] = []
    status = "ok"

    if slug and slug in catalog:
        specialty = catalog[slug]["specialty"]
        for hid in active_ids:
            cost = cost_for(hid, slug)
            if not cost:
                continue
            h = hospital_by_id(hid)
            umin = cost.get("total_usd_min")
            umax = cost.get("total_usd_max")
            candidates.append({
                "hospital_id": hid,
                "name": h["name"],
                "city": h["city"],
                "state": h.get("state"),
                "tier": h.get("tier"),
                "international_desk": h.get("international_desk", False),
                "est_usd_min": umin,
                "est_usd_max": umax,
                "within_budget": bool(umin is not None and umin <= budget_usd),
            })

    if not candidates:
        # Fallback: never empty. Cheapest accredited hospitals by cost_index.
        status = "general_recommendation"
        slug, specialty = None, None
        for h in sorted(hospitals(), key=lambda x: x.get("cost_index", 1.0))[:4]:
            candidates.append({
                "hospital_id": h["id"],
                "name": h["name"],
                "city": h["city"],
                "state": h.get("state"),
                "tier": h.get("tier"),
                "international_desk": h.get("international_desk", False),
                "est_usd_min": None,
                "est_usd_max": None,
                "within_budget": None,
            })
    else:
        specialty = catalog[slug]["specialty"]
        # Rank: within budget first, then lowest price, then international desk.
        candidates.sort(key=lambda c: (
            0 if c["within_budget"] else 1,
            c["est_usd_min"] if c["est_usd_min"] is not None else 1e9,
            0 if c["international_desk"] else 1,
        ))
        candidates = candidates[:4]

    return {
        "status": status,
        "condition": condition,
        "matched_procedure": slug,
        "specialty": specialty,
        "hospitals": candidates,
    }
