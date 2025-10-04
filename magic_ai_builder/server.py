from __future__ import annotations

import os
from dataclasses import asdict
from typing import Optional

from flask import Flask, render_template, request, jsonify

from magic_ai_builder.config import BuilderConfig
from magic_ai_builder.builders.gradle_android import build_gradle_android
from magic_ai_builder.builders.unity_android import build_unity_android
from magic_ai_builder.packaging.signing import sign_apk_with_apksigner


def create_app(config: Optional[BuilderConfig] = None, config_path: Optional[str] = None) -> Flask:
    app = Flask(__name__, template_folder=os.path.join(os.getcwd(), "templates"), static_folder=os.path.join(os.getcwd(), "static"))
    cfg = config or BuilderConfig.from_env_or_file(config_path)
    cfg.ensure_dirs()

    @app.route("/")
    def index():
        return render_template("index.html", config=asdict(cfg))

    @app.route("/dashboard")
    def dashboard():
        # Serves the Epic Gold Tier dashboard React app (CDN based)
        return render_template("dashboard.html")

    @app.post("/api/build/gradle")
    def api_build_gradle():
        data = request.json or {}
        project_dir = data.get("project_dir")
        variant = data.get("variant", "Release")
        extra_args = data.get("extra_args", [])

        if not project_dir:
            return jsonify({"error": "project_dir required"}), 400
        try:
            apk = build_gradle_android(project_dir, variant, cfg, extra_args)
            apk = sign_apk_with_apksigner(apk, cfg)
            return jsonify({"apk": apk})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.post("/api/build/unity")
    def api_build_unity():
        data = request.json or {}
        project_dir = data.get("project_dir")
        build_method = data.get("build_method")  # e.g., "BuildScripts.AndroidBuild.Build"
        output_name = data.get("output_name", "unity_build.apk")
        extra_args = data.get("extra_args", [])

        if not project_dir or not build_method:
            return jsonify({"error": "project_dir and build_method required"}), 400
        try:
            apk = build_unity_android(project_dir, build_method, output_name, cfg, extra_args)
            apk = sign_apk_with_apksigner(apk, cfg)
            return jsonify({"apk": apk})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.get("/api/ai/suggestions")
    def api_ai_suggestions():
        # placeholder AI suggestions - could be replaced with real LLM
        suggestions = [
            "Enable R8/Proguard for smaller APKs",
            "Use Android App Bundle (AAB) for Play Store",
            "Split ABI to reduce APK size",
            "Cache Gradle dependencies in CI",
            "Use addressables in Unity for asset management",
        ]
        return jsonify({"suggestions": suggestions})

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
