# Album Artwork Integration

## Overview

The web player now automatically displays **high-resolution album artwork** (600x600) from Apple's iTunes API for every track with artist and title information.

## Features

### ✨ What You Get

- **Automatic Fetching**: No manual work - artwork loads automatically
- **High Resolution**: 600x600 pixel album covers
- **Fast Loading**: Shimmer animation while fetching (~200-500ms)
- **Smart Matching**: iTunes API finds the best match for artist + title
- **Graceful Fallback**: Music note placeholder if artwork unavailable
- **Smooth Animations**: Fade-in effect when artwork loads
- **Caching**: Browser caches images for instant reload

### 🎨 Visual Design

**Layout:**
```
┌─────────────────────────────┐
│                             │
│      ┌───────────┐          │
│      │           │          │
│      │  Album    │  200x200 │
│      │  Artwork  │   Image  │
│      │           │          │
│      └───────────┘          │
│   Artwork from iTunes       │
│                             │
│   🔴 NOW PLAYING            │
│   ━━━━━━━━━━━━━━━━━━━━━━   │
│   Artist Name (purple)      │
│   Song Title (large)        │
│                             │
│   Updated at 8:51:23 PM     │
│                             │
└─────────────────────────────┘
```

**Styling:**
- Rounded corners (12px radius)
- Drop shadow for depth
- Smooth fade-in animation
- Shimmer loading effect
- Gradient placeholder background

## iTunes API Integration

### API Details

**Endpoint:**
```
https://itunes.apple.com/search
```

**Parameters:**
- `term` - Search query (artist + title)
- `media=music` - Limit to music content
- `entity=song` - Specific to songs
- `limit=1` - Return only best match

**Example Request:**
```
https://itunes.apple.com/search?term=Cinderblock%20The%20Opera&media=music&entity=song&limit=1
```

**Example Response:**
```json
{
  "resultCount": 1,
  "results": [
    {
      "trackName": "Cinderblock",
      "artistName": "The Opera",
      "collectionName": "I Want This To Last - EP",
      "artworkUrl100": "https://is1-ssl.mzstatic.com/.../100x100bb.jpg",
      "artworkUrl60": "https://is1-ssl.mzstatic.com/.../60x60bb.jpg"
    }
  ]
}
```

### Resolution Upgrade

The API returns `artworkUrl100` (100x100), but we upgrade to 600x600:

```javascript
// Original URL
artworkUrl100: "https://is1-ssl.mzstatic.com/.../100x100bb.jpg"

// Upgraded URL (replace 100x100 with 600x600)
artworkUrl600: "https://is1-ssl.mzstatic.com/.../600x600bb.jpg"
```

**Available Sizes:**
- `60x60bb.jpg` - Thumbnail
- `100x100bb.jpg` - Small
- `200x200bb.jpg` - Medium
- `600x600bb.jpg` - High-res (used by player)
- `1200x1200bb.jpg` - Extra high-res (available for some albums)

## How It Works

### Flow Diagram

```
1. HLS Playlist Update
        ↓
2. Parse Track Metadata
        ↓
3. Extract Artist + Title
        ↓
4. Query iTunes API ─────→ [Search Results]
        ↓                          ↓
5. Get Artwork URL         [Best Match]
        ↓                          ↓
6. Upgrade to 600x600      [Album Info]
        ↓
7. Load Image
        ↓
8. Fade In Animation
        ↓
9. Display Artwork
```

### Code Implementation

**Track Change Detection:**
```javascript
if (lastTrack !== currentTrack) {
    currentTrack = lastTrack;
    updateTrackDisplay(lastTrack);  // Triggers artwork fetch
}
```

**Artwork Fetching:**
```javascript
async function fetchAlbumArtwork(artist, title) {
    // Add loading state
    albumArtwork.classList.add('loading');

    // Build search query
    const searchTerm = encodeURIComponent(`${artist} ${title}`);
    const url = `https://itunes.apple.com/search?term=${searchTerm}&media=music&entity=song&limit=1`;

    // Fetch from iTunes
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
        // Get high-res URL
        const artworkUrl = data.results[0].artworkUrl100.replace('100x100', '600x600');

        // Create image element
        const img = document.createElement('img');
        img.src = artworkUrl;

        // Display with animation
        albumArtwork.innerHTML = '';
        albumArtwork.appendChild(img);
    }

    albumArtwork.classList.remove('loading');
}
```

**Caching:**
```javascript
// Only update if artwork URL changed
if (artworkUrl !== currentArtworkUrl) {
    currentArtworkUrl = artworkUrl;
    // ... load and display
}
```

## Performance

### Network Usage

**Per Track Change:**
- iTunes API request: ~5-10 KB JSON
- Image download: ~30-50 KB JPEG (600x600)
- **Total**: ~40-60 KB per track

**Update Frequency:**
- Track changes: Every 3-5 minutes (typical radio station)
- API calls: Only when track changes
- Image caching: Browser caches images indefinitely

**Bandwidth Estimate:**
- Hourly: ~12-20 track changes = ~480-1200 KB/hour
- Daily (8 hours listening): ~4-10 MB/day

### Loading Performance

| Phase | Time | Description |
|-------|------|-------------|
| API Request | 100-300ms | Query iTunes catalog |
| Image Download | 100-200ms | Fetch 600x600 JPEG |
| **Total** | **200-500ms** | Full artwork load time |

**Optimizations:**
- Parallel fetching (doesn't block audio playback)
- Browser image caching
- Only fetch on track change (not on every metadata poll)
- Shimmer animation provides visual feedback

## Testing

### Manual Test

1. **Open the player:**
   ```bash
   open web_player.html
   ```

2. **Click Play**

3. **Wait for a track with artist/title**
   - Artwork should appear within 1 second
   - Shimmer effect shows while loading
   - Smooth fade-in when complete

4. **Check browser console**
   ```
   🎵 Now Playing: Cinderblock - The Opera
   🎨 Album artwork loaded: Cinderblock by The Opera
   ```

### Command Line Test

```bash
./test_itunes_api.sh
```

**Sample Output:**
```
🎨 Testing iTunes API for Album Artwork

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎵 Searching: Cinderblock - The Opera

