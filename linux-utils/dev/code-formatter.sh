#!/bin/bash
# Code Formatter Utility for Linux
# Formats code files using various formatters

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo "Usage: $0 [OPTIONS] [FILES/DIRECTORIES]"
    echo ""
    echo "Code formatter utility for Linux"
    echo ""
    echo "Options:"
    echo "  -l, --language LANG     Language/format type (auto-detect if not specified)"
    echo "  -f, --formatter TOOL    Formatter tool to use (auto-detect if not specified)"
    echo "  -r, --recursive         Format files recursively"
    echo "  -i, --in-place          Format files in place (default)"
    echo "  -d, --diff              Show diff instead of formatting"
    echo "  -c, --check             Check if files are formatted correctly"
    echo "  -v, --verbose           Verbose output"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Supported languages and formatters:"
    echo "  Python: black, autopep8, yapf"
    echo "  JavaScript/TypeScript: prettier, eslint"
    echo "  JSON: prettier, jq"
    echo "  XML: xmllint"
    echo "  HTML: prettier, tidy"
    echo "  CSS: prettier, stylelint"
    echo "  Go: gofmt, goimports"
    echo "  Rust: rustfmt"
    echo "  C/C++: clang-format, astyle"
    echo ""
    echo "Examples:"
    echo "  $0 -l python *.py"
    echo "  $0 -l javascript -r src/"
    echo "  $0 -l json -c *.json"
}

# Default values
LANGUAGE=""
FORMATTER=""
RECURSIVE=false
IN_PLACE=true
DIFF_MODE=false
CHECK_MODE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -l|--language)
            LANGUAGE="$2"
            shift 2
            ;;
        -f|--formatter)
            FORMATTER="$2"
            shift 2
            ;;
        -r|--recursive)
            RECURSIVE=true
            shift
            ;;
        -i|--in-place)
            IN_PLACE=true
            shift
            ;;
        -d|--diff)
            DIFF_MODE=true
            IN_PLACE=false
            shift
            ;;
        -c|--check)
            CHECK_MODE=true
            IN_PLACE=false
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            echo "Unknown option: $1" >&2
            show_help
            exit 1
            ;;
        *)
            break
            ;;
    esac
done

# Get files to process
if [[ $# -eq 0 ]]; then
    echo "Error: No files or directories specified" >&2
    show_help
    exit 1
fi

# Function to detect language from file extension
detect_language() {
    local file="$1"
    local extension="${file##*.}"

    case "$extension" in
        py) echo "python" ;;
        js|jsx) echo "javascript" ;;
        ts|tsx) echo "typescript" ;;
        json) echo "json" ;;
        xml) echo "xml" ;;
        html|htm) echo "html" ;;
        css|scss|sass) echo "css" ;;
        go) echo "go" ;;
        rs) echo "rust" ;;
        c|h) echo "c" ;;
        cpp|cxx|cc|hpp|hxx) echo "cpp" ;;
        java) echo "java" ;;
        php) echo "php" ;;
        rb) echo "ruby" ;;
        sh) echo "shell" ;;
        md) echo "markdown" ;;
        yaml|yml) echo "yaml" ;;
        *) echo "unknown" ;;
    esac
}

