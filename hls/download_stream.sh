#!/bin/bash
#
# HLS Stream Downloader
# Downloads the live audio stream and saves to file
#

set -e

MASTER_URL="https://streams.kut.org/4428/playlist.m3u8"
OUTPUT_DIR="./recordings"
DURATION="${1:-60}"  # Default 60 seconds

print_usage() {
    echo "Usage: $0 [duration_in_seconds]"
    echo ""
    echo "Examples:"
    echo "  $0 60        # Record 60 seconds"
    echo "  $0 300       # Record 5 minutes"
    echo "  $0 1800      # Record 30 minutes"
    exit 1
}

# Check if ffmpeg is available
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: ffmpeg is required but not installed"
    echo ""
    echo "Install with:"
    echo "  macOS:   brew install ffmpeg"
    echo "  Ubuntu:  sudo apt-get install ffmpeg"
    echo "  Fedora:  sudo dnf install ffmpeg"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="${OUTPUT_DIR}/kutx_${TIMESTAMP}.aac"

echo "🎵 KUT/KUTX HLS Stream Recorder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Stream:   $MASTER_URL"
echo "Duration: ${DURATION}s"
echo "Output:   $OUTPUT_FILE"
echo ""
echo "Recording..."

# Download the stream
# -i: input URL
# -t: duration in seconds
# -c copy: copy audio codec without re-encoding
# -bsf:a aac_adtstoasc: convert ADTS to ASC format if needed
ffmpeg -i "$MASTER_URL" \
       -t "$DURATION" \
       -c copy \
       -y \
       "$OUTPUT_FILE" 2>&1 | grep -E '(Duration|time=|error|Error)' || true

if [ -f "$OUTPUT_FILE" ]; then
    SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo ""
    echo "✅ Recording complete!"
    echo "   File: $OUTPUT_FILE"
    echo "   Size: $SIZE"
    echo ""
    echo "Play with:"
    echo "   ffplay \"$OUTPUT_FILE\""
    echo "   vlc \"$OUTPUT_FILE\""
    echo "   mpv \"$OUTPUT_FILE\""
else
    echo ""
    echo "❌ Recording failed"
    exit 1
fi
