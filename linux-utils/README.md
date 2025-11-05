# Linux Utilities Collection

A comprehensive collection of useful Linux command-line utilities for system administration, file management, network operations, and development tasks.

## 📁 Directory Structure

```
linux-utils/
├── system/           # System monitoring utilities
├── file/            # File management utilities
├── network/         # Network utilities
├── dev/             # Development utilities
└── README.md        # This file
```

## 🔧 System Monitoring Utilities

### CPU Monitor (`system/cpu-monitor.sh`)
Real-time CPU usage monitoring with detailed statistics.

**Features:**
- Real-time CPU usage display
- Per-core CPU statistics
- Top CPU-consuming processes
- CPU information (model, cores, architecture)

**Usage:**
```bash
./system/cpu-monitor.sh
```

### Memory Monitor (`system/memory-monitor.sh`)
Real-time memory and swap usage monitoring.

**Features:**
- Memory usage statistics
- Swap usage information
- Top memory-consuming processes
- Memory usage visualization

**Usage:**
```bash
./system/memory-monitor.sh
```

### Disk Monitor (`system/disk-monitor.sh`)
Disk usage monitoring and space warnings.

**Features:**
- Disk usage for all mounted filesystems
- Directory size analysis
- Low disk space warnings
- I/O statistics (if available)

**Usage:**
```bash
./system/disk-monitor.sh
```

## 📄 File Management Utilities

### Batch Rename (`file/batch-rename.sh`)
Powerful batch file renaming utility.

**Features:**
- Pattern-based renaming
- String replacement
- Sequential numbering
- Case conversion (upper/lower)
- Extension changes
- Dry-run mode

**Usage:**
```bash
./file/batch-rename.sh -r '.jpg' '_backup.jpg' *.jpg
./file/batch-rename.sh -s 'img_' *.png
./file/batch-rename.sh -l *.TXT
```

### Find Duplicates (`file/find-duplicates.sh`)
Find duplicate files by size, name, or content.

**Features:**
- Multiple detection methods (size, name, content)
- Output to file option
- Move/remove duplicates
- Detailed reporting

**Usage:**
```bash
./file/find-duplicates.sh -t content /home/user/Documents
./file/find-duplicates.sh -t name -o duplicates.txt .
```

### File Organizer (`file/file-organizer.sh`)
Automatically organize files into categorized directories.

**Features:**
- Configurable organization patterns
- Custom pattern files
- Dry-run mode
- Recursive organization

**Usage:**
```bash
./file/file-organizer.sh /home/user/Downloads
./file/file-organizer.sh -c  # Create custom patterns
```

## 🌐 Network Utilities

### Port Scanner (`network/port-scanner.sh`)
Scan for open ports on local or remote hosts.

**Features:**
- Port range scanning
- Concurrent connections
- Service detection
- Multiple output modes

**Usage:**
```bash
./network/port-scanner.sh -p 1-1000 localhost
./network/port-scanner.sh -p 80,443,22-25 -s example.com
```

### Speed Test (`network/speed-test.sh`)
Test network download/upload speeds and latency.

**Features:**
- Download speed testing
- Upload speed testing
- Latency measurement
- Network interface information

**Usage:**
```bash
./network/speed-test.sh -f  # Full test
./network/speed-test.sh -d -u  # Download + upload only
```

### Network Monitor (`network/network-monitor.sh`)
Monitor network connections and bandwidth usage.

**Features:**
- Real-time bandwidth monitoring
- Active connection display
- Network interface information
- Routing and DNS information

**Usage:**
```bash
./network/network-monitor.sh -a  # Monitor all
./network/network-monitor.sh -i eth0 -r 1  # Monitor eth0
```

## 💻 Development Utilities

### Code Formatter (`dev/code-formatter.sh`)
Format code files using appropriate formatters.

**Features:**
- Multi-language support (Python, JS/TS, JSON, XML, HTML, CSS, Go, Rust, C/C++)
- Multiple formatter options per language
- Recursive formatting
- Check and diff modes

**Supported Languages:**
- Python (black, autopep8, yapf)
- JavaScript/TypeScript (prettier, eslint)
- JSON (prettier, jq)
- XML (xmllint)
- HTML (prettier, tidy)
- CSS (prettier, stylelint)
- Go (gofmt, goimports)
- Rust (rustfmt)
- C/C++ (clang-format, astyle)

**Usage:**
```bash
./dev/code-formatter.sh -l python *.py
./dev/code-formatter.sh -l javascript -r src/
./dev/code-formatter.sh -l json -c *.json  # Check only
```

### Git Helper (`dev/git-helper.sh`)
Comprehensive git repository management utilities.

**Features:**
- Enhanced status display
- Formatted commit logs
- Branch management
- Repository statistics
- Backup creation
- Remote synchronization

**Commands:**
- `status` - Enhanced git status
- `log` - Formatted git log
- `branch` - Branch information
- `cleanup` - Clean merged branches
- `stats` - Repository statistics
- `backup` - Create repository backup
- `sync` - Sync with remote
- `review` - Review recent changes
- `authors` - Show commit authors
- `files` - Most modified files
- `size` - Repository size

**Usage:**
```bash
./dev/git-helper.sh status
./dev/git-helper.sh log -d 7
./dev/git-helper.sh cleanup
```

## 🚀 Installation & Setup

1. **Make scripts executable** (already done):
   ```bash
   find linux-utils -name "*.sh" -exec chmod +x {} \;
   ```

2. **Add to PATH** (optional):
   ```bash
   echo 'export PATH="$PATH:/path/to/linux-utils"' >> ~/.bashrc
   ```

3. **Install dependencies** for full functionality:
   ```bash
   # For speed test
   sudo apt-get install curl bc  # Ubuntu/Debian

   # For code formatting (choose based on needs)
   pip install black autopep8 yapf  # Python
   npm install -g prettier eslint   # JavaScript/TypeScript
   # ... etc for other languages
   ```

## 📋 Common Use Cases

### System Administration
```bash
# Monitor system resources
./system/cpu-monitor.sh &
./system/memory-monitor.sh &
./system/disk-monitor.sh &

# Clean up disk space
./file/find-duplicates.sh -t size -r /home
```

### File Management
```bash
# Organize downloads
./file/file-organizer.sh ~/Downloads

# Batch rename files
./file/batch-rename.sh -s 'backup_' *.txt

# Find duplicate photos
./file/find-duplicates.sh -t content ~/Pictures
```

### Network Administration
```bash
# Test network speed
./network/speed-test.sh -f

# Monitor network activity
./network/network-monitor.sh -b

# Scan for open ports
./network/port-scanner.sh -p 1-1000 localhost
```

### Development Workflow
```bash
# Format code
./dev/code-formatter.sh -l python -r .

# Git repository management
./dev/git-helper.sh status
./dev/git-helper.sh cleanup

# Backup repository
./dev/git-helper.sh backup
```

## 🔧 Configuration

Most utilities support configuration through:
- Command-line options
- Configuration files (where applicable)
- Environment variables

## 📝 Contributing

To add new utilities:
1. Create the script in the appropriate subdirectory
2. Make it executable: `chmod +x script.sh`
3. Add documentation to this README
4. Test thoroughly

## 📄 License

These utilities are provided as-is for educational and practical use.

---

*Created with ❤️ for the Linux community*