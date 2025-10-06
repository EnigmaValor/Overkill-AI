#!/bin/bash
# Network Speed Test Utility for Linux
# Tests download and upload speeds, latency, and network quality

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Network speed test utility for Linux"
    echo ""
    echo "Options:"
    echo "  -s, --server SERVER     Speedtest server (auto-detected if not specified)"
    echo "  -d, --download          Test download speed only"
    echo "  -u, --upload            Test upload speed only"
    echo "  -l, --latency           Test latency only"
    echo "  -f, --full              Full test (download + upload + latency)"
    echo "  -t, --timeouts SEC      Timeout for each test (default: 30)"
    echo "  -v, --verbose           Verbose output"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -f"
    echo "  $0 -d -u"
    echo "  $0 -s speedtest.example.com"
}

# Default values
TEST_TYPE="full"
TIMEOUT=30
VERBOSE=false
SPEEDTEST_SERVER=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--server)
            SPEEDTEST_SERVER="$2"
            shift 2
            ;;
        -d|--download)
            TEST_TYPE="download"
            shift
            ;;
        -u|--upload)
            TEST_TYPE="upload"
            shift
            ;;
        -l|--latency)
            TEST_TYPE="latency"
            shift
            ;;
        -f|--full)
            TEST_TYPE="full"
            shift
            ;;
        -t|--timeouts)
            TIMEOUT="$2"
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
    esac
done

# Function to check if required tools are installed
check_dependencies() {
    local missing_tools=()

    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi

    if ! command -v bc &> /dev/null; then
        missing_tools+=("bc")
    fi

    if ! command -v ping &> /dev/null; then
        missing_tools+=("ping")
    fi

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        echo "Missing required tools: ${missing_tools[*]}"
        echo "Please install them first:"
        echo "  sudo apt-get install ${missing_tools[*]}  # Ubuntu/Debian"
        echo "  sudo yum install ${missing_tools[*]}     # CentOS/RHEL"
        exit 1
    fi
}

# Function to test latency
test_latency() {
    echo "Testing latency..."

    # Use multiple pings for better accuracy
    local ping_times=()
    local successful_pings=0

    for i in {1..5}; do
        local ping_time
        ping_time=$(ping -c 1 -W 2 8.8.8.8 2>/dev/null | grep 'time=' | awk -F'time=' '{print $2}' | awk '{print $1}' | tr -d 'ms')

        if [[ -n "$ping_time" && "$ping_time" != "0.0" ]]; then
            ping_times+=("$ping_time")
            ((successful_pings++))
        fi

        sleep 0.5
    done

    if [[ $successful_pings -gt 0 ]]; then
        # Calculate average, min, max
        local sum=0
        local min=${ping_times[0]}
        local max=${ping_times[0]}

        for time in "${ping_times[@]}"; do
            sum=$(echo "$sum + $time" | bc -l)
            if (( $(echo "$time < $min" | bc -l) )); then
                min="$time"
            fi
            if (( $(echo "$time > $max" | bc -l) )); then
                max="$time"
            fi
        done

        local avg=$(echo "scale=2; $sum / $successful_pings" | bc -l)

        echo -e "$GREEN✓$NC Latency: ${avg}ms (min: ${min}ms, max: ${max}ms)"
        return 0
    else
        echo -e "$RED✗$NC Latency test failed"
        return 1
    fi
}

# Function to test download speed
test_download_speed() {
    echo "Testing download speed..."

    # Use a reliable speed test file
    local test_url="http://speedtest.ftp.otenet.gr/files/test100Mb.db"
    local start_time=$(date +%s.%N)

    # Download test file with timeout
    if timeout $TIMEOUT curl -s -o /tmp/speedtest_download "$test_url" 2>/dev/null; then
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l)

        if [[ -f "/tmp/speedtest_download" ]]; then
            local file_size=$(stat -c%s "/tmp/speedtest_download" 2>/dev/null || stat -f%z "/tmp/speedtest_download" 2>/dev/null)
            local speed_bps=$(echo "scale=2; $file_size / $duration" | bc -l)
            local speed_mbps=$(echo "scale=2; $speed_bps / 1000000" | bc -l)

            rm -f "/tmp/speedtest_download"

            echo -e "$GREEN✓$NC Download: ${speed_mbps} Mbps (${file_size} bytes in ${duration}s)"
            return 0
        fi
    fi

    echo -e "$RED✗$NC Download test failed"
    return 1
}

