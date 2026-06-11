"""Tool: get_aftercare_plan — post-operative continuum-of-care plan.

After a hospital + procedure are chosen, patients ask what happens AFTER surgery:
when can they fly home, what follow-ups they need, what warning signs to watch
for, physiotherapy, etc. This tool returns a specialty-tailored recovery plan.

It is strictly DATA-BACKED: every clinical field is copied verbatim from the
curated backend/data/aftercare_rules.json (keyed by surgical specialty, with a
GENERIC fallback). The only computation is arithmetic on the procedure's ward/ICU
days to estimate a fit-to-fly window — no medical reasoning is invented. The
disclaimer is also read from the data file, never authored by the model.

Resolution reuses the same condition->slug matcher as find_hospitals
(hospital_match._resolve) and the cost matrix (specialty + ward/icu days), so a
plan can be produced for any condition the rest of the app understands.
"""

from __future__ import annotations

from ..contract import aftercare_rules, cost_for, hospitals_offering, procedure_catalog
from .hospital_match import _resolve

# Inline safety net used only if the data file somehow lacks _meta.disclaimer.
_FALLBACK_DISCLAIMER = (
    "This recovery & aftercare plan is general guidance, not personalised medical "
    "advice. Always follow your treating surgeon's specific instructions, and seek "
    "urgent care if you notice any warning sign listed."
)


def _max_stay_days(slug: str) -> tuple[int, int]:
    """Most-conservative (max) ward_days/icu_days across hospitals offering slug."""
    ward = icu = 0
    for hid in hospitals_offering(slug):
        rec = cost_for(hid, slug) or {}
        ward = max(ward, int(rec.get("ward_days") or 0))
        icu = max(icu, int(rec.get("icu_days") or 0))
    return ward, icu


def _fit_to_fly(params: dict, ward: int, icu: int) -> int:
    raw = (
        float(params.get("base_days", 7))
        + float(params.get("per_ward_day", 1.0)) * ward
        + float(params.get("per_icu_day", 2.0)) * icu
    )
    lo = int(params.get("min_days", 7))
    hi = int(params.get("max_days", 21))
    return int(round(max(lo, min(raw, hi))))


def get_aftercare_plan(condition_or_procedure: str, origin_country: str = "") -> dict:
    """Return a post-operative recovery & aftercare plan for a procedure.

    Call this when the patient asks about recovery, aftercare, "what happens after
    the operation", "when can I fly home", follow-up care, rehabilitation, or wound
    care — typically AFTER a hospital/procedure has been chosen. Present ONLY what
    this tool returns; do not describe recovery from your own knowledge.

    Args:
        condition_or_procedure: The condition or procedure in plain language (or a
            procedure slug) — the SAME value you passed to find_hospitals, e.g.
            "knee replacement", "cabg", "kidney transplant".
        origin_country: OPTIONAL 2-letter ISO code (e.g. "AE"). Used only to frame
            the return-home follow-up; not required.

    Returns:
        dict with "status" ("ok" = matched a specialty template, "fallback" =
        used GENERIC because the specialty had no template, "unrecognized" = the
        condition didn't resolve to a known procedure so GENERIC was used), the
        resolved procedure/specialty, a computed "fit_to_fly_days"/"fit_to_fly_window"
        with its note, and the plan sections (recovery_phases, in_india_review,
        teleconsult_schedule, red_flags, physiotherapy, medication_wound_care,
        follow_up_tests, diet_lifestyle, specialty_note) plus a "disclaimer".
        Never raises and never empty — always returns a usable plan.
    """
    rules = aftercare_rules()
    disclaimer = (rules.get("_meta") or {}).get("disclaimer") or _FALLBACK_DISCLAIMER

    slug = _resolve(condition_or_procedure)
    catalog = procedure_catalog()

    procedure_label = None
    specialty = None
    ward = icu = 0

    if slug and slug in catalog:
        specialty = catalog[slug].get("specialty")
        procedure_label = catalog[slug].get("label")
        ward, icu = _max_stay_days(slug)

    if specialty and specialty in rules and specialty not in ("_meta", "GENERIC"):
        template = rules[specialty]
        status = "ok"
    else:
        template = rules.get("GENERIC", {})
        # slug resolved but no specialty template -> "fallback"; no slug -> "unrecognized".
        status = "fallback" if slug else "unrecognized"
        if status == "unrecognized":
            specialty = None
            procedure_label = None

    ff_params = template.get("fit_to_fly", {})
    fit_days = _fit_to_fly(ff_params, ward, icu)

    return {
        "status": status,
        "condition": condition_or_procedure,
        "procedure": procedure_label,
        "matched_procedure": slug if (slug and slug in catalog) else None,
        "specialty": specialty,
        "specialty_label": template.get("specialty_label"),
        "origin_country": (origin_country or "").strip().upper() or None,
        "fit_to_fly_days": fit_days,
        "fit_to_fly_window": f"{fit_days}–{fit_days + 7} days",
        "fit_to_fly_note": ff_params.get("note"),
        "ward_days": ward,
        "icu_days": icu,
        "recovery_phases": template.get("recovery_phases", []),
        "in_india_review": template.get("in_india_review", {}),
        "teleconsult_schedule": template.get("teleconsult_schedule", []),
        "red_flags": template.get("red_flags", []),
        "physiotherapy": template.get("physiotherapy", {}),
        "medication_wound_care": template.get("medication_wound_care", []),
        "follow_up_tests": template.get("follow_up_tests", []),
        "diet_lifestyle": template.get("diet_lifestyle", []),
        "specialty_note": template.get("specialty_note"),
        "disclaimer": disclaimer,
    }
