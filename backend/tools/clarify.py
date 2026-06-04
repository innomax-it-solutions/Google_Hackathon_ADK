"""Tool: ask_patient_details — request missing intake details from the patient.

Instead of asking for missing information in prose ("I need more info…"), the agent
calls this tool with the list of fields it still needs. The frontend renders those
fields as a short interactive popup above the chat input; the patient fills them and
their answers come back as the next message. The tool itself just acknowledges the
request — it performs no lookup.
"""

from __future__ import annotations

_KNOWN = {"condition", "origin_country", "budget_usd", "timeline_weeks", "interpreter_language"}


def ask_patient_details(missing_fields: list[str]) -> dict:
    """Ask the patient to provide specific missing intake details via a UI popup.

    Call this INSTEAD of asking in prose when you cannot start planning because key
    details are missing. Then stop and wait — do not call other tools or write a plan
    until the patient answers.

    Args:
        missing_fields: The details you still need, as a list of these exact field
            names: "condition" (the procedure/treatment), "origin_country" (their
            home country), "budget_usd" (their budget), "timeline_weeks" (how soon),
            "interpreter_language" (a language interpreter they may want). Include
            every field the patient has not already given you.

    Returns:
        A dict confirming the request was posted to the patient. The patient's answers
        will arrive as their next message.
    """
    fields = [f for f in (missing_fields or []) if f in _KNOWN]
    return {"status": "posted", "fields": fields}