# Function to detect available formatter for language
detect_formatter() {
    local language="$1"

    case "$language" in
        python)
            if command -v black &> /dev/null; then echo "black"
            elif command -v autopep8 &> /dev/null; then echo "autopep8"
            elif command -v yapf &> /dev/null; then echo "yapf"
            else echo "none"
            fi
            ;;
        javascript|typescript)
            if command -v prettier &> /dev/null; then echo "prettier"
            elif command -v eslint &> /dev/null; then echo "eslint"
            else echo "none"
            fi
            ;;
        json)
            if command -v prettier &> /dev/null; then echo "prettier"
            elif command -v jq &> /dev/null; then echo "jq"
            else echo "none"
            fi
            ;;
        xml)
            if command -v xmllint &> /dev/null; then echo "xmllint"
            else echo "none"
            fi
            ;;
        html)
            if command -v prettier &> /dev/null; then echo "prettier"
            elif command -v tidy &> /dev/null; then echo "tidy"
            else echo "none"
            fi
            ;;
        css)
            if command -v prettier &> /dev/null; then echo "prettier"
            elif command -v stylelint &> /dev/null; then echo "stylelint"
            else echo "none"
            fi
            ;;
        go)
            if command -v gofmt &> /dev/null; then echo "gofmt"
            elif command -v goimports &> /dev/null; then echo "goimports"
            else echo "none"
            fi
            ;;
        rust)
            if command -v rustfmt &> /dev/null; then echo "rustfmt"
            else echo "none"
            fi
            ;;
        c|cpp)
            if command -v clang-format &> /dev/null; then echo "clang-format"
            elif command -v astyle &> /dev/null; then echo "astyle"
            else echo "none"
            fi
            ;;
        java)
            if command -v google-java-format &> /dev/null; then echo "google-java-format"
            else echo "none"
            fi
            ;;
        php)
            if command -v php-cs-fixer &> /dev/null; then echo "php-cs-fixer"
            else echo "none"
            fi
            ;;
        shell)
            if command -v shfmt &> /dev/null; then echo "shfmt"
            else echo "none"
            fi
            ;;
        *) echo "none" ;;
    esac
}

# Function to format Python files
format_python() {
    local file="$1"
    local formatter="$2"

    case "$formatter" in
        black)
            if [[ "$CHECK_MODE" == "true" ]]; then
                black --check --diff "$file"
            elif [[ "$DIFF_MODE" == "true" ]]; then
                black --diff "$file"
            else
                black "$file"
            fi
            ;;
        autopep8)
            if [[ "$DIFF_MODE" == "true" ]]; then
                autopep8 -d "$file"
            else
                autopep8 -i "$file"
            fi
            ;;
        yapf)
            if [[ "$DIFF_MODE" == "true" ]]; then
                yapf --diff "$file"
            else
                yapf -i "$file"
            fi
            ;;
    esac
}

# Function to format JavaScript/TypeScript files
format_javascript() {
    local file="$1"
    local formatter="$2"

    case "$formatter" in
        prettier)
            if [[ "$CHECK_MODE" == "true" ]]; then
                prettier --check "$file"
            elif [[ "$DIFF_MODE" == "true" ]]; then
                prettier --write --loglevel silent "$file" && git diff "$file"
            else
                prettier --write "$file"
            fi
            ;;
        eslint)
            if [[ "$CHECK_MODE" == "true" ]]; then
                eslint "$file"
            else
                eslint --fix "$file"
            fi
            ;;
    esac
}

# Function to format JSON files
format_json() {
    local file="$1"
    local formatter="$2"

    case "$formatter" in
        prettier)
            if [[ "$CHECK_MODE" == "true" ]]; then
                prettier --check "$file"
            elif [[ "$DIFF_MODE" == "true" ]]; then
                prettier --write --loglevel silent "$file" && git diff "$file"
            else
                prettier --write "$file"
            fi
            ;;
        jq)
            if [[ "$DIFF_MODE" == "true" ]]; then
                echo "Original:"
                cat "$file"
                echo "Formatted:"
                jq . "$file"
            else
                jq . "$file" > "$file.tmp" && mv "$file.tmp" "$file"
            fi
            ;;
    esac
}

# Function to format XML files
format_xml() {
    local file="$1"

    if [[ "$CHECK_MODE" == "true" ]]; then
        xmllint --noout "$file" 2>&1 | head -5
    elif [[ "$DIFF_MODE" == "true" ]]; then
        xmllint --format "$file"
    else
        xmllint --format "$file" -o "$file"
    fi
}

# Function to format HTML files
format_html() {
    local file="$1"
    local formatter="$2"

    case "$formatter" in
        prettier)
            if [[ "$CHECK_MODE" == "true" ]]; then
                prettier --check "$file"
            elif [[ "$DIFF_MODE" == "true" ]]; then
                prettier --write --loglevel silent "$file" && git diff "$file"
            else
                prettier --write "$file"
            fi
            ;;
        tidy)
            if [[ "$DIFF_MODE" == "true" ]]; then
                tidy -xml -i "$file" 2>/dev/null || echo "Could not format $file"
            else
                tidy -xml -m -i "$file" 2>/dev/null || echo "Could not format $file"
            fi
            ;;
    esac
}

