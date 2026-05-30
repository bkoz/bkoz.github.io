# HLS Stream Analysis Summary

## Stream URL
**https://streams.kut.org/4428/playlist.m3u8**

## Key Findings

### Stream Characteristics
- **Type**: Live HLS audio stream (HTTP Live Streaming)
- **Station**: KUTX - Austin, TX public radio
- **Codec**: HE-AAC v2 (High-Efficiency Advanced Audio Coding version 2)
  - Codec identifier: `mp4a.40.29`
  - Optimized for low-bitrate streaming
- **Bitrate**: 64 kbps constant
- **Sample Rate**: 44.1 kHz (inferred from codec profile)
- **Protocol Version**: HLS v6 (RFC 8216 compliant)

### Architecture
```
┌─────────────────┐
│   Master M3U8   │  (streams.kut.org)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Media M3U8    │  (CDN edge server)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AAC Segments   │  (~5 second chunks)
│  segment-7027   │  • 3-5 seconds each
│  segment-7028   │  • Sequential numbering
│  segment-7029   │  • Includes metadata
│      ...        │  • CDN cached (10min TTL)
└─────────────────┘
```

### CDN & Delivery
- **Provider**: cdnstream.com
- **Edge Server**: das-edge55-sa49-pit01 (Pittsburgh)
- **Caching**: 600-second TTL on segments
- **Session Management**: Temporary session IDs for tracking
- **HTTPS**: Secure delivery

### Metadata
Each segment includes rich metadata via EXTINF tags:
- Artist name
- Track title
- Duration (precise to milliseconds)
- Station promos/announcements
- Web links (for playlists, videos)

**Example**:
```m3u8
#EXTINF:3.99383,No Brainer - Cure for Paranoia
#EXTINF:3.01859,Playlist Videos 1A and more at kutx.org - https://kutx.org/
```

### Live Streaming Behavior
- No `#EXT-X-ENDLIST` tag → continuous live stream
- Target duration: 5 seconds per segment
- Actual durations: 3-5 seconds (variable)
- Playlist updates continuously with new segments
- Old segments expire as new ones arrive (rolling window)

## Technical Quality

### Audio Quality
At 64 kbps with HE-AAC v2:
- **Voice/Talk**: Excellent clarity
- **Music**: Good quality (comparable to 96-128 kbps MP3)
- **Efficiency**: Spectral Band Replication + Parametric Stereo

### Latency
- **Typical**: 15-30 seconds behind live broadcast
- **Cause**: Segment buffering + CDN propagation
- **Trade-off**: Higher latency for better reliability

### Compatibility
✅ **Works with**:
- Safari (iOS/macOS) - native support
- Chrome/Firefox/Edge - via HLS.js
- VLC, mpv, ffmpeg - desktop players
- iOS AVPlayer, Android ExoPlayer - mobile apps

## Files Created

### Documentation
1. **stream_analysis.md** (6.3 KB)
   - Comprehensive technical breakdown
   - Protocol details, codec specs
   - Integration recommendations

2. **README.md** (5.6 KB)
   - Quick start guide
   - Usage examples
   - Tool documentation

3. **SUMMARY.md** (this file)
   - High-level overview
   - Key findings
   - Quick reference

### Tools

4. **monitor_stream.py** (5.7 KB)
   - Real-time track metadata monitor
   - Displays artist/title updates
   - Configurable refresh interval
   ```bash
   ./monitor_stream.py --interval 10
   ```

5. **download_stream.sh** (1.9 KB)
   - Record stream to AAC file
   - Configurable duration
   - Uses ffmpeg
   ```bash
   ./download_stream.sh 300  # 5 minutes
   ```

6. **web_player.html** (12 KB)
   - Standalone web player
   - HLS.js integration
   - Live metadata display
   - Volume control
   - Beautiful UI

## Quick Commands

### Listen with Command Line
```bash
# mpv (recommended)
mpv https://streams.kut.org/4428/playlist.m3u8

# ffplay
ffplay https://streams.kut.org/4428/playlist.m3u8

# VLC
vlc https://streams.kut.org/4428/playlist.m3u8
```

### Inspect Stream
```bash
# Get master playlist
curl -s "https://streams.kut.org/4428/playlist.m3u8"

# Get media playlist URL
MEDIA_URL=$(curl -sL "https://streams.kut.org/4428/playlist.m3u8" | grep "^https://")

# View current segments
curl -s "$MEDIA_URL" | grep "#EXTINF"
```

### Record Stream
```bash
# With ffmpeg (60 seconds)
ffmpeg -i "https://streams.kut.org/4428/playlist.m3u8" \
       -t 60 \
       -c copy \
       output.aac

# Or use the provided script
./download_stream.sh 60
```

## Integration Examples

### Python
```python
import requests

# Fetch master playlist
response = requests.get('https://streams.kut.org/4428/playlist.m3u8')
master = response.text

# Extract media playlist URL
media_url = [line for line in master.split('\n') if line.startswith('http')][0]

# Fetch media playlist
playlist = requests.get(media_url.strip()).text

# Parse track metadata
for line in playlist.split('\n'):
    if line.startswith('#EXTINF:'):
        track = line.split(',', 1)[1]
        print(f"Now playing: {track}")
```

### JavaScript (Browser)
```javascript
// Using HLS.js
const video = document.createElement('audio');
const hls = new Hls();
hls.loadSource('https://streams.kut.org/4428/playlist.m3u8');
hls.attachMedia(video);
video.play();
```

### cURL + jq
```bash
# Extract track info
MEDIA_URL=$(curl -sL "https://streams.kut.org/4428/playlist.m3u8" | grep "^https://")
curl -s "$MEDIA_URL" | grep "#EXTINF:" | tail -1
```

## Observations

### Strengths
✅ Industry-standard HLS protocol  
✅ Wide player compatibility  
✅ CDN-backed reliability  
✅ Rich metadata support  
✅ Efficient codec (HE-AAC v2)  
✅ HTTPS security  

### Limitations
⚠️ 15-30 second latency (inherent to HLS)  
⚠️ Session IDs expire (need periodic refresh)  
⚠️ Single bitrate (no adaptive streaming)  
⚠️ Requires HLS.js for Chrome/Firefox web playback  

### Use Cases
- Live radio streaming
- Mobile app integration
- Web player embedding
- Podcast/show recording
- Metadata extraction for scrobbling
- Analytics/monitoring

## Station Information

**KUTX 98.9 FM**
- Location: Austin, Texas
- Format: Music discovery, eclectic programming
- Parent: KUT Public Media
- Website: https://kutx.org/
- Owner: University of Texas at Austin

## Next Steps

### For Listening
1. Open `web_player.html` in a browser
2. Or use: `mpv https://streams.kut.org/4428/playlist.m3u8`

### For Development
1. Review `stream_analysis.md` for technical details
2. Use `monitor_stream.py` to understand metadata structure
3. Integrate using HLS.js (web) or native players (mobile)

### For Recording
1. Run `./download_stream.sh <duration>`
2. Recordings saved to `./recordings/` directory

## Resources

- **HLS Spec**: [RFC 8216](https://tools.ietf.org/html/rfc8216)
- **HLS.js**: [GitHub](https://github.com/video-dev/hls.js/)
- **Station**: [KUTX.org](https://kutx.org/)
- **AAC Codec**: [Wikipedia](https://en.wikipedia.org/wiki/High-Efficiency_Advanced_Audio_Coding)

---

**Analysis Date**: 2026-05-29  
**Stream Status**: ✅ Active and streaming  
**Last Verified**: 2026-05-29 20:48 UTC
