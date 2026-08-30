#!/usr/bin/env bash
# Reproducible build: web UI → bundled assets → Android APK (arm64-v8a).
#
# Optional signing (release):
#   PG_KEYSTORE_FILE=/path/key.jks PG_KEYSTORE_PASSWORD=... PG_KEY_ALIAS=... PG_KEY_PASSWORD=... ./scripts/build-android.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> [1/4] Building web UI (React/Vite)"
npm run build

echo "==> [2/4] Checking Gradle"
if [ ! -x android/gradlew ]; then
  if command -v gradle >/dev/null 2>&1; then
    (cd android && gradle wrapper --gradle-version 8.2 --distribution-type bin)
  else
    echo "Gradle 8.2+ is required to generate the wrapper (not installed)."
    echo "Install Gradle 8.2 or run: cd android && gradle wrapper --gradle-version 8.2"
    exit 1
  fi
fi

echo "==> [3/4] Running JVM unit tests"
(cd android && ./gradlew :app:testDebugUnitTest)

echo "==> [4/4] Building APKs"
ARGS=(:app:assembleDebug :app:assembleRelease)
if [ -n "${PG_KEYSTORE_FILE:-}" ]; then
  ARGS+=(
    "-PPG_KEYSTORE_FILE=$PG_KEYSTORE_FILE"
    "-PPG_KEYSTORE_PASSWORD=$PG_KEYSTORE_PASSWORD"
    "-PPG_KEY_ALIAS=$PG_KEY_ALIAS"
    "-PPG_KEY_PASSWORD=$PG_KEY_PASSWORD"
  )
fi
(cd android && ./gradlew "${ARGS[@]}")

echo
echo "Build complete."
echo "  Debug APK:   android/app/build/outputs/apk/debug/app-debug.apk"
echo "  Release APK: android/app/build/outputs/apk/release/app-release-unsigned.apk"
echo "Install on GrapheneOS:"
echo "  adb install android/app/build/outputs/apk/debug/app-debug.apk"
echo "or copy the APK to the device and open it from Files (allow unknown sources)."
