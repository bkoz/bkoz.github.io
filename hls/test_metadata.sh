#!/bin/bash
#
# Quick test to see current track metadata
#

echo "🎵 Fetching current track from KUTX stream..."
echo ""

# Get master playlist
MASTER_URL="https://streams.kut.org/4428/playlist.m3u8"
MEDIA_URL=$(curl -sL "$MASTER_URL" | grep "^https://" | head -1)

if [ -z "$MEDIA_URL" ]; then
    echo "❌ Could not fetch master playlist"
    exit 1
fi

echo "✓ Master playlist fetched"

# Get media playlist
PLAYLIST=$(curl -s "$MEDIA_URL")

if [ -z "$PLAYLIST" ]; then
    echo "❌ Could not fetch media playlist"
    exit 1
fi

echo "✓ Media playlist fetched"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Current Tracks in Playlist:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Extract all EXTINF lines
echo "$PLAYLIST" | grep "^#EXTINF:" | while read -r line; do
    # Extract duration and track info
    DURATION=$(echo "$line" | sed -E 's/#EXTINF:([0-9.]+),.*/\1/')
    TRACK=$(echo "$line" | sed -E 's/#EXTINF:[0-9.]+,//')

    # Format output
    if [[ "$TRACK" == *" - "* ]]; then
        ARTIST=$(echo "$TRACK" | cut -d'-' -f1 | xargs)
        TITLE=$(echo "$TRACK" | cut -d'-' -f2- | xargs)
        echo "🎵 $ARTIST"
        echo "   → $TITLE"
    else
        echo "📻 $TRACK"
    fi
    echo "   (${DURATION}s)"
    echo ""
done | tail -15

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 The web player displays the most recent track"
echo "   and updates every 10 seconds while playing."
