import uuid
from datetime import datetime, timezone as dt_timezone
from django.utils import timezone


def _parse_iso_timestamp(value):
    """Parse an ISO-8601 timestamp string into a UTC datetime for sorting."""
    if not value or not isinstance(value, str):
        return datetime.min.replace(tzinfo=dt_timezone.utc)
    try:
        cleaned = value.strip()
        if cleaned.endswith('Z'):
            cleaned = cleaned[:-1] + '+00:00'
        parsed = datetime.fromisoformat(cleaned)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=dt_timezone.utc)
        return parsed
    except (ValueError, TypeError):
        return datetime.min.replace(tzinfo=dt_timezone.utc)


def _normalize_entry(entry):
    if not isinstance(entry, dict):
        return None
    timestamp = entry.get('timestamp') or entry.get('verifiedAt') or ''
    if not timestamp:
        return None
    verified = bool(entry.get('verified', False))
    action = str(entry.get('action') or ('verified' if verified else 'unverified')).strip()
    by = str(entry.get('by') or entry.get('verifiedBy') or 'Admin').strip() or 'Admin'
    notes = str(entry.get('notes') or '').strip()
    summary = str(entry.get('summary') or '').strip()
    entry_id = str(entry.get('id') or '').strip() or f"vh-{uuid.uuid4().hex[:12]}"

    normalized = {
        'id': entry_id,
        'action': action,
        'verified': verified,
        'timestamp': str(timestamp),
        'by': by,
        'notes': notes,
    }
    if summary:
        normalized['summary'] = summary
    return normalized


def normalize_review_history(review):
    """
    Extract and normalize verification history entries from a review dict,
    backfilling a legacy entry from verifiedAt when no history list exists.
    Returns entries sorted newest-first.
    """
    if not isinstance(review, dict):
        return []

    raw_history = review.get('history')
    entries = []
    if isinstance(raw_history, list):
        for item in raw_history:
            norm = _normalize_entry(item)
            if norm:
                entries.append(norm)

    if not entries and review.get('verifiedAt'):
        legacy_verified = bool(review.get('verified', True))
        entries.append({
            'id': f"legacy-{review['verifiedAt']}",
            'action': 'verified' if legacy_verified else 'unverified',
            'verified': legacy_verified,
            'timestamp': str(review['verifiedAt']),
            'by': str(review.get('verifiedBy') or 'Admin').strip() or 'Admin',
            'notes': str(review.get('notes') or '').strip(),
            'summary': 'Verified entry' if legacy_verified else 'Marked as unverified',
        })

    entries.sort(key=lambda e: _parse_iso_timestamp(e.get('timestamp')), reverse=True)
    return entries


def merge_review_histories(history_a, history_b):
    """
    Merge two history entry lists, deduplicating by entry id and identical
    (timestamp, action, verified, by) tuples, sorted newest-first.
    """
    seen_ids = set()
    seen_tuples = set()
    merged = []

    for raw in list(history_a or []) + list(history_b or []):
        entry = _normalize_entry(raw)
        if not entry:
            continue
        dedup_tuple = (
            entry['timestamp'],
            entry['action'],
            entry['verified'],
            entry['by'].lower(),
        )
        if entry['id'] in seen_ids or dedup_tuple in seen_tuples:
            continue
        seen_ids.add(entry['id'])
        seen_tuples.add(dedup_tuple)
        merged.append(entry)

    merged.sort(key=lambda e: _parse_iso_timestamp(e.get('timestamp')), reverse=True)
    return merged


def build_review_with_history(
    existing_review,
    incoming_review,
    actor_name='Admin',
    changed_fields=None,
    publish_change=None,
):
    """
    Combine existing DB review state with an incoming review payload,
    ensuring every verification/unverification/publish/unpublish/update records a timestamped history entry.
    """
    existing = existing_review if isinstance(existing_review, dict) else {}
    incoming = incoming_review if isinstance(incoming_review, dict) else {}

    existing_history = normalize_review_history(existing)
    now_iso = timezone.now().isoformat()

    is_verified = bool(incoming.get('verified', False))
    was_verified = bool(existing.get('verified', False))
    by = str(incoming.get('verifiedBy') or actor_name or 'Admin').strip() or 'Admin'
    notes = str(incoming.get('notes') or '').strip()

    incoming_history_raw = incoming.get('history')
    if isinstance(incoming_history_raw, list) and len(incoming_history_raw) > 0:
        merged_history = merge_review_histories(incoming_history_raw, existing_history)
    else:
        changed = [f for f in (changed_fields or []) if f not in ('review', 'is_published')]
        if publish_change in ('published', 'unpublished') and is_verified == was_verified and not changed:
            action = publish_change
            summary = (
                'Unpublished word from student lexicon'
                if publish_change == 'unpublished'
                else 'Re-published word to student lexicon'
            )
        elif is_verified and not was_verified:
            action = 'edited_and_verified' if changed else 'verified'
            summary = (
                f"Updated {', '.join(changed)} & verified"
                if changed
                else 'Marked as verified'
            )
        elif not is_verified and was_verified:
            action = 'unverified'
            summary = 'Marked as unverified'
        elif is_verified and was_verified:
            action = 'edited_and_verified' if changed else 'attestation_updated'
            summary = (
                f"Updated {', '.join(changed)} & verified"
                if changed
                else 'Updated editorial attestation'
            )
        else:
            action = 'attestation_updated'
            summary = 'Updated editorial notes (unverified)'

        entry_timestamp = (
            str(incoming.get('verifiedAt'))
            if (is_verified and not was_verified and incoming.get('verifiedAt'))
            else now_iso
        )
        new_entry = {
            'id': f"vh-{uuid.uuid4().hex[:12]}",
            'action': action,
            'verified': is_verified,
            'timestamp': entry_timestamp,
            'by': by,
            'notes': notes,
            'summary': summary,
        }
        merged_history = merge_review_histories([new_entry], existing_history)

    if is_verified:
        latest_verified = next((e for e in merged_history if e.get('verified')), None)
        verified_at = (
            incoming.get('verifiedAt')
            or existing.get('verifiedAt')
            or (latest_verified['timestamp'] if latest_verified else None)
            or now_iso
        )
    else:
        verified_at = None

    return {
        'verified': is_verified,
        'verifiedAt': verified_at,
        'verifiedBy': by,
        'notes': notes,
        'history': merged_history,
    }
