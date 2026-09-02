import requests
from django.conf import settings


def _format_notes(patient):
    """Pulls together the clinical picture for the last few days: progress
    notes, nursing notes, and the most recent vitals/MAR entries. Kept as
    plain text since that's what the model needs, not structured JSON."""
    lines = [
        f"Patient: {patient.full_name} ({patient.admission_id})",
        f"Age: {patient.age}, Gender: {patient.gender}, Ward: {patient.ward}",
        f"Diagnosis: {patient.diagnosis or 'Not recorded'}",
        f"Days admitted: {patient.days_admitted}",
        "",
        "--- Progress Notes (most recent first) ---",
    ]
    for note in patient.progress_notes.select_related('author').all()[:10]:
        author = note.author.get_full_name() if note.author else 'Unknown'
        lines.append(f"[{note.created_at:%Y-%m-%d %H:%M}] {author}: {note.note}")

    lines.append("")
    lines.append("--- Nursing Notes (most recent first) ---")
    for note in patient.nursing_notes.select_related('nurse').all()[:10]:
        nurse = note.nurse.get_full_name() if note.nurse else 'Unknown'
        lines.append(f"[{note.created_at:%Y-%m-%d %H:%M}] {note.shift} - {nurse}: {note.note}")

    latest_vitals = patient.vitals_checks.first()
    if latest_vitals:
        lines.append("")
        lines.append("--- Most Recent Vitals ---")
        lines.append(
            f"Temp: {latest_vitals.temperature_c}C, Pulse: {latest_vitals.pulse_bpm} bpm, "
            f"BP: {latest_vitals.blood_pressure} (recorded {latest_vitals.recorded_at:%Y-%m-%d %H:%M})"
        )

    recent_mar = patient.mar_entries.all()[:10]
    if recent_mar:
        lines.append("")
        lines.append("--- Recent Medication Administration ---")
        for mar in recent_mar:
            lines.append(
                f"[{mar.scheduled_time:%Y-%m-%d %H:%M}] {mar.medication} {mar.dose} - {mar.status}"
            )

    return "\n".join(lines)


def generate_patient_summary(patient):
    """Calls the Claude API to produce a concise clinical handover summary
    from a patient's recent notes. Raises RuntimeError with a friendly
    message on any failure (missing key, network issue, API error) so the
    view can turn it into a clean error response instead of a 500."""
    api_key = getattr(settings, 'ANTHROPIC_API_KEY', '')
    if not api_key:
        raise RuntimeError('AI summaries are not configured - ANTHROPIC_API_KEY is missing.')

    clinical_text = _format_notes(patient)

    prompt = (
        "You are assisting nursing and clinical staff at a care facility. "
        "Summarize the following patient record into a concise shift-handover "
        "summary. Use short sections: Overview, Recent Changes, Medications, "
        "Flags for Next Shift. Be factual and only use information given - do "
        "not invent details. Keep it under 200 words.\n\n" + clinical_text
    )

    try:
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-5",
                "max_tokens": 500,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30,
        )
    except requests.RequestException as exc:
        raise RuntimeError(f"Could not reach the AI service: {exc}")

    if response.status_code != 200:
        raise RuntimeError(f"AI summary request failed (status {response.status_code}).")

    data = response.json()
    text_blocks = [block['text'] for block in data.get('content', []) if block.get('type') == 'text']
    summary = "\n".join(text_blocks).strip()
    if not summary:
        raise RuntimeError('AI summary came back empty.')
    return summary
