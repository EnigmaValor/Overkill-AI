#!/usr/bin/env sh

# Simplified Gradle wrapper script for non-interactive CI
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
JAVA_HOME=${JAVA_HOME:-}
exec "${JAVA_HOME:+$JAVA_HOME/bin/}java" -jar "$DIR/gradle/wrapper/gradle-wrapper.jar" "$@"
