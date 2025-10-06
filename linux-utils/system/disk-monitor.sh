#!/bin/bash
# Disk Monitor Utility for Linux
# Displays disk usage information and monitors disk space

echo "=== Disk Monitor ==="
echo "Press Ctrl+C to exit"
echo ""

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to display disk usage for all mounted filesystems
show_disk_usage() {
    echo "Disk Usage Summary:"
    df -h | awk 'NR==1{print $1, $2, $3, $4, $5, $6} NR>1{print $1, $2, $3, $4, $5, $6}'
    echo ""
}

# Function to display detailed disk usage for directories
show_directory_usage() {
    echo "Largest directories in / (top 10):"
    du -sh /* 2>/dev/null | sort -hr | head -10 | awk '{print $1, $2}'
    echo ""
}

# Function to check for low disk space warnings
check_disk_warnings() {
    echo "Disk Space Warnings:"
    df -h | awk 'NR>1{
        usage = $5 + 0  # Convert percentage to number
        if(usage > 90) {
            print "'$RED'" $6 ": CRITICAL - " usage "% used" '$NC'"
        } else if(usage > 75) {
            print "'$YELLOW'" $6 ": WARNING - " usage "% used" '$NC'"
        } else {
            print "'$GREEN'" $6 ": OK - " usage "% used" '$NC'"
        }
    }'
    echo ""
}

# Function to show inode usage
show_inode_usage() {
    echo "Inode Usage:"
    df -i | awk 'NR==1{print $1, $2, $3, $4, $5, $6} NR>1{print $1, $2, $3, $4, $5, $6}'
    echo ""
}

# Function to display I/O statistics
show_io_stats() {
    echo "Disk I/O Statistics:"
    if command -v iostat &> /dev/null; then
        iostat -x 1 1 | tail -5
    else
        echo "iostat not available. Install sysstat package for I/O statistics."
    fi
    echo ""
}

# Function to show mounted filesystems
show_mount_points() {
    echo "Mounted Filesystems:"
    mount | grep -E "^/dev" | awk '{print $1, "mounted on", $3, "as", $5}'
    echo ""
}

# Display initial information
show_disk_usage
show_directory_usage
check_disk_warnings
show_inode_usage

# Main monitoring loop
while true; do
    echo "=== Real-time Disk Monitoring ==="
    echo "$(date)"
    show_disk_usage
    check_disk_warnings
    show_io_stats
    echo "----------------------------------------"
    sleep 5
    clear
done