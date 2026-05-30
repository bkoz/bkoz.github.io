# Web Player Features

## Live Track Metadata Display

The `web_player.html` includes **automatic track metadata updates** that display the current song and artist in real-time, along with **album artwork from the iTunes API**.

### How It Works

1. **Automatic Updates**: Fetches metadata from the HLS playlist every 10 seconds
2. **Track Parsing**: Separates artist and title from EXTINF tags
3. **Album Artwork**: Queries iTunes API for high-res album art (600x600)
4. **Visual Feedback**: Smooth animations and indicators show update status
5. **No Manual Refresh**: Updates happen automatically while playing

### Display Format

**Music Tracks:**
```
     ┌─────────────┐
     │             │
     │   Album     │  ← 200x200 artwork from iTunes
     │   Artwork   │
     │             │
     └─────────────┘
   Artwork from iTunes

NOW PLAYING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cinderblock                    ← Artist (purple, bold)
The Opera                      ← Title (large, black)

Updated at 8:51:23 PM
```

**Station Promos/Announcements:**
```
NOW PLAYING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are Listening to I Want This To Last [EP]

Updated at 8:51:33 PM
```

### Visual Indicators

- **🎨 Album Artwork**: 200x200px high-res cover art from iTunes API
- **🔴 Red Pulsing Dot**: Appears when stream is live and playing
- **Purple Glow**: Flashes during metadata refresh
- **Fade Animation**: Smooth transition when track changes
- **Shimmer Effect**: Loading animation while fetching artwork
- **Timestamp**: Shows when metadata was last updated

## Album Artwork Integration

### iTunes API
The player automatically fetches album artwork from Apple's iTunes Search API when it detects artist and title information.

**Features:**
- **High Resolution**: 600x600 pixel artwork (upscaled from 100x100 default)
- **Automatic Matching**: Searches iTunes catalog by artist + title
- **Smart Caching**: Only fetches new artwork when track changes
- **Graceful Fallback**: Shows music note placeholder if no artwork found
- **Loading Animation**: Shimmer effect while fetching
- **Fade In**: Smooth entrance animation when artwork loads

**How It Works:**
1. Player parses "Artist - Title" from HLS metadata
2. Constructs iTunes API search query
3. Fetches first matching result
4. Downloads high-res artwork (600x600)
5. Displays with smooth fade-in animation

**API Endpoint:**
```
https://itunes.apple.com/search?term={artist}%20{title}&media=music&entity=song&limit=1
```

**Response Data Used:**
- `artworkUrl100` - Base artwork URL (upgraded to 600x600)
- `trackName` - Verified track name
- `artistName` - Verified artist name
- `collectionName` - Album name (logged to console)

**Example:**
```javascript
// Search: "Cinderblock The Opera"
// Returns: https://is1-ssl.mzstatic.com/.../600x600bb.jpg
// Album: "I Want This To Last - EP"
```

### Performance
- **Request Size**: ~5-10 KB JSON response
- **Image Size**: ~30-50 KB JPEG (600x600)
- **Caching**: Browser caches images automatically
- **Rate Limit**: No official limit, but throttled per reasonable use
- **Latency**: ~200-500ms for API + image load

### Fallback Behavior
When artwork cannot be found:
- Station promos/announcements → Show placeholder
- Obscure/indie tracks → Show placeholder if not in iTunes
- API errors → Show placeholder
- Network offline → Show placeholder

**Placeholder:** 🎵 icon on gradient background

### Metadata Format Examples

Based on the HLS stream EXTINF tags:

```m3u8
#EXTINF:4.96907,Cinderblock - The Opera
```
Displays as:
- Artist: **Cinderblock** (purple)
- Title: **The Opera** (black)

```m3u8
#EXTINF:4.50467,You are Listening to I Want This To Last [EP]
```
Displays as:
- Title: **You are Listening to I Want This To Last [EP]**

### Technical Details

