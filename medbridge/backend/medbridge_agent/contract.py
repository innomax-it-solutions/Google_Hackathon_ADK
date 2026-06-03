"""Shared types and data loading for the MedBridge agent.

Everything that touches the knowledge base goes through here, so the tools stay
thin and there is exactly one place that knows the JSON file layout.

Data files (loaded once, cached for the process lifetime):
  hospital_registry.json  - list of hospitals (metadata, no costs)
  cost_matrix.json        - { hospital_id: { procedure_slug: {usd/inr, line_items, ...} } }
  country_doc_rules.json  - { ISO_code: {visa + docs + flight info} } plus _fx and GENERIC
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel, Field

_DATA_DIR = Path(__file__).parent / "data"


def _load(name: str):
    with open(_DATA_DIR / name, encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def _registry() -> list[dict]:
    return _load("hospital_registry.json")


@lru_cache(maxsize=1)
def _cost_matrix() -> dict:
    return _load("cost_matrix.json")


@lru_cache(maxsize=1)
def _doc_rules() -> dict:
    return _load("country_doc_rules.json")


# --- hospitals -------------------------------------------------------------

def hospitals() -> list[dict]:
    """Active MoU hospitals that also have cost data."""
    cm = _cost_matrix()
    return [h for h in _registry() if h.get("mou_active") and cm.get(h.get("id"))]


def hospital_by_id(hospital_id: str) -> dict | None:
    return next((h for h in _registry() if h.get("id") == hospital_id), None)


# --- costs -----------------------------------------------------------------

def cost_for(hospital_id: str, procedure_slug: str) -> dict | None:
    """The cost record for one hospital + procedure, or None if not offered."""
    return _cost_matrix().get(hospital_id, {}).get(procedure_slug)


def hospitals_offering(procedure_slug: str) -> list[str]:
    """Hospital ids that list a price for this procedure."""
    cm = _cost_matrix()
    return [hid for hid, procs in cm.items() if procedure_slug in procs]


@lru_cache(maxsize=1)
def procedure_catalog() -> dict[str, dict]:
    """slug -> {specialty, label, offered_by_count, usd_min}. Built from the
    cost matrix (the source of truth for what each hospital actually does)."""
    cm = _cost_matrix()
    catalog: dict[str, dict] = {}
    for procs in cm.values():
        for slug, info in procs.items():
            entry = catalog.setdefault(slug, {
                "slug": slug,
                "specialty": info.get("specialty"),
                "label": slug.replace("-", " "),
                "offered_by_count": 0,
                "usd_min": info.get("total_usd_min"),
            })
            entry["offered_by_count"] += 1
            umin = info.get("total_usd_min")
            if umin is not None and (entry["usd_min"] is None or umin < entry["usd_min"]):
                entry["usd_min"] = umin
    return catalog


# --- country / visa --------------------------------------------------------

def doc_rules() -> dict:
    return _doc_rules()


# --- API request schema (FastAPI / frontend contract) ----------------------

class IntakeRequest(BaseModel):
    condition: str = Field(min_length=3, description="Condition or procedure in plain language.")
    origin_country: str = Field(min_length=2, max_length=2, description="2-letter ISO code, e.g. AE.")
    budget_usd: int = Field(gt=0)
    timeline_weeks: int = Field(ge=1, default=6)
    session_id: str | None = Field(default=None, description="Reuse to continue a conversation.")
