"""Tool: request_appointment — take a real action on the patient's behalf.

This is the agent's first *action* tool (vs. read-only lookups). Today it
records an appointment request and returns a reference; later this is where you
plug in the hospital's real booking API and/or a flight-ticket API.
"""

from __future__ import annotations

from ..contract import hospital_by_id

# In-memory log of requests made this process. Swap for Firestore / a real API.
_REQUESTS: list[dict] = []


def request_appointment(
    hospital_id: str,
    patient_name: str,
    procedure: str,
    preferred_date: str,
) -> dict:
    """Request a treatment appointment at a hospital on the patient's behalf.

    Only call this once the patient has SEEN their Journey Plan and explicitly
    asks to proceed / book / reserve. Do not call it speculatively.

    Args:
        hospital_id: The chosen hospital id, e.g. "apollo-hyd-001".
        patient_name: The patient's full name.
        procedure: The procedure slug, e.g. "knee-replacement".
        preferred_date: The patient's preferred date (free text, e.g. "2026-07-15" or "mid-July").

    Returns:
        A dict with "status" and, on success, a "reference" the patient can quote,
        plus the hospital's international-desk contact for confirmation.
    """
    hospital = hospital_by_id(hospital_id)
    if not hospital:
        return {"status": "error", "message": f"Unknown hospital '{hospital_id}'."}

    seq = len(_REQUESTS) + 1
    reference = f"MB-{hospital_id.split('-')[0].upper()}-{seq:04d}"
    record = {
        "reference": reference,
        "hospital_id": hospital_id,
        "hospital_name": hospital["name"],
        "patient_name": patient_name,
        "procedure": procedure,
        "preferred_date": preferred_date,
    }
    _REQUESTS.append(record)

    has_desk = hospital.get("international_desk", False)
    return {
        "status": "requested",
        "reference": reference,
        "hospital_name": hospital["name"],
        "city": hospital.get("city"),
        "has_international_desk": has_desk,
        "message": (
            f"Appointment request {reference} logged with {hospital['name']}, "
            f"{hospital.get('city')} for {patient_name}. "
            + ("Their international patient desk will confirm next steps."
               if has_desk else
               "Our coordinator will liaise with the hospital and confirm next steps.")
        ),
    }
