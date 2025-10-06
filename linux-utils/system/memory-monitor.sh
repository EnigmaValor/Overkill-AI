#!/bin/bash
# Memory Monitor Utility for Linux
# Displays real-time memory and swap usage information

echo "=== Memory Monitor ==="
echo "Press Ctrl+C to exit"
echo ""

# Function to display memory information
show_memory_info() {
    echo "Memory Information:"
    # Read memory info from /proc/meminfo
    local total_mem=$(grep MemTotal /proc/meminfo | awk '{print $2/1024/1024 " GB"}')
    local free_mem=$(grep MemFree /proc/meminfo | awk '{print $2/1024/1024 " GB"}')
    local available_mem=$(grep MemAvailable /proc/meminfo | awk '{print $2/1024/1024 " GB"}')
    local buffers=$(grep Buffers /proc/meminfo | awk '{print $2/1024/1024 " GB"}')
    local cached=$(grep Cached /proc/meminfo | awk '{print $2/1024/1024 " GB"}')

    echo "Total Memory: $total_mem"
    echo "Free Memory: $free_mem"
    echo "Available Memory: $available_mem"
    echo "Buffers: $buffers"
    echo "Cached: $cached"
    echo ""
}

# Function to display memory usage percentages
show_memory_usage() {
    # Use free command for percentage-based information
    echo "Memory Usage (Percentage):"
    free | awk 'NR==2{printf "Used: %s/%s (%.2f%%)\n", $3, $2, $3*100/$2 }'
    free | awk 'NR==3{printf "Swap: %s/%s (%.2f%%)\n", $3, $2, $3*100/$2 }'
    echo ""
}

# Function to display top memory-consuming processes
show_top_memory_processes() {
    echo "Top 10 Memory-consuming processes:"
    ps aux --sort=-%mem | head -11 | awk 'NR==1{print $1, $2, $4, $5, $11} NR>1{print $1, $2, $4, $5, $11}'
    echo ""
}

# Function to create memory usage visualization
show_memory_bar() {
    local used_percent=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    local free_percent=$((100 - used_percent))
    local bar_length=50

    echo "Memory Usage Visualization:"
    printf "Used:  ["
    for ((i=0; i<used_percent*bar_length/100; i++)); do printf "#"; done
    for ((i=0; i<free_percent*bar_length/100; i++)); do printf " "; done
    printf "] %d%%\n" $used_percent
    echo ""
}

# Display initial information
show_memory_info

# Main monitoring loop
while true; do
    show_memory_usage
    show_memory_bar
    show_top_memory_processes
    echo "----------------------------------------"
    sleep 2
    clear
done