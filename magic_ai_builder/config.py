from __future__ import annotations

import os
from dataclasses import dataclass, field
import json
from typing import Optional, List


@dataclass
class AndroidSigningConfig:
    keystore_path: Optional[str] = None
    keystore_password: Optional[str] = None
    key_alias: Optional[str] = None
    key_password: Optional[str] = None


@dataclass
class BuilderConfig:
    workspace_root: str = os.getcwd()
    build_output_dir: str = os.path.join(os.getcwd(), "dist")
    android_sdk_root: Optional[str] = os.environ.get("ANDROID_SDK_ROOT") or os.environ.get("ANDROID_HOME")
    java_home: Optional[str] = os.environ.get("JAVA_HOME")
    unity_path: Optional[str] = None  # e.g., /opt/unity/Editor/Unity
    signing: AndroidSigningConfig = field(default_factory=AndroidSigningConfig)
    allowed_projects: List[str] = None  # whitelist of project paths relative to workspace

    def ensure_dirs(self) -> None:
        os.makedirs(self.build_output_dir, exist_ok=True)

    @staticmethod
    def from_env_or_file(config_path: Optional[str] = None) -> "BuilderConfig":
        # Load from file if provided
        if config_path and os.path.exists(config_path):
            with open(config_path, "r") as f:
                data = json.load(f)
            signing = data.get("signing", {})
            return BuilderConfig(
                workspace_root=data.get("workspace_root", os.getcwd()),
                build_output_dir=data.get("build_output_dir", os.path.join(os.getcwd(), "dist")),
                android_sdk_root=data.get("android_sdk_root") or os.environ.get("ANDROID_SDK_ROOT") or os.environ.get("ANDROID_HOME"),
                java_home=data.get("java_home") or os.environ.get("JAVA_HOME"),
                unity_path=data.get("unity_path"),
                signing=AndroidSigningConfig(
                    keystore_path=signing.get("keystore_path"),
                    keystore_password=signing.get("keystore_password"),
                    key_alias=signing.get("key_alias"),
                    key_password=signing.get("key_password"),
                ),
                allowed_projects=data.get("allowed_projects"),
            )

        # Fallback to env
        return BuilderConfig(
            workspace_root=os.getcwd(),
            build_output_dir=os.environ.get("MAB_BUILD_OUTPUT_DIR", os.path.join(os.getcwd(), "dist")),
            android_sdk_root=os.environ.get("ANDROID_SDK_ROOT") or os.environ.get("ANDROID_HOME"),
            java_home=os.environ.get("JAVA_HOME"),
            unity_path=os.environ.get("UNITY_PATH"),
            signing=AndroidSigningConfig(
                keystore_path=os.environ.get("MAB_KEYSTORE"),
                keystore_password=os.environ.get("MAB_KEYSTORE_PASS"),
                key_alias=os.environ.get("MAB_KEY_ALIAS"),
                key_password=os.environ.get("MAB_KEY_PASS"),
            ),
        )
