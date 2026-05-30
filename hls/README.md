# KUT/KUTX HLS Stream Analysis

This repository contains analysis and tools for working with the KUT/KUTX radio station HLS audio stream.

## 📻 Stream Information

- **Station**: KUTX Austin (Public Radio)
- **Master Playlist**: https://streams.kut.org/4428/playlist.m3u8
- **Format**: HLS (HTTP Live Streaming)
- **Audio Codec**: HE-AAC v2 (mp4a.40.29)
- **Bitrate**: 64 kbps
- **Type**: Live audio stream with metadata

## 📄 Files

### Documentation
- **[stream_analysis.md](stream_analysis.md)** - Comprehensive technical analysis of the HLS stream structure

### Tools
- **[monitor_stream.py](monitor_stream.py)** - Python script to monitor track metadata in real-time
- **[download_stream.sh](download_stream.sh)** - Bash script to download/record the stream

## 🚀 Quick Start

### Monitor Current Track
```bash
# Install dependencies
pip3 install requests

# Run the monitor
./monitor_stream.py

# With custom options
./monitor_stream.py --interval 5 --show-all
```

**Output Example**:
```
🎵 Monitoring HLS stream: https://streams.kut.org/4428/playlist.m3u8
Refresh interval: 10s
────────────────────────────────────────────────────────────────────────────────
🎶 [20:44:15] NOW PLAYING: No Brainer - Cure for Paranoia (3.9s)
📻 [20:44:25] Playlist Videos 1A and more at kutx.org - https://kutx.org/ (3.0s)
```

### Record Stream
```bash
# Record 60 seconds (default)
./download_stream.sh

# Record 5 minutes
./download_stream.sh 300

# Record 30 minutes
./download_stream.sh 1800
```

Recordings are saved to `./recordings/` with timestamp filenames.

### Web Player with Live Metadata

Open `web_player.html` in your browser for a beautiful player with:
- ✅ **Album artwork** - High-res cover art from iTunes API (600x600)
- ✅ **Live track metadata** - Artist and song title update automatically every 10s
- ✅ **Visual feedback** - Pulsing live indicator and update animations
- ✅ **Volume control** - Adjustable audio level
- ✅ **Modern UI** - Clean, responsive design
- ✅ **Console logging** - Track changes logged to browser console

**Features:**
- Album artwork fetched automatically from iTunes API
- Separates artist (purple) and title for easy reading
- Shows "Last updated at HH:MM:SS" timestamp
- Smooth fade animations when tracks change
- Shimmer loading effect while fetching artwork
- Purple glow effect during metadata updates
- Red pulsing dot when live
- 200x200px high-resolution artwork

**To use:**
```bash
# Just open in any browser
open web_player.html   # macOS
xdg-open web_player.html   # Linux
start web_player.html   # Windows
```

### Play Stream Directly

**ffplay (lightweight)**:
```bash
ffplay https://streams.kut.org/4428/playlist.m3u8
```

**mpv (feature-rich)**:
```bash
mpv https://streams.kut.org/4428/playlist.m3u8
```

**VLC**:
```bash
vlc https://streams.kut.org/4428/playlist.m3u8
```

## 🔍 Stream Analysis Highlights

### Master Playlist
```m3u8
#EXTM3U
#EXT-X-VERSION:6
#EXT-X-STREAM-INF:BANDWIDTH=64000,CODECS="mp4a.40.29"
https://das-edge55-sa49-pit01.cdnstream.com/4428_56.aac/playlist.m3u8?...
```

### Media Playlist Structure
- **Target Duration**: 5 seconds per segment
- **Live Stream**: No VOD, continuous live broadcast
- **Metadata**: Rich track info in EXTINF tags
- **Session Management**: Temporary session IDs

### Technical Specs
- **HLS Version**: 6 (RFC 8216 compliant)
- **Codec**: HE-AAC v2 (High-Efficiency AAC)
- **Sample Rate**: 44.1 kHz
- **Bitrate**: 64 kbps constant
- **CDN**: cdnstream.com with 10-minute segment caching

## 🛠️ Development

### Fetch Current Playlist
```bash
curl -s "https://streams.kut.org/4428/playlist.m3u8" | head -20
```

### Get Media Playlist URL
```bash
curl -sL "https://streams.kut.org/4428/playlist.m3u8" | grep "^https://"
```

### Extract Track Metadata
```bash
MEDIA_URL=$(curl -sL "https://streams.kut.org/4428/playlist.m3u8" | grep "^https://")
curl -s "$MEDIA_URL" | grep "^#EXTINF"
```

### Download Single Segment
```bash
# Get segment URL from playlist
MEDIA_URL=$(curl -sL "https://streams.kut.org/4428/playlist.m3u8" | grep "^https://")
SEGMENT_PATH=$(curl -s "$MEDIA_URL" | grep -m1 "^/" | tr -d '\r')
BASE_URL=$(echo "$MEDIA_URL" | cut -d'/' -f1-5)

# Download segment
curl "${BASE_URL}${SEGMENT_PATH}" -o segment.aac
```

### Analyze with ffprobe
```bash
ffprobe -v quiet -print_format json -show_format -show_streams segment.aac
```

## 📊 HLS Protocol Details

### Playlist Refresh Pattern
For live streams, clients should:
1. Fetch media playlist every 5-10 seconds
2. Look for new segments at the end
3. Download new segments as they appear
4. Maintain 2-3 segment buffer

### Session Management
- New session ID generated per connection
- Session IDs expire after period of inactivity
- On expiry, fetch new master playlist for fresh session

### Segment Naming
Segments are numbered sequentially (segment-7027, segment-7028...) but clients should not rely on numbering - always parse the playlist.

## 🔗 Compatibility

### Web Browsers
- **Native**: Safari (iOS/macOS)
- **HLS.js**: Chrome, Firefox, Edge (all platforms)
- **Video.js**: Alternative web player with HLS support

### Mobile
- **iOS**: AVPlayer (native)
- **Android**: ExoPlayer, Media3

### Desktop
- **VLC**: Cross-platform
- **mpv**: Cross-platform, lightweight
- **ffplay**: Part of ffmpeg suite

### Streaming Libraries
- **Python**: `streamlink`, `m3u8`, `requests`
- **JavaScript**: `hls.js`, `video.js`
- **Go**: `grafov/m3u8`, `aler9/gortsplib`

## 📚 Resources

### HLS Specification
- [RFC 8216 - HTTP Live Streaming](https://tools.ietf.org/html/rfc8216)
- [Apple HLS Authoring Guide](https://developer.apple.com/documentation/http_live_streaming)

### Audio Codec
- [HE-AAC Wikipedia](https://en.wikipedia.org/wiki/High-Efficiency_Advanced_Audio_Coding)
- [AAC Audio Formats](https://wiki.multimedia.cx/index.php/MPEG-4_Audio)

### Station
- [KUTX Website](https://kutx.org/)
- [KUT Website](https://www.kut.org/)

## 📝 Notes

- Stream has ~15-30 second latency (typical for HLS)
- Metadata includes artist, title, and promotional content
- CDN uses hash-based caching for efficient delivery
- Session IDs prevent unauthorized stream redistribution
- Segments are cached for 10 minutes on CDN edge servers

## ⚖️ License & Usage

This analysis is for educational and personal use. The audio stream is copyrighted by KUT/KUTX and subject to their terms of service.

For commercial use or redistribution, contact the station directly.

---

**Last Updated**: 2026-05-29  
**Stream Status**: ✅ Active and streaming
