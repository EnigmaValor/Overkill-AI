from __future__ import annotations

import subprocess
import os
from typing import Dict, List, Optional, Tuple


class ProcessError(RuntimeError):
    def __init__(self, cmd: List[str], returncode: int, stdout: str, stderr: str):
        super().__init__(f"Command failed: {' '.join(cmd)} (code {returncode})")
        self.cmd = cmd
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


def run_command(cmd: List[str], cwd: Optional[str] = None, env: Optional[Dict[str, str]] = None, check: bool = True) -> Tuple[str, str, int]:
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    process = subprocess.Popen(
        cmd,
        cwd=cwd,
        env=merged_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    stdout, stderr = process.communicate()
    if check and process.returncode != 0:
        raise ProcessError(cmd, process.returncode, stdout, stderr)
    return stdout, stderr, process.returncode
