#!/bin/bash
# Network Monitor Utility for Linux
# Monitors network connections, bandwidth, and activity

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Network monitor utility for Linux"
    echo ""
    echo "Options:"
    echo "  -i, --interface IFACE   Network interface to monitor (default: auto-detect)"
    echo "  -r, --refresh SEC       Refresh interval in seconds (default: 2)"
    echo "  -c, --connections       Show active connections"
    echo "  -b, --bandwidth         Show bandwidth usage"
    echo "  -a, --all               Show all information"
    echo "  -v, --verbose           Verbose output"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -a                    # Monitor all network activity"
    echo "  $0 -i eth0 -r 1         # Monitor eth0 every 1 second"
    echo "  $0 -c                   # Show active connections only"
}

# Default values
INTERFACE=""
REFRESH_INTERVAL=2
SHOW_CONNECTIONS=false
SHOW_BANDWIDTH=false
SHOW_ALL=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--interface)
            INTERFACE="$2"
            shift 2
            ;;
        -r|--refresh)
            REFRESH_INTERVAL="$2"
            shift 2
            ;;
        -c|--connections)
            SHOW_CONNECTIONS=true
            shift
            ;;
        -b|--bandwidth)
            SHOW_BANDWIDTH=true
            shift
            ;;
        -a|--all)
            SHOW_ALL=true
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
    esac
done

# Auto-detect primary interface if not specified
if [[ -z "$INTERFACE" ]]; then
    INTERFACE=$(ip route get 8.8.8.8 2>/dev/null | awk 'NR==1 {print $5}' | head -1)

    if [[ -z "$INTERFACE" ]]; then
        INTERFACE=$(ip link show | grep 'state UP' | head -1 | awk -F': ' '{print $2}')
    fi

    if [[ -z "$INTERFACE" ]]; then
        echo "Could not detect network interface. Please specify manually with -i"
        exit 1
    fi
fi

# Check if interface exists
if ! ip link show "$INTERFACE" &> /dev/null; then
    echo "Interface $INTERFACE does not exist"
    exit 1
fi

# Initialize bandwidth tracking
RX_PREV=0
TX_PREV=0

# Function to get interface statistics
get_interface_stats() {
    local stats
    stats=$(cat /proc/net/dev | grep "$INTERFACE:")

    if [[ -n "$stats" ]]; then
        local rx_bytes=$(echo "$stats" | awk -F': ' '{print $2}' | awk '{print $1}')
        local tx_bytes=$(echo "$stats" | awk -F': ' '{print $2}' | awk '{print $9}')

        echo "$rx_bytes $tx_bytes"
    else
        echo "0 0"
    fi
}

# Function to format bytes
format_bytes() {
    local bytes="$1"
    local units=("B" "KB" "MB" "GB" "TB")

    local i=0
    while [[ $bytes -gt 1024 && $i -lt 4 ]]; do
        bytes=$((bytes / 1024))
        ((i++))
    done

    echo "${bytes}${units[$i]}"
}

# Function to calculate bandwidth
calculate_bandwidth() {
    local rx_current="$1"
    local tx_current="$2"

    if [[ $RX_PREV -gt 0 ]]; then
        local rx_diff=$((rx_current - RX_PREV))
        local tx_diff=$((tx_current - TX_PREV))

        local rx_rate=$(format_bytes $((rx_diff / REFRESH_INTERVAL)))
        local tx_rate=$(format_bytes $((tx_diff / REFRESH_INTERVAL)))

        echo "↓ $rx_rate/s ↑ $tx_rate/s"
    else
        echo "↓ -- ↑ --"
    fi

    RX_PREV="$rx_current"
    TX_PREV="$tx_current"
}

