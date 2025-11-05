#!/bin/bash
# Batch Rename Utility for Linux
# Renames multiple files based on patterns or sequentially

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_help() {
    echo "Usage: $0 [OPTIONS] [FILES/DIRECTORY]"
    echo ""
    echo "Batch rename utility for Linux"
    echo ""
    echo "Options:"
    echo "  -p, --pattern PATTERN    Rename files matching pattern"
    echo "  -r, --replace OLD NEW    Replace OLD with NEW in filenames"
    echo "  -s, --sequential PREFIX  Rename files sequentially with PREFIX"
    echo "  -l, --lowercase          Convert filenames to lowercase"
    echo "  -u, --uppercase          Convert filenames to uppercase"
    echo "  -e, --extension OLD NEW  Change file extension from OLD to NEW"
    echo "  -d, --dry-run           Show what would be renamed without doing it"
    echo "  -v, --verbose           Verbose output"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -r '.jpg' '_backup.jpg' *.jpg"
    echo "  $0 -s 'img_' *.png"
    echo "  $0 -l *.TXT"
    echo "  $0 -e 'txt' 'md' *.txt"
}

# Parse command line arguments
PATTERN=""
REPLACE_OLD=""
REPLACE_NEW=""
SEQUENTIAL_PREFIX=""
LOWERCASE=false
UPPERCASE=false
EXTENSION_OLD=""
EXTENSION_NEW=""
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--pattern)
            PATTERN="$2"
            shift 2
            ;;
        -r|--replace)
            REPLACE_OLD="$2"
            REPLACE_NEW="$3"
            shift 3
            ;;
        -s|--sequential)
            SEQUENTIAL_PREFIX="$2"
            shift 2
            ;;
        -l|--lowercase)
            LOWERCASE=true
            shift
            ;;
        -u|--uppercase)
            UPPERCASE=true
            shift
            ;;
        -e|--extension)
            EXTENSION_OLD="$2"
            EXTENSION_NEW="$3"
            shift 3
            ;;
        -d|--dry-run)
            DRY_RUN=true
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
    echo "Error: No files or directory specified" >&2
    show_help
    exit 1
fi

FILES=("$@")

# Function to perform rename operation
perform_rename() {
    local old_name="$1"
    local new_name="$2"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "Would rename: '$old_name' -> '$new_name'"
    else
        if [[ "$VERBOSE" == "true" ]]; then
            echo "Renaming: '$old_name' -> '$new_name'"
        fi
        mv "$old_name" "$new_name"
    fi
}

# Process files
for file in "${FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        continue
    fi

    old_name="$file"
    new_name="$file"
    renamed=false

    # Pattern-based renaming
    if [[ -n "$PATTERN" ]]; then
        if [[ "$file" =~ $PATTERN ]]; then
            new_name="${file//$BASH_REMATCH/$REPLACE_NEW}"
            perform_rename "$old_name" "$new_name"
            renamed=true
        fi
    fi

    # String replacement
    if [[ -n "$REPLACE_OLD" && "$file" == *"$REPLACE_OLD"* ]]; then
        new_name="${file//$REPLACE_OLD/$REPLACE_NEW}"
        perform_rename "$old_name" "$new_name"
        renamed=true
    fi

    # Sequential renaming
    if [[ -n "$SEQUENTIAL_PREFIX" ]]; then
        extension="${file##*.}"
        new_name="${SEQUENTIAL_PREFIX}$((count+1)).${extension}"
        perform_rename "$old_name" "$new_name"
        ((count++))
        renamed=true
    fi

    # Case conversion
    if [[ "$LOWERCASE" == "true" ]]; then
        new_name=$(echo "$file" | tr '[:upper:]' '[:lower:]')
        if [[ "$new_name" != "$file" ]]; then
            perform_rename "$old_name" "$new_name"
            renamed=true
        fi
    fi

    if [[ "$UPPERCASE" == "true" ]]; then
        new_name=$(echo "$file" | tr '[:lower:]' '[:upper:]')
        if [[ "$new_name" != "$file" ]]; then
            perform_rename "$old_name" "$new_name"
            renamed=true
        fi
    fi

    # Extension change
    if [[ -n "$EXTENSION_OLD" && "$file" == *".$EXTENSION_OLD" ]]; then
        new_name="${file%.$EXTENSION_OLD}.$EXTENSION_NEW"
        perform_rename "$old_name" "$new_name"
        renamed=true
    fi

    if [[ "$renamed" == "false" && "$VERBOSE" == "true" ]]; then
        echo "No changes needed for: $file"
    fi
done

echo "Batch rename operation completed!"