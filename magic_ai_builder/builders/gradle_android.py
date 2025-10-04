from __future__ import annotations

import os
from typing import Optional, Dict, List

from magic_ai_builder.process import run_command
from magic_ai_builder.config import BuilderConfig


def build_gradle_android(project_dir: str, variant: str, config: BuilderConfig, extra_gradle_args: Optional[List[str]] = None) -> str:
    project_dir = os.path.abspath(project_dir)
    gradlew = os.path.join(project_dir, "gradlew")
    gradle_cmd = [gradlew if os.path.exists(gradlew) else "gradle"]

    task = f"assemble{variant[0].upper()}{variant[1:]}"
    cmd = gradle_cmd + [task]
    if extra_gradle_args:
        cmd += extra_gradle_args

    env: Dict[str, str] = {}
    if config.android_sdk_root:
        env["ANDROID_SDK_ROOT"] = config.android_sdk_root
        env["ANDROID_HOME"] = config.android_sdk_root
    if config.java_home:
        env["JAVA_HOME"] = config.java_home
        env["PATH"] = os.pathsep.join([os.path.join(config.java_home, "bin"), os.environ.get("PATH", "")])

    stdout, stderr, code = run_command(cmd, cwd=project_dir, env=env, check=True)

    # Find APK outputs in project
    outputs: List[str] = []
    for root, _, files in os.walk(os.path.join(project_dir, "app", "build", "outputs")):
        for f in files:
            if f.endswith(".apk"):
                outputs.append(os.path.join(root, f))

    if not outputs:
        # fallback: search anywhere under project_dir
        for root, _, files in os.walk(project_dir):
            for f in files:
                if f.endswith(".apk"):
                    outputs.append(os.path.join(root, f))

    if not outputs:
        raise RuntimeError("Build finished but no APK was found.")

    # Copy first apk to configured output dir
    os.makedirs(config.build_output_dir, exist_ok=True)
    apk_src = sorted(outputs)[-1]
    apk_name = os.path.basename(apk_src)
    apk_dest = os.path.join(config.build_output_dir, apk_name)

    with open(apk_src, "rb") as src, open(apk_dest, "wb") as dst:
        dst.write(src.read())

    return apk_dest
