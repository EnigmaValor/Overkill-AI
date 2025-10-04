#!/bin/bash
# Git Helper Utility for Linux
# Provides useful git operations and shortcuts

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Git helper utility for Linux"
    echo ""
    echo "Commands:"
    echo "  status                  Show enhanced git status"
    echo "  log                     Show formatted git log"
    echo "  branch                  Show branch information"
    echo "  cleanup                 Clean up merged branches"
    echo "  stats                   Show repository statistics"
    echo "  backup                  Create repository backup"
    echo "  sync                    Sync with remote repository"
    echo "  review                  Review recent changes"
    echo "  authors                 Show commit authors"
    echo "  files                   Show most modified files"
    echo "  size                    Show repository size"
    echo ""
    echo "Options:"
    echo "  -d, --days NUM          Days for log/stats (default: 30)"
    echo "  -c, --count NUM         Number of items to show (default: 10)"
    echo "  -r, --remote REMOTE     Remote repository (default: origin)"
    echo "  -b, --branch BRANCH     Branch name"
    echo "  -v, --verbose           Verbose output"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 log -d 7"
    echo "  $0 cleanup -r upstream"
}

# Default values
COMMAND=""
DAYS=30
COUNT=10
REMOTE="origin"
BRANCH=""
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        status|log|branch|cleanup|stats|backup|sync|review|authors|files|size)
            COMMAND="$1"
            shift
            break
            ;;
        -d|--days)
            DAYS="$2"
            shift 2
            ;;
        -c|--count)
            COUNT="$2"
            shift 2
            ;;
        -r|--remote)
            REMOTE="$2"
            shift 2
            ;;
        -b|--branch)
            BRANCH="$2"
            shift 2
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
            echo "Unknown command: $1" >&2
            show_help
            exit 1
            ;;
    esac
done

# If no command specified, default to status
if [[ -z "$COMMAND" ]]; then
    COMMAND="status"
fi

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir &> /dev/null; then
        echo "Error: Not in a git repository" >&2
        exit 1
    fi
}

# Function to show enhanced status
show_status() {
    echo "=== Git Status ==="
    echo ""

    # Repository info
    echo "Repository: $(git config --get remote.origin.url 2>/dev/null || echo "Local repository")"
    echo "Branch: $(git branch --show-current)"
    echo "Remote: $(git remote get-url origin 2>/dev/null || echo "No remote")"
    echo ""

    # Status information
    if git diff --quiet && git diff --staged --quiet; then
        echo -e "$GREEN✓$NC Working directory clean"
    else
        echo -e "$YELLOW⚠$NC Working directory has changes"
    fi

    local ahead=$(git rev-list --count @{upstream}..HEAD 2>/dev/null || echo 0)
    local behind=$(git rev-list --count HEAD..@{upstream} 2>/dev/null || echo 0)

    if [[ $ahead -gt 0 ]]; then
        echo -e "$BLUE→$NC Ahead of remote by $ahead commits"
    fi
    if [[ $behind -gt 0 ]]; then
        echo -e "$BLUE←$NC Behind remote by $behind commits"
    fi

    echo ""

    # Recent commits
    echo "Recent commits:"
    git log --oneline -5
    echo ""
}

# Function to show formatted log
show_log() {
    echo "=== Git Log (Last $DAYS days) ==="
    echo ""

    git log --since="$DAYS days ago" --pretty=format:"%h %ad %an %s" --date=short | head -"$COUNT"
    echo ""
}

# Function to show branch information
show_branch() {
    echo "=== Branch Information ==="
    echo ""

    # Current branch
    echo "Current branch: $(git branch --show-current)"
    echo ""

    # All branches with last commit info
    echo "All branches:"
    git branch -a --format="%(refname:short) %(objectname:short) %(authordate:relative)" | head -"$COUNT"
    echo ""

    # Remote tracking
    echo "Remote tracking:"
    git branch -vv | grep -E "\[.*\]" | head -5
    echo ""
}

# Function to clean up merged branches
cleanup_branches() {
    echo "=== Cleaning up merged branches ==="
    echo ""

    # Find merged branches
    local merged_branches
    merged_branches=$(git branch --merged | grep -v "^\*" | grep -v "main\|master\|develop" | tr -d ' ')

    if [[ -z "$merged_branches" ]]; then
        echo "No merged branches to clean up"
        return
    fi

    echo "Merged branches to delete:"
    echo "$merged_branches"
    echo ""

    read -p "Delete these branches? (y/N) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$merged_branches" | xargs git branch -d
        echo "Branches deleted"
    else
        echo "Operation cancelled"
    fi
}

