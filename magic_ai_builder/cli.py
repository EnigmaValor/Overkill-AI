from __future__ import annotations

import argparse
import json
from magic_ai_builder.config import BuilderConfig, AndroidSigningConfig
from magic_ai_builder.builders.gradle_android import build_gradle_android
from magic_ai_builder.builders.unity_android import build_unity_android
from magic_ai_builder.packaging.signing import sign_apk_with_apksigner


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Magic AI Builder CLI")
    sub = parser.add_subparsers(dest="cmd", required=True)

    g = sub.add_parser("gradle", help="Build Android APK using Gradle")
    g.add_argument("project_dir")
    g.add_argument("--variant", default="Release")
    g.add_argument("--extra", nargs=argparse.REMAINDER, default=[])

    u = sub.add_parser("unity", help="Build Android APK using Unity")
    u.add_argument("project_dir")
    u.add_argument("--build-method", required=True, help="C# static method, e.g. BuildScripts.AndroidBuild.Build")
    u.add_argument("--output-name", default="unity_build.apk")
    u.add_argument("--extra", nargs=argparse.REMAINDER, default=[])

    parser.add_argument("--build-output-dir", default=None)
    parser.add_argument("--android-sdk-root", default=None)
    parser.add_argument("--java-home", default=None)
    parser.add_argument("--unity-path", default=None)

    parser.add_argument("--keystore", default=None)
    parser.add_argument("--keystore-pass", default=None)
    parser.add_argument("--key-alias", default=None)
    parser.add_argument("--key-pass", default=None)

    return parser.parse_args()


def main() -> None:
    args = parse_args()

    signing = AndroidSigningConfig(
        keystore_path=args.keystore,
        keystore_password=args.keystore_pass,
        key_alias=args.key_alias,
        key_password=args.key_pass,
    )

    config = BuilderConfig(
        build_output_dir=args.build_output_dir or "dist",
        android_sdk_root=args.android_sdk_root,
        java_home=args.java_home,
        unity_path=args.unity_path,
        signing=signing,
    )
    config.ensure_dirs()

    if args.cmd == "gradle":
        apk = build_gradle_android(args.project_dir, args.variant, config, args.extra)
    else:
        apk = build_unity_android(args.project_dir, args.build_method, args.output_name, config, args.extra)

    signed = sign_apk_with_apksigner(apk, config)
    print(json.dumps({"apk": signed}, indent=2))


if __name__ == "__main__":
    main()
