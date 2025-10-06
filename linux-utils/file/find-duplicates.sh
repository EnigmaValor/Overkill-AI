#!/bin/bash
# Find Duplicate Files Utility for Linux
# Finds duplicate files based on size, name, or content

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo "Usage: $0 [OPTIONS] [DIRECTORY]"
    echo ""
    echo "Find duplicate files utility for Linux"
    echo ""
    echo "Options:"
    echo "  -t, --type TYPE         Check type: size, name, content (default: size)"
    echo "  -d, --directory DIR     Directory to search (default: current)"
    echo "  -o, --output FILE       Output results to file"
    echo "  -m, --move DIR          Move duplicates to directory"
    echo "  -r, --remove            Remove duplicates (interactive)"
    echo "  -q, --quiet             Quiet mode"
    echo "  -v, --verbose           Verbose output"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -t content /home/user/Documents"
    echo "  $0 -t name -o duplicates.txt ."
    echo "  $0 -t size -r ."
}

# Parse command line arguments
CHECK_TYPE="size"
SEARCH_DIR="."
OUTPUT_FILE=""
MOVE_DIR=""
REMOVE_DUPS=false
QUIET=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            CHECK_TYPE="$2"
            shift 2
            ;;
        -d|--directory)
            SEARCH_DIR="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -m|--move)
            MOVE_DIR="$2"
            shift 2
            ;;
        -r|--remove)
            REMOVE_DUPS=true
            shift
            ;;
        -q|--quiet)
            QUIET=true
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
            SEARCH_DIR="$1"
            break
            ;;
    esac
done

# Validate check type
if [[ ! "$CHECK_TYPE" =~ ^(size|name|content)$ ]]; then
    echo "Error: Invalid check type. Must be size, name, or content" >&2
    exit 1
fi

# Create output file if specified
if [[ -n "$OUTPUT_FILE" ]]; then
    exec > "$OUTPUT_FILE"
fi

echo "=== Duplicate Files Finder ==="
echo "Check type: $CHECK_TYPE"
echo "Search directory: $SEARCH_DIR"
echo "Started at: $(date)"
echo ""

# Function to find duplicates by size
find_size_duplicates() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo "Finding files with duplicate sizes..."
    fi

    find "$SEARCH_DIR" -type f -exec ls -la {} \; | awk '{print $5, $9}' | sort -n | uniq -d -f 0 | while read size path; do
        echo "Files with size $size bytes:"
        find "$SEARCH_DIR" -type f -size "${size}c" -exec ls -1 {} \;
        echo "---"
    done
}

# Function to find duplicates by name
find_name_duplicates() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo "Finding files with duplicate names..."
    fi

    find "$SEARCH_DIR" -type f | rev | cut -d'/' -f1 | rev | sort | uniq -d | while read filename; do
        echo "Files named '$filename':"
        find "$SEARCH_DIR" -name "$filename" -type f
        echo "---"
    done
}

# Function to find duplicates by content (checksum)
find_content_duplicates() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo "Finding files with duplicate content (this may take a while)..."
    fi

    # Find all files and calculate checksums
    find "$SEARCH_DIR" -type f -exec md5sum {} \; 2>/dev/null | sort | uniq -w 32 -d | while read checksum path; do
        echo "Files with identical content (checksum: ${checksum:0:8}...):"
        md5sum "$path" | awk -v cs="$checksum" '$1 == cs {print $2}'
        echo "---"
    done
}

# Function to move duplicates
move_duplicates() {
    local files=("$@")
    local duplicate_dir="$MOVE_DIR/duplicates_$(date +%Y%m%d_%H%M%S)"

    if [[ ! -d "$duplicate_dir" ]]; then
        mkdir -p "$duplicate_dir"
    fi

    for file in "${files[@]:1}"; do  # Skip first file (keep it in place)
        if [[ "$VERBOSE" == "true" ]]; then
            echo "Moving duplicate: $file"
        fi
        mv "$file" "$duplicate_dir/"
    done
}

# Function to remove duplicates interactively
remove_duplicates() {
    local files=("$@")

    echo "Found ${#files[@]} duplicate files:"
    for i in "${!files[@]}"; do
        echo "[$i] ${files[$i]}"
    done

    echo ""
    echo "Keep first file, remove others? (y/N)"
    read -r response

    if [[ "$response" =~ ^[Yy]$ ]]; then
        for file in "${files[@]:1}"; do  # Skip first file
            if [[ "$VERBOSE" == "true" ]]; then
                echo "Removing duplicate: $file"
            fi
            rm "$file"
        done
        echo "Duplicates removed (kept: ${files[0]})"
    else
        echo "Operation cancelled"
    fi
}

# Main execution
case "$CHECK_TYPE" in
    "size")
        find_size_duplicates
        ;;
    "name")
        find_name_duplicates
        ;;
    "content")
        find_content_duplicates
        ;;
esac

echo ""
echo "Duplicate search completed at: $(date)"

# Handle move/remove operations if specified
if [[ -n "$MOVE_DIR" ]]; then
    echo "Moving duplicates to $MOVE_DIR..."
    # This would need more complex logic to collect duplicate groups
    echo "Move operation not yet implemented for grouped duplicates"
elif [[ "$REMOVE_DUPS" == "true" ]]; then
    echo "Interactive removal not yet implemented for grouped duplicates"
fi

echo "Done."