**Update Frequency**: 10 seconds
- Balances freshness vs. network load
- HLS segments are ~5 seconds, so checks every 2 segments
- Configurable in the code (search for `10000` in JavaScript)

**Network Calls**:
1. Fetch master playlist (tiny, ~300 bytes)
2. Extract media playlist URL
3. Fetch media playlist (~2-3 KB)
4. Parse EXTINF tags for track info

**Change Detection**:
- Only updates display when track actually changes
- Prevents unnecessary DOM updates
- Logs changes to browser console

**Browser Console Output**:
```
🎵 Now Playing: Cinderblock - The Opera
🎵 Now Playing: You are Listening to I Want This To Last [EP]
```

### Customization

**Change Update Interval**:
```javascript
// In web_player.html, find this line:
metadataInterval = setInterval(fetchMetadata, 10000); // Every 10 seconds

// Change to 5 seconds:
metadataInterval = setInterval(fetchMetadata, 5000); // Every 5 seconds

// Change to 30 seconds:
metadataInterval = setInterval(fetchMetadata, 30000); // Every 30 seconds
```

**Change Visual Style**:
```css
/* Artist color (default purple) */
.artist {
    color: #667eea;  /* Change to any color */
}

/* Title size (default 20px) */
.title {
    font-size: 20px;  /* Adjust size */
}

/* Live indicator color (default red) */
.live-indicator {
    background: #f5576c;  /* Change dot color */
}
```

### Testing

**Quick Test**:
```bash
# See what's currently playing
./test_metadata.sh
```

**Live Monitor**:
```bash
# Watch track changes in terminal
./monitor_stream.py
```

**Browser Console**:
1. Open web_player.html
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Click Play
5. Watch for "🎵 Now Playing:" messages

### Limitations

- **Latency**: Track info lags 10-30 seconds behind live broadcast
  - HLS protocol inherent delay (~15-30s)
  - Update polling interval adds up to 10s
- **Accuracy**: Depends on HLS playlist metadata quality
  - Station controls what appears in EXTINF tags
  - Some tracks may not separate artist/title cleanly
- **Network**: Requires internet connection for updates
  - Uses small bandwidth (~200 bytes per update)
  - Graceful degradation if offline

### Comparison with Other Players

| Feature | web_player.html | VLC | mpv | Native Safari |
|---------|----------------|-----|-----|---------------|
| Track Display | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Artist/Title Split | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Album Artwork | ✅ Yes (iTunes) | ❌ No | ❌ No | ❌ No |
| Auto Update | ✅ 10s | ❌ No | ❌ No | ❌ No |
| Update Animation | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Timestamp | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Console Logging | ✅ Yes | ❌ No | ❌ No | ❌ No |

### Integration Examples

**Scrobbling to Last.fm**:
```javascript
// Add to fetchMetadata() function after updateTrackDisplay()
if (lastTrack.includes(' - ')) {
    const [artist, title] = lastTrack.split(' - ');
    scrobbleToLastFm(artist.trim(), title.trim());
}
```

**Discord Rich Presence**:
```javascript
// Send to Discord when track changes
if (lastTrack !== currentTrack) {
    updateDiscordPresence({
        details: artist,
        state: title,
        largeImageKey: 'kutx_logo'
    });
}
```

**Browser Notification**:
```javascript
// Show notification on track change
if (Notification.permission === 'granted') {
    new Notification('🎵 Now Playing', {
        body: `${artist} - ${title}`,
        icon: 'kutx_icon.png'
    });
}
```

### Future Enhancements

Potential features to add:
- [✅] Album art display (if available in metadata) - **DONE via iTunes API**
- [ ] Track history list (last 10 tracks)
- [ ] Favorite/save track button
- [ ] Share current track on social media
- [ ] Lyrics integration
- [ ] Genre tags
- [ ] Waveform visualization
- [ ] Desktop notifications
- [ ] Sleep timer

---

**The web player already has full metadata support built-in!**

Just open `web_player.html` in a browser and click Play to see live track information with automatic updates every 10 seconds.
