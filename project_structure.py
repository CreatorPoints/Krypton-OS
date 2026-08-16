#!/usr/bin/env python3
"""
KryptonOS Project Structure Analyzer & File Mapper
Recursively scans the directory, listing file path, size, and line count.
"""

import os
import sys
from pathlib import Path

# Directories and patterns to ignore
IGNORE_DIRS = {
    '.git', '__pycache__', '.pytest_cache', 'node_modules', 
    '.vscode', '.idea', '.tempmediaStorage', '.system_generated'
}

# Binary extensions for which line count is skipped
BINARY_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.bmp', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.mp3', '.wav', '.ogg', '.mp4', '.webm',
    '.zip', '.tar', '.gz', '.7z', '.rar',
    '.pdf', '.exe', '.dll', '.so', '.bin'
}

def format_size(size_bytes: int) -> str:
    """Format bytes into human-readable size string."""
    if size_bytes < 1024:
        return f"{size_bytes:>5} B "
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:>6.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):>6.2f} MB"

def count_lines(file_path: Path) -> int | None:
    """Count lines of text file, returning None if binary or unreadable."""
    if file_path.suffix.lower() in BINARY_EXTENSIONS:
        return None
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return sum(1 for _ in f)
    except Exception:
        return None

def scan_project(root_dir: str = '.'):
    root_path = Path(root_dir).resolve()
    print("=" * 90)
    print(f"  PROJECT STRUCTURE & FILE MAP: {root_path.name}")
    print(f"  Root: {root_path}")
    print("=" * 90)
    print(f"{'FILE PATH':<55} | {'SIZE':<9} | {'LINES':<8}")
    print("-" * 90)

    total_files = 0
    total_lines = 0
    total_size = 0
    stats_by_ext = {}

    for dirpath, dirnames, filenames in os.walk(root_path):
        # Filter out ignored directories in-place
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS and not d.startswith('.')]
        
        # Sort directories and files alphabetically
        dirnames.sort()
        filenames.sort()

        for filename in filenames:
            if filename.startswith('.') and filename not in {'.gitignore', '.firebaserc', '.env'}:
                continue

            file_path = Path(dirpath) / filename
            try:
                rel_path = file_path.relative_to(root_path)
            except ValueError:
                rel_path = file_path

            try:
                size_bytes = file_path.stat().st_size
            except OSError:
                size_bytes = 0

            lines = count_lines(file_path)
            lines_str = f"{lines:>6}" if lines is not None else "  [bin]"
            
            total_files += 1
            total_size += size_bytes
            if lines is not None:
                total_lines += lines

            ext = file_path.suffix.lower() or '(no ext)'
            if ext not in stats_by_ext:
                stats_by_ext[ext] = {'files': 0, 'size': 0, 'lines': 0}
            stats_by_ext[ext]['files'] += 1
            stats_by_ext[ext]['size'] += size_bytes
            if lines is not None:
                stats_by_ext[ext]['lines'] += lines

            # Truncate or pad rel_path for clean table display
            rel_str = str(rel_path)
            if len(rel_str) > 54:
                display_path = '...' + rel_str[-51:]
            else:
                display_path = rel_str

            print(f"{display_path:<55} | {format_size(size_bytes)} | {lines_str}")

    print("=" * 90)
    print("  SUMMARY BY FILE TYPE")
    print("-" * 90)
    print(f"{'EXTENSION':<15} | {'FILES':<8} | {'TOTAL SIZE':<12} | {'TOTAL LINES':<10}")
    print("-" * 90)
    
    # Sort extensions by total lines descending, then size
    for ext, s in sorted(stats_by_ext.items(), key=lambda x: (x[1]['lines'], x[1]['size']), reverse=True):
        print(f"{ext:<15} | {s['files']:<8} | {format_size(s['size']):<12} | {s['lines']:<10}")

    print("=" * 90)
    print(f"  TOTALS: {total_files} files  |  {format_size(total_size).strip()} total size  |  {total_lines:,} lines of code")
    print("=" * 90)

if __name__ == '__main__':
    target_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    scan_project(target_dir)