# Function to format Go files
format_go() {
    local file="$1"
    local formatter="$2"

    case "$formatter" in
        gofmt)
            if [[ "$CHECK_MODE" == "true" ]]; then
                gofmt -d "$file"
            elif [[ "$DIFF_MODE" == "true" ]]; then
                gofmt -d "$file"
            else
                gofmt -w "$file"
            fi
            ;;
        goimports)
            if [[ "$CHECK_MODE" == "true" ]]; then
                goimports -d "$file"
            elif [[ "$DIFF_MODE" == "true" ]]; then
                goimports -d "$file"
            else
                goimports -w "$file"
            fi
            ;;
    esac
}

# Function to format Rust files
format_rust() {
    local file="$1"

    if [[ "$CHECK_MODE" == "true" ]]; then
        rustfmt --check "$file"
    elif [[ "$DIFF_MODE" == "true" ]]; then
        rustfmt --emit stdout "$file"
    else
        rustfmt "$file"
    fi
}

# Function to format C/C++ files
format_cpp() {
    local file="$1"
    local formatter="$2"

    case "$formatter" in
        clang-format)
            if [[ "$CHECK_MODE" == "true" ]]; then
                clang-format --dry-run --Werror "$file"
            elif [[ "$DIFF_MODE" == "true" ]]; then
                clang-format "$file"
            else
                clang-format -i "$file"
            fi
            ;;
        astyle)
            if [[ "$DIFF_MODE" == "true" ]]; then
                astyle --formatted "$file" || echo "Could not format $file"
            else
                astyle "$file"
            fi
            ;;
    esac
}

# Function to process a single file
process_file() {
    local file="$1"

    if [[ ! -f "$file" ]]; then
        return
    fi

    # Detect language if not specified
    local file_language="$LANGUAGE"
    if [[ -z "$file_language" ]]; then
        file_language=$(detect_language "$file")
    fi

    # Detect formatter if not specified
    local file_formatter="$FORMATTER"
    if [[ -z "$file_formatter" ]]; then
        file_formatter=$(detect_formatter "$file_language")
    fi

    if [[ "$file_formatter" == "none" ]]; then
        if [[ "$VERBOSE" == "true" ]]; then
            echo "No formatter available for $file_language files: $file"
        fi
        return
    fi

    if [[ "$VERBOSE" == "true" ]]; then
        echo "Formatting $file ($file_language with $file_formatter)"
    fi

    # Format based on language and formatter
    case "$file_language" in
        python)
            format_python "$file" "$file_formatter"
            ;;
        javascript|typescript)
            format_javascript "$file" "$file_formatter"
            ;;
        json)
            format_json "$file" "$file_formatter"
            ;;
        xml)
            format_xml "$file"
            ;;
        html)
            format_html "$file" "$file_formatter"
            ;;
        go)
            format_go "$file" "$file_formatter"
            ;;
        rust)
            format_rust "$file"
            ;;
        c|cpp)
            format_cpp "$file" "$file_formatter"
            ;;
        *)
            if [[ "$VERBOSE" == "true" ]]; then
                echo "Unsupported language: $file_language for file: $file"
            fi
            ;;
    esac
}

# Function to collect files to process
collect_files() {
    local files=()

    for target in "$@"; do
        if [[ -f "$target" ]]; then
            files+=("$target")
        elif [[ -d "$target" ]]; then
            if [[ "$RECURSIVE" == "true" ]]; then
                while IFS= read -r -d '' file; do
                    files+=("$file")
                done < <(find "$target" -type f -print0)
            else
                echo "Directory specified but recursive mode not enabled: $target" >&2
            fi
        else
            echo "File or directory not found: $target" >&2
        fi
    done

    echo "${files[@]}"
}

# Main execution
echo "=== Code Formatter ==="
echo "Started at: $(date)"
echo ""

# Collect files to process
read -ra FILES_TO_PROCESS <<< "$(collect_files "$@")"

if [[ ${#FILES_TO_PROCESS[@]} -eq 0 ]]; then
    echo "No files to process"
    exit 0
fi

# Process each file
local processed_count=0
for file in "${FILES_TO_PROCESS[@]}"; do
    process_file "$file"
    ((processed_count++))
done

echo ""
echo "Formatted $processed_count files"
echo "Completed at: $(date)"