# Function to test upload speed
test_upload_speed() {
    echo "Testing upload speed..."

    # Create a test file of known size (1MB)
    local test_size_mb=1
    local test_file="/tmp/speedtest_upload"

    dd if=/dev/zero of="$test_file" bs=1M count="$test_size_mb" &>/dev/null

    if [[ -f "$test_file" ]]; then
        local start_time=$(date +%s.%N)

        # Upload to a paste service or similar (using httpbin for testing)
        if timeout $TIMEOUT curl -s -X POST -F "file=@$test_file" http://httpbin.org/post &>/dev/null; then
            local end_time=$(date +%s.%N)
            local duration=$(echo "$end_time - $start_time" | bc -l)
            local file_size=$((test_size_mb * 1024 * 1024))
            local speed_bps=$(echo "scale=2; $file_size / $duration" | bc -l)
            local speed_mbps=$(echo "scale=2; $speed_bps / 1000000" | bc -l)

            rm -f "$test_file"

            echo -e "$GREEN✓$NC Upload: ${speed_mbps} Mbps (${file_size} bytes in ${duration}s)"
            return 0
        fi

        rm -f "$test_file"
    fi

    echo -e "$RED✗$NC Upload test failed"
    return 1
}

# Function to display network interface information
show_network_info() {
    echo "Network Interface Information:"
    echo ""

    # Display IP addresses
    echo "IP Addresses:"
    hostname -I 2>/dev/null | tr ' ' '\n' | head -5 | sed 's/^/  /'
    echo ""

    # Display routing information
    echo "Default Route:"
    ip route show default 2>/dev/null | head -1 | sed 's/^/  /'
    echo ""

    # Display DNS servers
    echo "DNS Servers:"
    systemd-resolve --status 2>/dev/null | grep 'DNS Servers' -A 10 | grep -E '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -3 | sed 's/^/  /' || echo "  Using /etc/resolv.conf"
    echo ""
}

# Function to run full test
run_full_test() {
    echo "=== Network Speed Test ==="
    echo "Started at: $(date)"
    echo ""

    show_network_info

    local download_result=0
    local upload_result=0
    local latency_result=0

    # Test latency
    if ! test_latency; then
        latency_result=1
    fi

    echo ""

    # Test download speed
    if [[ "$TEST_TYPE" == "full" || "$TEST_TYPE" == "download" ]]; then
        if ! test_download_speed; then
            download_result=1
        fi
        echo ""
    fi

    # Test upload speed
    if [[ "$TEST_TYPE" == "full" || "$TEST_TYPE" == "upload" ]]; then
        if ! test_upload_speed; then
            upload_result=1
        fi
        echo ""
    fi

    echo "=== Test Results Summary ==="
    echo "$(date)"

    if [[ $latency_result -eq 0 ]]; then
        echo -e "$GREEN✓$NC Latency test: PASSED"
    else
        echo -e "$RED✗$NC Latency test: FAILED"
    fi

    if [[ "$TEST_TYPE" == "full" || "$TEST_TYPE" == "download" ]]; then
        if [[ $download_result -eq 0 ]]; then
            echo -e "$GREEN✓$NC Download test: PASSED"
        else
            echo -e "$RED✗$NC Download test: FAILED"
        fi
    fi

    if [[ "$TEST_TYPE" == "full" || "$TEST_TYPE" == "upload" ]]; then
        if [[ $upload_result -eq 0 ]]; then
            echo -e "$GREEN✓$NC Upload test: PASSED"
        else
            echo -e "$RED✗$NC Upload test: FAILED"
        fi
    fi
}

# Main execution
check_dependencies
run_full_test