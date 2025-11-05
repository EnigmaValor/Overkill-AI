#!/bin/bash
# File Organizer Utility for Linux
# Organizes files into categorized directories based on type

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo "Usage: $0 [OPTIONS] [DIRECTORY]"
    echo ""
    echo "File organizer utility for Linux"
    echo ""
    echo "Options:"
    echo "  -d, --directory DIR     Directory to organize (default: current)"
    echo "  -p, --pattern FILE      Use custom pattern file"
    echo "  -c, --create-pattern    Create new pattern file interactively"
    echo "  -l, --list-patterns     List available patterns"
    echo "  -r, --dry-run           Show what would be organized without doing it"
    echo "  -v, --verbose           Verbose output"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 /home/user/Downloads"
    echo "  $0 -p custom_patterns.txt ."
    echo "  $0 -c  # Create new pattern file"
}

# Default organization patterns
PATTERNS_FILE="$HOME/.file_organizer_patterns.txt"
SEARCH_DIR="."
DRY_RUN=false
VERBOSE=false
LIST_PATTERNS=false
CREATE_PATTERN=false

# Default patterns
DEFAULT_PATTERNS=(
    "Documents:*.pdf,*.doc,*.docx,*.txt,*.rtf,*.odt"
    "Images:*.jpg,*.jpeg,*.png,*.gif,*.bmp,*.svg,*.webp"
    "Videos:*.mp4,*.avi,*.mkv,*.mov,*.wmv,*.flv,*.webm"
    "Audio:*.mp3,*.wav,*.flac,*.aac,*.ogg,*.wma"
    "Archives:*.zip,*.rar,*.7z,*.tar,*.gz,*.bz2"
    "Programs:*.exe,*.msi,*.deb,*.rpm,*.appimage,*.sh"
    "Scripts:*.py,*.js,*.php,*.rb,*.pl,*.sh"
    "Web:*.html,*.css,*.js,*.xml,*.json"
)

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--directory)
            SEARCH_DIR="$2"
            shift 2
            ;;
        -p|--pattern)
            PATTERNS_FILE="$2"
            shift 2
            ;;
        -c|--create-pattern)
            CREATE_PATTERN=true
            shift
            ;;
        -l|--list-patterns)
            LIST_PATTERNS=true
            shift
            ;;
        -r|--dry-run)
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
            SEARCH_DIR="$1"
            break
            ;;
    esac
done

# Function to load patterns from file
load_patterns() {
    if [[ -f "$PATTERNS_FILE" ]]; then
        if [[ "$VERBOSE" == "true" ]]; then
            echo "Loading patterns from: $PATTERNS_FILE"
        fi
        return 0
    elif [[ "$PATTERNS_FILE" == "$HOME/.file_organizer_patterns.txt" ]]; then
        # Create default patterns file
        save_patterns
        return 0
    else
        echo "Pattern file not found: $PATTERNS_FILE"
        echo "Use -c to create a new pattern file or use default patterns"
        return 1
    fi
}

# Function to save patterns to file
save_patterns() {
    echo "# File Organizer Patterns" > "$PATTERNS_FILE"
    echo "# Format: Category:extensions" >> "$PATTERNS_FILE"
    echo "" >> "$PATTERNS_FILE"

    for pattern in "${DEFAULT_PATTERNS[@]}"; do
        echo "$pattern" >> "$PATTERNS_FILE"
    done

    if [[ "$VERBOSE" == "true" ]]; then
        echo "Patterns saved to: $PATTERNS_FILE"
    fi
}

# Function to list available patterns
list_patterns() {
    echo "Available organization patterns:"
    echo ""

    if [[ -f "$PATTERNS_FILE" ]]; then
        while IFS=':' read -r category extensions; do
            echo "$GREEN$category$NC: $extensions"
        done < "$PATTERNS_FILE"
    else
        for pattern in "${DEFAULT_PATTERNS[@]}"; do
            IFS=':' read -r category extensions <<< "$pattern"
            echo "$GREEN$category$NC: $extensions"
        done
    fi
    echo ""
}

# Function to create custom patterns interactively
create_custom_patterns() {
    echo "Creating custom organization patterns..."
    echo "Enter patterns in format: Category:*.ext1,*.ext2,*.ext3"
    echo "Enter empty line when finished"
    echo ""

    local patterns=()
    while true; do
        read -p "Pattern: " pattern
        if [[ -z "$pattern" ]]; then
            break
        fi
        patterns+=("$pattern")
    done

    if [[ ${#patterns[@]} -gt 0 ]]; then
        echo "# Custom File Organizer Patterns" > "$PATTERNS_FILE"
        echo "# Created: $(date)" >> "$PATTERNS_FILE"
        echo "" >> "$PATTERNS_FILE"

        for pattern in "${patterns[@]}"; do
            echo "$pattern" >> "$PATTERNS_FILE"
        done

        echo "Custom patterns saved to: $PATTERNS_FILE"
    fi
}

# Function to organize files
organize_files() {
    local organized_count=0
    local skipped_count=0

    # Create category directories
    while IFS=':' read -r category extensions; do
        # Skip comments and empty lines
        [[ "$category" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$category" ]] && continue

        local category_dir="$SEARCH_DIR/$category"

        if [[ "$DRY_RUN" == "false" ]]; then
            mkdir -p "$category_dir"
        fi

        if [[ "$VERBOSE" == "true" ]]; then
            echo "Created directory: $category_dir"
        fi

        # Parse extensions
        IFS=',' read -ra exts <<< "$extensions"
        for ext in "${exts[@]}"; do
            ext=$(echo "$ext" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')  # Trim whitespace

            if [[ -z "$ext" ]]; then
                continue
            fi

            # Find files with this extension
            while IFS= read -r -d '' file; do
                if [[ -f "$file" ]]; then
                    local filename
                    filename=$(basename "$file")

                    if [[ "$DRY_RUN" == "true" ]]; then
                        echo "Would move: $file -> $category_dir/"
                    else
                        if [[ "$VERBOSE" == "true" ]]; then
                            echo "Moving: $file -> $category_dir/"
                        fi
                        mv "$file" "$category_dir/"
                    fi

                    ((organized_count++))
                fi
            done < <(find "$SEARCH_DIR" -maxdepth 1 -type f -name "$ext" -print0)
        done
    done < "$PATTERNS_FILE"

    echo "Organized $organized_count files"
}

# Main execution
if [[ "$LIST_PATTERNS" == "true" ]]; then
    list_patterns
    exit 0
fi

if [[ "$CREATE_PATTERN" == "true" ]]; then
    create_custom_patterns
    exit 0
fi

# Load patterns
if ! load_patterns; then
    if [[ "$PATTERNS_FILE" != "$HOME/.file_organizer_patterns.txt" ]]; then
        exit 1
    fi
fi

# Organize files
echo "=== File Organizer ==="
echo "Directory: $SEARCH_DIR"
echo "Patterns file: $PATTERNS_FILE"
echo "Started at: $(date)"
echo ""

organize_files

echo ""
echo "File organization completed at: $(date)"