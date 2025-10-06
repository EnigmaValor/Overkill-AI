#!/bin/bash
# Port Scanner Utility for Linux
# Scans for open ports on local or remote hosts

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo "Usage: $0 [OPTIONS] [HOST]"
    echo ""
    echo "Port scanner utility for Linux"
    echo ""
    echo "Options:"
    echo "  -h, --host HOST         Host to scan (default: localhost)"
    echo "  -p, --ports RANGE       Port range (e.g., 1-1000, 80,443,22-25)"
    echo "  -t, --timeout SEC       Timeout in seconds (default: 1)"
    echo "  -c, --concurrent NUM    Concurrent connections (default: 100)"
    echo "  -s, --service           Show service names"
    echo "  -v, --verbose           Verbose output"
    echo "  -q, --quiet             Only show open ports"
    echo "  --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -p 1-1000 localhost"
    echo "  $0 -p 80,443,22-25 -s example.com"
    echo "  $0 -t 2 -c 50 -v 192.168.1.1"
}

# Default values
HOST="localhost"
PORTS="1-1024"
TIMEOUT=1
CONCURRENT=100
SHOW_SERVICE=false
VERBOSE=false
QUIET=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            HOST="$2"
            shift 2
            ;;
        -p|--ports)
            PORTS="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -c|--concurrent)
            CONCURRENT="$2"
            shift 2
            ;;
        -s|--service)
            SHOW_SERVICE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -q|--quiet)
            QUIET=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        -*)
            echo "Unknown option: $1" >&2
            show_help
            exit 1
            ;;
        *)
            HOST="$1"
            break
            ;;
    esac
done

# Function to resolve hostname to IP
resolve_host() {
    local host="$1"
    if ping -c 1 -W 1 "$host" &> /dev/null; then
        echo "$host"
    else
        echo "Unable to resolve host: $host"
        exit 1
    fi
}

# Function to expand port range
expand_ports() {
    local ports="$1"
    local expanded=""

    # Handle comma-separated ports and ranges
    IFS=',' read -ra port_specs <<< "$ports"
    for spec in "${port_specs[@]}"; do
        if [[ "$spec" =~ ^([0-9]+)-([0-9]+)$ ]]; then
            # Port range
            local start="${BASH_REMATCH[1]}"
            local end="${BASH_REMATCH[2]}"
            for ((port=start; port<=end; port++)); do
                expanded="$expanded $port"
            done
        else
            # Single port
            expanded="$expanded $spec"
        fi
    done

    echo "$expanded"
}

# Function to get service name for port
get_service_name() {
    local port="$1"
    local protocol="$2"

    if command -v getent &> /dev/null; then
        getent services "$port"/"$protocol" 2>/dev/null | awk '{print $1}' | head -1
    else
        echo "unknown"
    fi
}

# Function to scan a single port
scan_port() {
    local host="$1"
    local port="$2"

    if timeout "$TIMEOUT" bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null; then
        local service=""
        if [[ "$SHOW_SERVICE" == "true" ]]; then
            service=" ($(get_service_name $port tcp))"
        fi

        if [[ "$QUIET" == "false" ]]; then
            echo -e "$GREEN[+]$NC Port $port is open$service"
        else
            echo "$port"
        fi
    else
        if [[ "$VERBOSE" == "true" ]]; then
            echo -e "$RED[-]$NC Port $port is closed or filtered"
        fi
    fi
}

# Function to scan multiple ports concurrently
scan_ports_concurrent() {
    local host="$1"
    local ports="$2"

    echo "Scanning $host for open ports..."
    echo "Ports: $ports"
    echo "Timeout: $TIMEOUT seconds"
    echo ""

    # Create temporary files for communication
    local temp_dir=$(mktemp -d)
    local port_list="$temp_dir/ports"
    local results="$temp_dir/results"

    # Write ports to file
    echo "$ports" | tr ' ' '\n' > "$port_list"

    # Start concurrent scanners
    local running=0
    while IFS= read -r port; do
        # Wait if too many processes are running
        while [[ $running -ge $CONCURRENT ]]; do
            wait -n 2>/dev/null
            running=$((running - 1))
        done

        # Scan port in background
        scan_port "$host" "$port" >> "$results" &
        running=$((running + 1))

    done < "$port_list"

    # Wait for all background processes to finish
    wait

    # Display results
    if [[ -s "$results" ]]; then
        echo ""
        echo "Open ports found:"
        echo "$(cat "$results")"
        echo ""
        echo "Scan completed: $(cat "$results" | wc -l) ports open"
    else
        echo ""
        echo "No open ports found in the specified range"
    fi

    # Cleanup
    rm -rf "$temp_dir"
}

# Function to scan common ports
scan_common_ports() {
    local host="$1"
    local common_ports="21,22,23,25,53,80,110,143,443,993,995,3389"

    echo "Scanning common ports on $host..."
    echo ""

    for port in $(echo "$common_ports" | tr ',' ' '); do
        scan_port "$host" "$port"
    done

    echo ""
    echo "Common ports scan completed"
}

# Main execution
echo "=== Port Scanner ==="
echo "Target: $(resolve_host "$HOST")"
echo "Started at: $(date)"
echo ""

# Check if specific ports are requested or use common ports
if [[ "$PORTS" == "1-1024" ]]; then
    scan_common_ports "$HOST"
else
    expanded_ports=$(expand_ports "$PORTS")
    scan_ports_concurrent "$HOST" "$expanded_ports"
fi

echo ""
echo "Port scan completed at: $(date)"