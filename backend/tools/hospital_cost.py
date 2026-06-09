"""Tool: get_hospital_cost — cost & details for a SPECIFIC named hospital.

Unlike find_hospitals (which returns ranked suggestions), this answers "what does
*Apollo* charge for a kidney transplant?" — the patient names the hospital. It
resolves the name to our partner hospitals and returns one of:

  * ok                    -> itemised cost for each matching branch that offers it
  * procedure_not_offered -> the hospital exists but doesn't do that procedure,
                             plus the procedures it DOES offer
  * procedure_unrecognized-> the hospital exists but the condition didn't map to a
                             known procedure (lists what it offers, so the agent can ask)
  * hospital_not_found    -> the named hospital isn't in our network (lists ours)
"""

from __future__ import annotations

import re

from ..contract import (
    cost_for,
    hospitals,
    procedure_catalog,
    procedures_at,
)
from .cost_estimator import estimate_cost
from .hospital_match import _resolve

# Generic words in hospital names that don't help identify a specific brand.
_NAME_STOP = {
    "hospital", "hospitals", "the", "clinic", "clinics", "medical", "centre",
    "center", "care", "health", "healthcare", "city", "institute", "multispeciality",
    "multispecialty", "super", "speciality", "specialty",
}


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def _tokens(s: str) -> set[str]:
    return {t for t in _norm(s).split() if t and t not in _NAME_STOP}


def _match_hospitals(name: str, city: str) -> list[dict]:
    """Active partner hospitals whose name matches `name` (optionally filtered by city)."""
    q_norm = _norm(name)
    q_tokens = _tokens(name)
    city_norm = _norm(city)

    out = []
    for h in hospitals():
        hn = _norm(h.get("name", ""))
        matched = bool(
            (q_norm and (q_norm in hn or hn in q_norm))
            or (q_tokens and (q_tokens & _tokens(h.get("name", ""))))
        )
        if not matched:
            continue
        if city_norm and city_norm not in _norm(h.get("city", "")):
            continue
        out.append(h)
    return out


def _brief(h: dict) -> dict:
    return {
        "hospital_id": h.get("id"),
        "name": h.get("name"),
        "city": h.get("city"),
        "state": h.get("state"),
        "tier": h.get("tier"),
        "international_desk": h.get("international_desk", False),
    }


def _offered_procedures(h: dict) -> list[dict]:
    """The procedures this hospital prices, as {slug, label, specialty, usd_min}."""
    catalog = procedure_catalog()
    items = []
    for slug in procedures_at(h.get("id")):
        info = catalog.get(slug, {})
        items.append({
            "slug": slug,
            "label": info.get("label", slug.replace("-", " ")),
            "specialty": info.get("specialty"),
            "usd_min": (cost_for(h.get("id"), slug) or {}).get("total_usd_min"),
        })
    items.sort(key=lambda x: (x["specialty"] or "", x["label"]))
    return items


def get_hospital_cost(
    hospital_name: str,
    condition: str,
    city: str = "",
    origin_country: str = "",
) -> dict:
    """Cost & details for a SPECIFIC hospital the patient named (not ranked suggestions).

    Call this INSTEAD of find_hospitals when the patient names a particular hospital and
    asks about it, e.g. "what does Apollo charge for a kidney transplant?" or "is a heart
    bypass available at Fortis?". If the patient did NOT name a hospital, use find_hospitals.

    Args:
        hospital_name: The hospital the patient named, e.g. "Apollo", "Fortis Hospitals",
            "KIMS". Brand/partial names are fine.
        condition: The procedure or condition in plain language, e.g. "kidney transplant",
            "heart bypass", "knee replacement".
        city: OPTIONAL. A city to disambiguate when one brand has several branches
            (e.g. Apollo in Hyderabad vs Chennai). Leave "" if not specified.
        origin_country: OPTIONAL. The patient's 2-letter ISO code, for cost context.

    Returns:
        A dict whose "status" is one of: "ok" (with "hospitals": itemised cost per matching
        branch that offers it), "procedure_not_offered" (the hospital exists but doesn't do
        it — "hospitals" carries each branch's specialties + "available_procedures"),
        "procedure_unrecognized" (condition didn't map to a procedure — lists what's
        offered), or "hospital_not_found" (not in our network — "available_hospitals" lists
        ours). Never invents a price; report the status honestly to the patient.
    """
    name = (hospital_name or "").strip()
    if not name:
        return {"status": "need_hospital_name", "message": "Which hospital would you like me to check?"}

    matches = _match_hospitals(name, city)
    if not matches:
        return {
            "status": "hospital_not_found",
            "query": {"hospital_name": name, "city": city},
            "message": f"We don't have a partner hospital matching '{name}'"
                       + (f" in {city}" if city else "") + ".",
            "available_hospitals": sorted({h["name"] for h in hospitals()}),
        }

    catalog = procedure_catalog()
    slug = _resolve(condition) if condition else None

    # Hospital(s) found, but we couldn't map the condition to a real procedure.
    if condition and not (slug and slug in catalog):
        # Union of what the matched hospitals offer, so the agent can guide the patient.
        union: dict[str, dict] = {}
        for h in matches:
            for p in _offered_procedures(h):
                union.setdefault(p["slug"], p)
        return {
            "status": "procedure_unrecognized",
            "query": {"hospital_name": name, "city": city, "condition": condition},
            "hospitals": [_brief(h) for h in matches],
            "available_procedures": sorted(union.values(), key=lambda x: (x["specialty"] or "", x["label"])),
            "message": f"I couldn't match '{condition}' to a specific procedure.",
        }

    procedure_label = catalog[slug]["label"]
    specialty = catalog[slug]["specialty"]

    offering = [h for h in matches if cost_for(h["id"], slug)]

    # The hospital exists but none of the matched branches price this procedure.
    if not offering:
        return {
            "status": "procedure_not_offered",
            "query": {"hospital_name": name, "city": city, "condition": condition},
            "matched_procedure": slug,
            "procedure_label": procedure_label,
            "specialty": specialty,
            "hospitals": [
                {**_brief(h), "specialties": h.get("specialties", []), "available_procedures": _offered_procedures(h)}
                for h in matches
            ],
            "message": f"{matches[0]['name']}"
                       + (f" ({matches[0]['city']})" if len(matches) == 1 else "")
                       + f" doesn't offer {procedure_label}.",
        }

    # Success — itemised cost for each matching branch that offers it.
    estimates = [estimate_cost(h["id"], slug, origin_country) for h in offering]
    not_offering = [f"{h['name']} ({h['city']})" for h in matches if h not in offering]
    return {
        "status": "ok",
        "query": {"hospital_name": name, "city": city, "condition": condition},
        "matched_procedure": slug,
        "procedure_label": procedure_label,
        "specialty": specialty,
        "hospitals": estimates,
        "not_offering": not_offering,
    }
