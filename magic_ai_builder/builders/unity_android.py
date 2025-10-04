from __future__ import annotations

import os
from typing import Optional, Dict, List

from magic_ai_builder.process import run_command
from magic_ai_builder.config import BuilderConfig


def build_unity_android(project_dir: str, build_script_class: str, output_name: str, config: BuilderConfig, extra_args: Optional[List[str]] = None) -> str:
    if not config.unity_path:
        raise RuntimeError("Unity path not configured. Set BuilderConfig.unity_path")

    project_dir = os.path.abspath(project_dir)
    output_dir = os.path.abspath(config.build_output_dir)
    os.makedirs(output_dir, exist_ok=True)
    output_apk = os.path.join(output_dir, output_name if output_name.endswith('.apk') else output_name + '.apk')

    cmd = [
        config.unity_path,
        "-quit",
        "-batchmode",
        "-nographics",
        f"-projectPath", project_dir,
        f"-executeMethod", build_script_class,
        f"-buildTarget", "Android",
        f"-customBuildPath", output_apk,
    ]

    if extra_args:
        cmd += extra_args

    env: Dict[str, str] = {}
    if config.android_sdk_root:
        env["ANDROID_SDK_ROOT"] = config.android_sdk_root
        env["ANDROID_HOME"] = config.android_sdk_root
    if config.java_home:
        env["JAVA_HOME"] = config.java_home
        env["PATH"] = os.pathsep.join([os.path.join(config.java_home, "bin"), os.environ.get("PATH", "")])

    stdout, stderr, code = run_command(cmd, cwd=project_dir, env=env, check=True)
    if not os.path.exists(output_apk):
        raise RuntimeError("Unity reported success but output APK not found.")
    return output_apk