# Function to show interface information
show_interface_info() {
    echo "=== Network Interface Information ==="
    echo "Interface: $INTERFACE"

    # IP addresses
    local ipv4=$(ip -4 addr show "$INTERFACE" 2>/dev/null | grep 'inet ' | awk '{print $2}' | head -1)
    local ipv6=$(ip -6 addr show "$INTERFACE" 2>/dev/null | grep 'inet6 ' | awk '{print $2}' | head -1)

    if [[ -n "$ipv4" ]]; then
        echo "IPv4: $ipv4"
    fi
    if [[ -n "$ipv6" ]]; then
        echo "IPv6: $ipv6"
    fi

    # MAC address
    local mac=$(ip link show "$INTERFACE" | grep 'link/' | awk '{print $2}')
    if [[ -n "$mac" ]]; then
        echo "MAC: $mac"
    fi

    # Link status
    local status=$(ip link show "$INTERFACE" | grep -o 'state [A-Z]*' | awk '{print $2}')
    echo "Status: ${status:-Unknown}"
    echo ""
}

# Function to show bandwidth usage
show_bandwidth() {
    local stats
    read -r rx_bytes tx_bytes < <(get_interface_stats)

    echo "=== Bandwidth Usage ==="
    echo "Total Received: $(format_bytes $rx_bytes)"
    echo "Total Transmitted: $(format_bytes $tx_bytes)"

    local bandwidth
    bandwidth=$(calculate_bandwidth "$rx_bytes" "$tx_bytes")
    echo "Current Rate: $bandwidth"
    echo ""
}

# Function to show active connections
show_connections() {
    echo "=== Active Network Connections ==="

    # Show listening ports
    echo "Listening ports:"
    ss -tuln | grep LISTEN | head -10 | awk '{print "  " $1 " " $5}' || echo "  No listening ports found"
    echo ""

    # Show established connections
    echo "Established connections:"
    ss -tun | grep ESTAB | head -10 | awk '{print "  " $1 " " $5 " -> " $6}' || echo "  No established connections found"
    echo ""

    # Show connection count by state
    echo "Connection states:"
    ss -s | grep -E '^[[:space:]]*[0-9]+' | sed 's/^/  /'
    echo ""
}

# Function to show routing table
show_routing() {
    echo "=== Routing Table ==="
    ip route show | head -5 | sed 's/^/  /'
    echo ""
}

# Function to show DNS information
show_dns() {
    echo "=== DNS Information ==="
    echo "Nameservers:"
    cat /etc/resolv.conf 2>/dev/null | grep nameserver | sed 's/^/  /' || echo "  No nameservers found"
    echo ""
}

# Function to monitor continuously
monitor_continuous() {
    echo "=== Network Monitor ==="
    echo "Interface: $INTERFACE"
    echo "Refresh interval: $REFRESH_INTERVAL seconds"
    echo "Press Ctrl+C to exit"
    echo ""

    while true; do
        echo "$(date '+%Y-%m-%d %H:%M:%S')"
        echo "----------------------------------------"

        if [[ "$SHOW_ALL" == "true" || "$SHOW_BANDWIDTH" == "true" ]]; then
            show_bandwidth
        fi

        if [[ "$SHOW_ALL" == "true" || "$SHOW_CONNECTIONS" == "true" ]]; then
            show_connections
        fi

        if [[ "$SHOW_ALL" == "true" ]]; then
            show_routing
            show_dns
        fi

        sleep "$REFRESH_INTERVAL"
        clear
    done
}

# Function to run single snapshot
run_snapshot() {
    echo "=== Network Monitor Snapshot ==="
    echo "$(date)"
    echo ""

    show_interface_info

    if [[ "$SHOW_ALL" == "true" || "$SHOW_BANDWIDTH" == "true" ]]; then
        show_bandwidth
    fi

    if [[ "$SHOW_ALL" == "true" || "$SHOW_CONNECTIONS" == "true" ]]; then
        show_connections
    fi

    if [[ "$SHOW_ALL" == "true" ]]; then
        show_routing
        show_dns
    fi
}

# Main execution
if [[ "$REFRESH_INTERVAL" -gt 0 ]]; then
    monitor_continuous
else
    run_snapshot
fi