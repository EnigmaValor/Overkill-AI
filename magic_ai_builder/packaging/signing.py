from __future__ import annotations

import os
from typing import Optional

from magic_ai_builder.config import BuilderConfig
from magic_ai_builder.process import run_command


def sign_apk_with_apksigner(apk_path: str, config: BuilderConfig) -> str:
    if not config.signing.keystore_path:
        return apk_path
    keystore = config.signing.keystore_path
    if not os.path.exists(keystore):
        raise FileNotFoundError(f"Keystore not found: {keystore}")

    signed_apk = apk_path.replace(".apk", "-signed.apk")

    cmd = [
        "apksigner", "sign",
        "--ks", keystore,
        "--ks-pass", f"pass:{config.signing.keystore_password or ''}",
        "--ks-key-alias", config.signing.key_alias or "androidkey",
    ]

    if config.signing.key_password:
        cmd += ["--key-pass", f"pass:{config.signing.key_password}"]

    cmd += ["--out", signed_apk, apk_path]

    run_command(cmd, check=True)

    # verify
    run_command(["apksigner", "verify", "--verbose", signed_apk], check=True)
    return signed_apk
