#!/bin/bash
#
# Test iTunes API artwork fetching
#

echo "🎨 Testing iTunes API for Album Artwork"
echo ""

# Test cases
declare -a tests=(
    "Cinderblock:The Opera"
    "Taylor Swift:Anti-Hero"
    "The Beatles:Let It Be"
    "Radiohead:Creep"
)

for test in "${tests[@]}"; do
    ARTIST=$(echo "$test" | cut -d':' -f1)
    TITLE=$(echo "$test" | cut -d':' -f2)

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎵 Searching: $ARTIST - $TITLE"
    echo ""

    # URL encode the search term
    SEARCH=$(echo "$ARTIST $TITLE" | sed 's/ /%20/g')

    # Query iTunes API
    RESULT=$(curl -s "https://itunes.apple.com/search?term=${SEARCH}&media=music&entity=song&limit=1")

    # Check if we got results
    COUNT=$(echo "$RESULT" | grep -o '"resultCount":[0-9]*' | cut -d':' -f2)

    if [ "$COUNT" -gt 0 ]; then
        # Extract artwork URL and track info
        ARTWORK_URL=$(echo "$RESULT" | grep -o '"artworkUrl100":"[^"]*"' | cut -d'"' -f4 | sed 's/100x100bb/600x600bb/')
        TRACK_NAME=$(echo "$RESULT" | grep -o '"trackName":"[^"]*"' | head -1 | cut -d'"' -f4)
        ARTIST_NAME=$(echo "$RESULT" | grep -o '"artistName":"[^"]*"' | head -1 | cut -d'"' -f4)
        ALBUM_NAME=$(echo "$RESULT" | grep -o '"collectionName":"[^"]*"' | head -1 | cut -d'"' -f4)

        echo "✅ Found!"
        echo "   Track:  $TRACK_NAME"
        echo "   Artist: $ARTIST_NAME"
        echo "   Album:  $ALBUM_NAME"
        echo "   Artwork: $ARTWORK_URL"
    else
        echo "❌ No results found"
    fi

    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 The web player will automatically fetch artwork"
echo "   from iTunes API when tracks have artist/title."
