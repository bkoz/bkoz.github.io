# HLS Audio Stream Analysis
## Stream: https://streams.kut.org/4428/playlist.m3u8

---

## Overview
**Broadcaster**: KUT/KUTX (Austin, TX public radio station)  
**Stream Type**: Live audio-only HLS stream  
**Purpose**: Continuous radio broadcast with track metadata

---

## Master Playlist Structure

### Basic Information
- **HLS Protocol Version**: 6
- **Format**: `#EXTM3U` standard
- **Variants**: Single audio-only variant stream
- **Adaptive**: No (single bitrate)

### Stream Variant
```
#EXT-X-STREAM-INF:BANDWIDTH=64000,CODECS="mp4a.40.29"
https://das-edge55-sa49-pit01.cdnstream.com/4428_56.aac/playlist.m3u8
```

**Details**:
- **Bandwidth**: 64,000 bits/second (64 kbps)
- **Codec**: `mp4a.40.29` (HE-AAC v2 / AAC-HE)
- **CDN**: cdnstream.com edge network (Pittsburgh POP)

---

## Media Playlist Characteristics

### Header Configuration
```
#EXTM3U
#EXT-X-TARGETDURATION:5
#EXT-X-VERSION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-DISCONTINUITY-SEQUENCE:0
```

### Key Parameters
- **Target Duration**: 5 seconds (maximum segment duration)
- **HLS Version**: 6
- **Media Sequence**: Starts at 0, increments with each segment
- **Discontinuity Sequence**: 0 (tracks playlist discontinuities)
- **Playlist Type**: Live (no `#EXT-X-ENDLIST` tag)

### Segment Pattern
- **Duration**: Variable (~3-5 seconds per segment)
  - Example durations: 3.994s, 3.019s, 5.016s
- **Format**: AAC audio segments (.aac)
- **Naming**: Sequential (segment-7027, segment-7028, segment-7029...)
- **Cache TTL**: 600 seconds (10 minutes)

---

## Audio Codec Details

### AAC-HE v2 (mp4a.40.29)
- **Full Name**: High-Efficiency Advanced Audio Coding version 2
- **Profile**: Designed for low-bitrate streaming
- **Typical Sample Rate**: 44.1 kHz (standard for audio)
- **Channels**: Likely stereo with SBR (Spectral Band Replication)
- **Optimization**: Uses Parametric Stereo (PS) for efficient stereo encoding

### Bitrate Analysis
- **Target**: 64 kbps constant
- **Quality**: Good for talk radio/music at this codec
- **Efficiency**: HE-AAC v2 delivers quality comparable to 96-128 kbps MP3

---

## Metadata & Track Information

### EXTINF Tag Structure
Each segment includes rich metadata in the EXTINF tag:

**Example 1 - Music Track**:
```
#EXTINF:3.99383,No Brainer - Cure for Paranoia
```

**Example 2 - Station Promo**:
```
#EXTINF:3.01859,Playlist Videos 1A and more at kutx.org - https://kutx.org/
```

**Components**:
- Duration in seconds (decimal precision)
- Artist/Source
- Track/Description
- URL (for promos/links)

### Metadata Encoding
Segment URLs contain base64-encoded metadata including:
- Track title
- Artist name
- Timestamps
- Content ID (UUID format)
- Sample rate (44100)
- Codec identifier
- Sequence information

---

## Session Management

### Listening Session IDs
- **Purpose**: Track unique listener sessions
- **Format**: Base64-encoded session tokens
- **Example**: `TEpONUlPR0tORE5KUEpVUzU0TU5KVlpZR1VfZGFzLWVkZ2U1NS1zYTQ5LXBpdDAxLmNkbnN0cmVhbS5jb206ODE4Ng..`
- **Scope**: Appended to both playlist and segment URLs
- **Expiry**: Sessions appear to have time-limited validity

### URL Parameters
- `listeningSessionId`: Unique session identifier
- `listeningDownloadId`: Download tracking (0 for streaming)
- `bitrate`: Requested bitrate (64)
- `codec`: Codec identifier (mp4a.40.29)

---

## CDN & Delivery Infrastructure

### Edge Network
- **Provider**: cdnstream.com
- **Edge Server**: das-edge55-sa49-pit01
- **Location**: Pittsburgh data center (pit01)
- **Protocol**: HTTPS

### Caching Strategy
- **Segment Cache**: TTL=600s (10 minutes)
- **Storage Path**: `/var/cache/das/audio/livestream/content/`
- **Content Addressing**: Hash-based paths for deduplication
- **Unique ID**: `UR43PD4NP5GNJOUQMQJE7Z2QVM` (content identifier)

---

## Stream Behavior

### Live Streaming Characteristics
1. **No VOD markers**: Missing `#EXT-X-ENDLIST` indicates live stream
2. **Rolling window**: Playlist maintains recent segments only
3. **Continuous updates**: Playlist refreshed periodically with new segments
4. **Segment aging**: Old segments expire from playlist as new ones arrive

### Playback Flow
1. Client fetches master playlist from `streams.kut.org`
2. Master redirects to media playlist on CDN edge
3. Media playlist provides current segment list (~15-20 segments)
4. Client downloads segments sequentially
5. Client periodically refreshes playlist for new segments

---

## Standards Compliance

### HLS Specification
- **Version**: 6 (RFC 8216 / Apple HLS)
- **Compliance**: Full compliance with HLS audio-only streams
- **Compatibility**: Works with:
  - iOS/macOS native players
  - Android ExoPlayer
  - Video.js, HLS.js (web)
  - VLC, ffmpeg (desktop)

### Audio Standards
- **Container**: MPEG-4 Part 14 (.aac / .m4a)
- **Audio Codec**: ISO/IEC 14496-3 (MPEG-4 Audio)
- **Profile**: HE-AAC v2 (mp4a.40.29)

---

## Observations & Notes

### Station Identity
- **Call Sign**: KUTX
- **Location**: Austin, Texas
- **Type**: Public radio (music station)
- **Website**: https://kutx.org/

### Content Mix
Based on observed metadata:
- Music tracks with artist/title
- Station promos and announcements
- Links to web content (playlists, videos)

### Technical Quality
- **Reliability**: CDN-backed with geo-distributed edge servers
- **Latency**: ~15-30 seconds behind live (typical for HLS)
- **Quality**: Good audio quality for 64kbps using HE-AAC v2
- **Metadata**: Rich track information for display/scrobbling

---

## Sample URLs

### Master Playlist
```
https://streams.kut.org/4428/playlist.m3u8
```

### Media Playlist (example session)
```
https://das-edge55-sa49-pit01.cdnstream.com/4428_56.aac/playlist.m3u8?listeningSessionId=...
```

### Segment URL Structure
```
https://das-edge55-sa49-pit01.cdnstream.com/[base64-path]/file/[cache-path]/segment-XXXX.aac?listeningSessionId=...
```

---

## Integration Recommendations

### For Developers
1. **Session handling**: Generate new session ID per playback instance
2. **Polling interval**: Refresh playlist every 5-10 seconds
3. **Buffer**: Maintain 2-3 segment buffer for smooth playback
4. **Metadata extraction**: Parse EXTINF tags for track display
5. **Error handling**: Implement 404 retry with exponential backoff

### For Players
- Use HLS.js for web browsers
- Use AVPlayer (iOS) or ExoPlayer (Android) for mobile
- Use ffmpeg/mpv for command-line playback
- All major players support HE-AAC v2 natively