# Function to show repository statistics
show_stats() {
    echo "=== Repository Statistics ==="
    echo ""

    # General stats
    local commits=$(git rev-list --count HEAD)
    local branches=$(git branch | wc -l)
    local contributors=$(git shortlog -sn | wc -l)
    local files=$(git ls-files | wc -l)

    echo "Total commits: $commits"
    echo "Total branches: $branches"
    echo "Contributors: $contributors"
    echo "Files tracked: $files"
    echo ""

    # Commit activity
    echo "Commit activity (last $DAYS days):"
    git log --since="$DAYS days ago" --pretty=format:"%h %an %s" | awk '{print $2}' | sort | uniq -c | sort -nr | head -5
    echo ""

    # File types
    echo "File types:"
    git ls-files | sed 's/.*\.//' | sort | uniq -c | sort -nr | head -10
    echo ""
}

# Function to create repository backup
backup_repo() {
    local backup_name="backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    echo "=== Creating repository backup ==="
    echo ""

    echo "Creating backup: $backup_name"
    git archive --format=tar.gz -o "$backup_name" HEAD

    if [[ -f "$backup_name" ]]; then
        echo -e "$GREEN✓$NC Backup created successfully: $(du -h "$backup_name" | cut -f1)"
    else
        echo -e "$RED✗$NC Backup creation failed"
    fi
}

# Function to sync with remote
sync_remote() {
    echo "=== Syncing with remote ==="
    echo ""

    # Fetch latest changes
    echo "Fetching from $REMOTE..."
    git fetch "$REMOTE"

    # Show status
    local ahead=$(git rev-list --count @{upstream}..HEAD 2>/dev/null || echo 0)
    local behind=$(git rev-list --count HEAD..@{upstream} 2>/dev/null || echo 0)

    if [[ $behind -gt 0 ]]; then
        echo "Pulling $behind commits from $REMOTE..."
        git pull "$REMOTE" "$(git branch --show-current)"
    fi

    if [[ $ahead -gt 0 ]]; then
        echo "Pushing $ahead commits to $REMOTE..."
        git push "$REMOTE" "$(git branch --show-current)"
    fi

    echo -e "$GREEN✓$NC Sync completed"
}

# Function to review recent changes
review_changes() {
    echo "=== Review Recent Changes ==="
    echo ""

    # Show last few commits with diff stats
    git log --oneline -5
    echo ""

    # Show files changed in last commit
    echo "Files changed in last commit:"
    git diff --name-only HEAD~1..HEAD | head -10
    echo ""

    # Show diff stats
    echo "Diff statistics:"
    git diff --stat HEAD~1..HEAD
    echo ""
}

# Function to show commit authors
show_authors() {
    echo "=== Commit Authors ==="
    echo ""

    git shortlog -sn --since="$DAYS days ago" | head -"$COUNT"
    echo ""
}

# Function to show most modified files
show_files() {
    echo "=== Most Modified Files ==="
    echo ""

    git log --pretty=format: --name-only --since="$DAYS days ago" | sort | uniq -c | sort -nr | head -"$COUNT"
    echo ""
}

# Function to show repository size
show_size() {
    echo "=== Repository Size ==="
    echo ""

    # Repository size
    local repo_size=$(du -sh .git | cut -f1)
    echo "Git directory size: $repo_size"

    # Working directory size
    local work_size=$(du -sh --exclude=.git | cut -f1)
    echo "Working directory size: $work_size"

    # Largest files
    echo ""
    echo "Largest files:"
    find . -type f -not -path "./.git/*" -exec du -h {} + | sort -hr | head -5
    echo ""
}

# Main execution
check_git_repo

case "$COMMAND" in
    status)
        show_status
        ;;
    log)
        show_log
        ;;
    branch)
        show_branch
        ;;
    cleanup)
        cleanup_branches
        ;;
    stats)
        show_stats
        ;;
    backup)
        backup_repo
        ;;
    sync)
        sync_remote
        ;;
    review)
        review_changes
        ;;
    authors)
        show_authors
        ;;
    files)
        show_files
        ;;
    size)
        show_size
        ;;
    *)
        echo "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac