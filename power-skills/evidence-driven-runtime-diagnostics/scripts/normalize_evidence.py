#!/usr/bin/env python3
"""normalize_evidence.py - deterministic evidence normalization primitives.

Every function here is pure: identical input bytes always produce identical
output. No wall-clock reads, no randomness, no locale-dependent operations,
no network. Timestamps without a UTC offset are NEVER converted or ordered;
they are reported as timezone_status MISSING.
"""
from __future__ import annotations

import datetime as _dt
import re
import unicodedata

_WHITESPACE_RE = re.compile(r"\s+")


def normalize_text(text: str) -> str:
    """NFKC normalization, lowercase, collapsed whitespace."""
    return _WHITESPACE_RE.sub(" ", unicodedata.normalize("NFKC", text)).strip().lower()


def parse_timestamp(raw: str):
    """Parse an ISO-8601 timestamp deterministically.

    Returns (epoch_seconds_or_None, normalized_utc_string_or_None, tz_status)
    where tz_status is KNOWN, MISSING, or INVALID.
    A naive timestamp (no offset) yields (None, None, "MISSING") - never a
    locally-interpreted epoch, because local timezone would break determinism.
    """
    if not isinstance(raw, str) or not raw.strip():
        return None, None, "INVALID"
    text = raw.strip()
    try:
        parsed = _dt.datetime.fromisoformat(text)
    except ValueError:
        return None, None, "INVALID"
    if parsed.tzinfo is None:
        return None, None, "MISSING"
    utc = parsed.astimezone(_dt.timezone.utc)
    return int(utc.timestamp()), utc.isoformat(), "KNOWN"


def duplicate_key(source: str, normalized_message: str, ts_key: str) -> str:
    """Deterministic duplicate-identity key for a log entry."""
    return f"{source}\x1f{normalized_message}\x1f{ts_key}"


def ts_key_for(raw_timestamp: str, normalized: str | None) -> str:
    """Stable key part for duplicate detection: normalized UTC when known,
    otherwise the raw text so that two identical raw naive stamps still match."""
    return normalized if normalized is not None else f"raw:{raw_timestamp}"


def extract_order_assertions(normalized_message: str, order_regex) -> list[tuple[str, str]]:
    """Extract (first, second) event-order assertions from a normalized message."""
    out = []
    for match in order_regex.finditer(normalized_message):
        out.append((match.group(1), match.group(2)))
    return out


def canonical_json(value) -> str:
    """Canonical serialization: sorted keys, no whitespace, ASCII only.
    Identical data always yields identical bytes on every platform."""
    return json_dumps(value)


def json_dumps(value) -> str:
    import json
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