✅ Found!
   Track:  Cinderblock
   Artist: The Opera
   Album:  I Want This To Last - EP
   Artwork: https://is1-ssl.mzstatic.com/.../600x600bb.jpg
```

### API Test (curl)

```bash
# Test direct API call
curl -s "https://itunes.apple.com/search?term=Taylor%20Swift%20Anti-Hero&media=music&entity=song&limit=1" | jq '.results[0] | {track: .trackName, artist: .artistName, artwork: .artworkUrl100}'
```

**Response:**
```json
{
  "track": "Anti-Hero",
  "artist": "Taylor Swift",
  "artwork": "https://is1-ssl.mzstatic.com/.../100x100bb.jpg"
}
```

## Troubleshooting

### Common Issues

**1. No Artwork Appears**
- **Cause**: Track not in iTunes catalog
- **Solution**: Player shows music note placeholder
- **Example**: Very obscure/indie artists

**2. Wrong Artwork Displayed**
- **Cause**: Multiple tracks with same artist/title
- **Solution**: iTunes API returns most popular match
- **Fix**: Player uses first result (usually correct)

**3. Slow Loading**
- **Cause**: Network latency or large image
- **Solution**: Shimmer animation shows loading state
- **Typical**: 200-500ms is normal

**4. API Rate Limiting**
- **Cause**: Too many requests in short time
- **Solution**: Player only fetches on track change (not every 10s)
- **Limit**: No official limit, reasonable use is fine

**5. CORS Errors**
- **Cause**: iTunes API requires proper CORS headers
- **Solution**: API supports CORS by default
- **Note**: Works in all modern browsers

### Browser Console Debugging

Enable to see detailed logs:

```javascript
console.log('🎵 Now Playing:', trackString);           // Track changes
console.log('🎨 Album artwork loaded:', trackName);    // Successful fetch
console.error('Album artwork fetch error:', err);      // Errors
```

## Customization

### Change Artwork Size

```javascript
// In web_player.html, find:
const artworkUrl = result.artworkUrl100.replace('100x100', '600x600');

// Options:
'200x200'   // Medium quality, faster load
'600x600'   // High quality (current)
'1200x1200' // Extra high quality (if available)
```

### Change Artwork Display Size

```css
/* In web_player.html styles, find: */
.album-artwork {
    width: 200px;   /* Change both to same value */
    height: 200px;
}

/* Example: Larger display */
.album-artwork {
    width: 300px;
    height: 300px;
}
```

### Disable Artwork

```javascript
// Comment out artwork fetch in updateTrackDisplay():
// if (artist && title) {
//     fetchAlbumArtwork(artist, title);
// }
```

### Use Different API

Replace iTunes API with alternatives:

**Spotify API:**
```javascript
// Requires OAuth token
const url = `https://api.spotify.com/v1/search?q=${artist}%20${title}&type=track&limit=1`;
```

**Last.fm API:**
```javascript
// Requires API key
const url = `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${artist}&track=${title}&api_key=YOUR_KEY&format=json`;
```

**MusicBrainz + Cover Art Archive:**
```javascript
// Free, no API key, but requires two requests
// 1. Search MusicBrainz for release ID
// 2. Fetch cover from Cover Art Archive
```

## Privacy & Terms

### Data Collection
- **iTunes API**: No user data collected
- **Anonymous**: No tracking or user identification
- **Public API**: Searches public iTunes catalog

### Terms of Use
- iTunes API is free for reasonable use
- Album artwork is copyrighted by respective owners
- Personal/educational use is permitted
- Commercial use may require licensing

### Attribution
The player displays "Artwork from iTunes" credit below the image.

## Examples

### Real Tracks from Stream

**1. Cinderblock - The Opera**
```
Album: I Want This To Last - EP
Artwork: ✅ Found
Quality: 600x600
Load Time: ~300ms
```

**2. Station Promo**
```
Text: "You are Listening to I Want This To Last [EP]"
Artwork: ➖ Placeholder (no artist/title)
Display: 🎵 icon
```

**3. Taylor Swift - Anti-Hero**
```
Album: Midnights
Artwork: ✅ Found
Quality: 600x600
Load Time: ~250ms
```

## Future Enhancements

- [ ] Fallback to alternative APIs if iTunes fails
- [ ] Album name display below artwork
- [ ] Click artwork to open in iTunes/Apple Music
- [ ] Artwork history carousel
- [ ] Color palette extraction from artwork
- [ ] Animated transitions between artworks
- [ ] Blur background effect using artwork colors
- [ ] Download/save artwork button

---

**The web player now has full album artwork support!**

Open `web_player.html`, click Play, and watch album covers appear automatically as tracks change.
