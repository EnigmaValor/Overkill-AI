#!/bin/bash
# CPU Monitor Utility for Linux
# Displays real-time CPU usage information

echo "=== CPU Monitor ==="
echo "Press Ctrl+C to exit"
echo ""

# Function to display CPU information
show_cpu_info() {
    echo "CPU Information:"
    echo "Model: $(grep "model name" /proc/cpuinfo | head -1 | cut -d':' -f2 | sed 's/^ //')"
    echo "Cores: $(nproc)"
    echo "Architecture: $(uname -m)"
    echo ""
}

# Function to display CPU usage
show_cpu_usage() {
    echo "Current CPU Usage:"
    # Get CPU usage for each core
    mpstat -P ALL 1 1 | awk '/^[[:space:]]*[0-9]/ {printf "CPU %s: %.1f%% user, %.1f%% system, %.1f%% idle\n", $2, $3, $5, $12}'
    echo ""
    # Overall CPU usage
    echo "Overall CPU Usage:"
    top -bn1 | grep "Cpu(s)" | awk '{printf "User: %.1f%%, System: %.1f%%, Idle: %.1f%%\n", $2, $4, $8}'
    echo ""
}

# Function to display top processes
show_top_processes() {
    echo "Top 10 CPU-consuming processes:"
    ps aux --sort=-%cpu | head -11 | awk 'NR==1{print $1, $2, $3, $4, $11} NR>1{print $1, $2, $3, $4, $11}'
    echo ""
}

# Display initial information
show_cpu_info

# Main monitoring loop
while true; do
    show_cpu_usage
    show_top_processes
    echo "----------------------------------------"
    sleep 2
    clear
done