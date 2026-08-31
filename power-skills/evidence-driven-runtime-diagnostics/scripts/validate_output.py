#!/usr/bin/env python3
"""validate_output.py - schema validator for diagnostic outputs.

CLI: python scripts/validate_output.py <output.json>
Exit codes: 0 valid, 1 invalid, 2 usage error.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from validate_input import validate_document  # noqa: E402

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "schemas" / "diagnostic-output.schema.json"


def main(argv):
    if len(argv) != 2:
        print("usage: python scripts/validate_output.py <output.json>", file=sys.stderr)
        return 2
    try:
        document = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"valid": False,
                          "errors": [f"unreadable or non-JSON output: {exc}"]}, ensure_ascii=True))
        return 1
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    errors = validate_document(document, schema)
    print(json.dumps({"valid": not errors, "errors": errors}, ensure_ascii=True, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
