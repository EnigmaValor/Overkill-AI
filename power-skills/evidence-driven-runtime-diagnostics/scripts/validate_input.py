#!/usr/bin/env python3
"""validate_input.py - schema validator for incident inputs.

Implements the deterministic JSON-Schema subset used by this package:
type (including unions with null), enum, const, required, properties,
items, minLength, minItems, minimum. Standard library only.

CLI: python scripts/validate_input.py <incident.json>
Exit codes: 0 valid, 1 invalid, 2 usage error.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "schemas" / "incident-input.schema.json"


class SchemaError(Exception):
    pass


def _type_ok(value, expected):
    if isinstance(expected, list):
        return any(_type_ok(value, t) for t in expected)
    if expected == "object":
        return isinstance(value, dict)
    if expected == "array":
        return isinstance(value, list)
    if expected == "string":
        return isinstance(value, str)
    if expected == "boolean":
        return isinstance(value, bool)
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if expected == "null":
        return value is None
    raise SchemaError(f"unsupported type keyword: {expected}")


def validate(value, schema, path="$"):
    """Return a deterministic list of error strings. Empty list means valid."""
    errors: list[str] = []
    if "type" in schema and not _type_ok(value, schema["type"]):
        errors.append(f"{path}: expected type {schema['type']}, found {type(value).__name__}")
        return errors
    if "const" in schema and value != schema["const"]:
        errors.append(f"{path}: expected const {schema['const']!r}, found {value!r}")
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: value {value!r} not in enum {schema['enum']}")
    if isinstance(value, str) and "minLength" in schema and len(value) < schema["minLength"]:
        errors.append(f"{path}: string shorter than minLength {schema['minLength']}")
    if isinstance(value, (int, float)) and not isinstance(value, bool) and "minimum" in schema:
        if value < schema["minimum"]:
            errors.append(f"{path}: value {value} below minimum {schema['minimum']}")
    if isinstance(value, dict):
        for req in schema.get("required", []):
            if req not in value:
                errors.append(f"{path}: missing required property {req!r}")
        for key, sub in sorted(schema.get("properties", {}).items()):
            if key in value:
                errors.extend(validate(value[key], sub, f"{path}.{key}"))
        if schema.get("additionalProperties") is False:
            known = set(schema.get("properties", {}))
            for key in sorted(set(value) - known):
                errors.append(f"{path}: unexpected property {key!r}")
    if isinstance(value, list):
        if "minItems" in schema and len(value) < schema["minItems"]:
            errors.append(f"{path}: fewer than minItems {schema['minItems']}")
        if "items" in schema:
            for idx, item in enumerate(value):
                errors.extend(validate(item, schema["items"], f"{path}[{idx}]"))
    return errors


def validate_document(document, schema):
    return validate(document, schema, "$")


def main(argv):
    if len(argv) != 2:
        print("usage: python scripts/validate_input.py <incident.json>", file=sys.stderr)
        return 2
    try:
        document = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"valid": False, "errors": [f"unreadable or non-JSON input: {exc}"]}, ensure_ascii=True))
        return 1
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    errors = validate_document(document, schema)
    print(json.dumps({"valid": not errors, "errors": errors}, ensure_ascii=True, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
