# Audio Stream Player

A standalone HTML5 audio stream player with advanced codec detection and metadata extraction capabilities. This single-file application requires no dependencies or build process.

## Key Features

### Recent Improvements
- **VU Meters** - Vertical LED-style audio level meters for left and right channels with real-time animation
- **Album Artwork Display** - ID3 APIC frames with MusicBrainz API fallback for cover art
- **Rate Limit Protection** - Caches searched tracks and stops API queries after 3 consecutive failures to prevent rate limiting
- **Station & Genre Metadata** - Displays station name and genre from ICY headers and ID3 tags
- **FLAC Support** - Full lossless audio detection and parsing
- **Enhanced Bit Rate Logging** - Complete logging chain from detection to display
- **Smart Metadata Updates** - Uses most recent HLS segment for current track info
- **Better Error Handling** - Validates data before parsing, skips invalid segments
- **AudioCDN Optimization** - Detects AudioCDN streams, avoids expired segment fetches
- **Channel Validation** - Sanity checks correct surround sound misdetections to stereo for internet radio
- **Album Field Deduplication** - Hides album when it duplicates the track title
- **Default Volume** - Starts at 75% instead of 100%
- **Comprehensive Console Logs** - Detailed debugging information at every parsing stage

### Stream Support
- **HLS Streams** (`.m3u8`) - HTTP Live Streaming with master/media playlist navigation
- **Icecast/Shoutcast Streams** - ICY protocol support
- **Direct Audio Files** - MP3, AAC, and other formats

### Metadata Extraction
Multiple extraction methods for track information (title, artist, album, station, genre):
- **URL-Encoded Metadata** - Decodes base64 protobuf from segment URLs (AudioCDN/KNKX streams)
- **HLS ID3 Tags** - Parses ID3 metadata from HLS segments (TIT2, TPE1, TALB, TCON, APIC)
- **ICY Metadata** - Inline stream metadata blocks (where supported)
- **ICY Headers** - Station name and genre from HTTP response headers
- **API Polling** - SomaFM JSON API integration

### Album Artwork
Two-tier approach for displaying album cover art:
- **ID3 APIC Frames (Primary)** - Extracts embedded artwork from HLS stream segments
  - Parses APIC (Attached Picture) frames in ID3v2 tags
  - Converts to base64 data URLs for display
  - Works offline, most reliable for streams with embedded artwork
- **MusicBrainz API (Fallback)** - Queries Cover Art Archive when no embedded artwork
  - Searches MusicBrainz database using artist and title
  - Fetches 250px cover art images
  - Free service, no API key required
  - **Rate limit protection**:
    - Caches searched tracks to prevent duplicate API calls
    - Stops after 3 consecutive failures
    - Resets on success or new stream
    - Cache limited to 100 tracks

### Audio Detection
- **Codec Detection** - Automatically identifies MP3, AAC (LC, HE-AACv1, HE-AACv2, xHE-AAC), FLAC, and HLS
- **Bit Rate Detection** - From URL patterns, ICY headers, ID3 tags, or audio frame parsing
- **Channel Detection** - Mono/Stereo/Surround from URL hints, ICY headers, ID3 tags, or frame analysis
- **Smart Estimation** - Falls back to intelligent defaults when metadata unavailable

### User Interface
- Stream preset selector with quality options
- Custom URL input
- Volume control with visual slider (default 75%)
- Real-time stream information display (codec, channels, bit rate, buffer, duration)
- Now Playing metadata section with auto-updates every 5 seconds:
  - Album artwork (up to 200x200px)
  - Station name and genre
  - Track title, artist, and album
- VU Meters - Vertical LED-style audio level indicators:
  - Separate left and right channel displays
  - 20 LED bars per channel (bottom to top)
  - Color-coded levels: Green (safe) → Yellow (moderate) → Red (peaks)
  - 2x sensitivity for responsive feedback
  - Auto show/hide with playback state

## Usage

### Running the Application
```bash
open index.html
```

The file can be opened directly in any modern web browser (Chrome, Firefox, Safari, Edge). No server required.

### Testing Changes
Simply refresh the browser after editing `index.html`. Open the browser console (F12 → Console) to see detailed detection and metadata logs.

## Architecture

### Single-File Design
Everything (HTML, CSS, JavaScript) is contained in `index.html`:
- Eliminates build tooling complexity
- Makes the application completely portable
- Simplifies debugging with all code in one place

### Core Components

#### 1. Stream Type Detection & Parsing

**HLS Streams** (`.m3u8` URLs)
- Parses M3U8 manifests to find segments
- Handles master → media playlist navigation
- Extracts metadata from URL-encoded segment paths (AudioCDN)
- Parses ID3 metadata tags from segments when available
- Special handling for SomaFM streams via their JSON API

**Icecast/Shoutcast Streams** (ICY protocol)
- Requests `Icy-MetaData: 1` header
- Parses ICY headers: `icy-br`, `icy-channels`, `icy-metaint`
- Reads inline metadata blocks for current song info
- Note: Many modern CDN streams block custom headers via CORS

**Plain Audio Files** (MP3, AAC, FLAC)
- Direct audio frame parsing for codec information
- FLAC support for lossless audio streams

#### 2. Codec Detection Priority Chain

**Bit Rate:**
1. ID3 tags (`TXXX.adr`)
2. ICY headers (`icy-br`)
3. URL pattern extraction (`/64k/`, `/128k/`)
4. Parsed from audio frames (MP3 tables, AAC frame length calculation)
5. Smart estimation based on codec type

**Channels:**
1. ID3 tags (`TXXX.ach`) - with sanity checks for internet radio (≤2 channels)
2. ICY headers (`icy-channels`)
3. Parsed from audio frames (with consistency validation across multiple frames)
4. URL pattern extraction (`/mono/`, `/stereo/`)
5. Defaults to "Stereo (typical)" after 3 seconds if unknown

**Channel Validation:** Internet radio streams should only be mono (1) or stereo (2). Any channel count > 2 (surround sound configurations) is treated as a parsing error and corrected to stereo with a warning logged.

**Codec:**
1. ID3 tags (`TXXX.aot` or `TFLT`)
2. Content-Type header hints
3. URL hints (`/mp3`, `.aac`)
4. Audio frame signature detection (MP3 sync word 0xFFE, AAC ADTS sync word 0xFFF)

#### 3. Audio Frame Parsing

**MP3 and AAC parsers:**
- Search for sync words in the first 32KB of stream data (MP3: 0xFFE, AAC: 0xFFF)
- Analyze up to 5 frames for accuracy
- Validate consistency across frames (especially for channels)
- **Sanity checks for internet radio:** Channel counts > 2 are corrected to stereo (surround sound configs are parsing errors on radio streams)
- Round to common standard values
- Log warnings for inconsistencies or invalid values

**FLAC parser:**
- Detects FLAC marker ("fLaC")
- Parses STREAMINFO metadata block for:
  - Sample rate (up to 655,350 Hz)
  - Channels (1-8 channels)
  - Bits per sample (4-32 bits)
- Calculates uncompressed bit rate from audio parameters
- Note: FLAC is lossless; displayed bit rate is theoretical uncompressed rate

#### 4. URL-Encoded Metadata (AudioCDN/KNKX)

Some HLS providers encode metadata directly in segment URLs as base64-encoded protobuf:
- The player parses segment URLs from HLS playlists
- **Uses the most recent segment** (last in playlist) to get current track metadata
- Extracts base64 path segments (e.g., `Cg1TYW1ib3UgU2FtYm91EgxFbGlhbmUgRWxpYXM...`)
- Decodes as protobuf-like structure with field markers:
  - `0x0A` = Title
  - `0x12` = Artist
  - `0x4A` = Album
- Updates every 5 seconds when playlist refreshes with new segments
- Avoids 404 errors from expired segment URLs by not fetching them
- Automatically detects AudioCDN streams and skips segment fetch

**How Track Updates Work:**
Every 5 seconds, the player:
1. Fetches the updated HLS manifest (master or media playlist)
2. Navigates nested playlists (master → media) if needed
3. Collects all segment URLs in the media playlist
4. Selects the **LAST segment** (most recent, ~2-5 seconds old)
   - Earlier segments may have previous track metadata
   - Most recent segment has current track information
5. Extracts metadata from the segment URL path:
   - Identifies base64-encoded path segments (start with `Cg`, `Eg`, `Kg`, `Sg`)
   - Decodes protobuf-like structure with field markers
   - Maps fields: 0x0A=Title, 0x12=Artist, 0x4A=Album
6. Updates the "Now Playing" display with current track
7. Logs: "Found X segments, using most recent for metadata"

This ensures track information stays current as songs change, typically with 2-5 second latency from actual broadcast.

#### 5. VU Meters (Audio Level Visualization)

**Web Audio API Implementation:**
- Uses `AnalyserNode` to extract frequency data from audio stream
- Channel splitter separates stereo audio into left and right
- Dual analysers process each channel independently
- Frequency data averaged and mapped to 20 LED bars per channel
- Runs at 60fps via `requestAnimationFrame`

**Audio Pipeline:**
```
Audio Element → MediaElementSource → ChannelSplitter → [Left Analyser, Right Analyser] → ChannelMerger → Destination (Speakers)
```

**Visual Design:**
- Vertical bars (200px height, 40px width per channel)
- Bottom 12 bars: Green (#27ae60) - safe levels
- Middle 5 bars: Yellow (#f39c12) - moderate levels
- Top 3 bars: Red (#e74c3c) - peak levels
- Inactive bars show dim (30% opacity), active bars bright (100% opacity)
- 2x sensitivity multiplier for responsive visual feedback

**CORS Requirement:**
- Audio element uses `crossorigin="anonymous"` attribute
- Required for Web Audio API to analyze cross-origin streams
- Radio Paradise and other CORS-enabled streams work properly
- Streams without CORS headers will play but VU meters show zeros

#### 6. Error Handling & Data Validation

**CORS Handling:**
- Gracefully handles CORS restrictions on ICY metadata headers
- Detects fetch failures (`Failed to fetch`) and stops retrying to avoid console spam
- Logs once: "Metadata fetch blocked (CORS restriction)"
- Resets retry flag (`metadataFetchFailed`) when loading new streams
- Stream continues playing even when metadata is blocked

**Data Validation:**
- **Manifest Detection**: Checks if fetched data is text (manifest) vs binary (audio)
  - Scans for `#EXTM3U`, `#EXT-X-` markers in first 100 bytes
  - Skips audio parsing if manifest detected
- **Buffer Size**: Rejects buffers < 100 bytes as too small for real audio
- **Bit Rate Validation**: 
  - AAC: 8-500 kbps range, rejects wild values (>500 or <8)
  - MP3: Uses lookup tables, validates against MPEG version/layer
  - FLAC: Calculates from parameters, logs uncompressed rate
  - Logs all invalid values for debugging
- **Channel Consistency**: Analyzes 5 frames, warns if channels don't match
- **Standard Deviation**: Calculates variance for AAC bit rates, warns if >20%
- **AudioCDN Detection**: Identifies `cdnstream.com` URLs, skips segment fetch (metadata in URL only)

## Preset Streams

Default presets configured (all use HTTPS for compatibility with secure hosting):
- **Radio Paradise - Main Mix (FLAC)** - Direct FLAC stream with ICY metadata, album artwork via API (default)
- **Radio Paradise - Rock Mix (FLAC)** - Direct FLAC stream with ICY metadata, album artwork via API
- **Radio Paradise - Beyond (FLAC)** - Direct FLAC stream with ICY metadata, album artwork via API
- **KNKX 88.5 FM (HLS/48k)** - AudioCDN HLS stream with URL-encoded metadata, 48 kbps AAC
- **KNKX 88.5 FM (HLS/256k)** - AudioCDN HLS stream with URL-encoded metadata, 256 kbps AAC high quality
- **SomaFM - Groove Salad (AAC 64k)** - HLS stream with ID3 tags and JSON metadata API, 64 kbps AAC
- **SomaFM - Groove Salad (FLAC)** - HLS stream with lossless FLAC audio and JSON metadata API

When adding new presets, test that codec/metadata detection works correctly for that stream type.

## Technical Highlights

### Multi-Source Detection Strategy
The player uses a **priority chain** to detect stream properties, trying multiple sources in order of reliability:

**Bit Rate Priority:**
1. ID3 tags (most reliable for HLS)
2. ICY headers (most reliable for Icecast/Shoutcast)
3. URL patterns (often accurate, e.g., `/64k/`)
4. Audio frame parsing (MP3 lookup tables, AAC calculation)
5. Intelligent estimation (codec-based fallback)

**Metadata Priority:**
1. URL-encoded protobuf (AudioCDN/KNKX)
2. HLS ID3 tags (embedded in segments)
3. ICY metadata blocks (inline stream data)
4. API polling (SomaFM JSON endpoint)

**Album Artwork Priority:**
1. ID3 APIC frames (embedded in HLS segments)
2. MusicBrainz Cover Art Archive (external API fallback)

### Robust Parsing with Validation
- **Multi-Frame Analysis**: Parses 5 frames for MP3/AAC, validates consistency
- **Statistical Analysis**: Calculates standard deviation for AAC bit rates
- **Data Type Detection**: Distinguishes text (manifests) from binary (audio)
- **Error Recovery**: Gracefully handles invalid data, logs but continues
- **Smart Defaults**: Falls back to typical values (stereo, common bit rates)

### Performance Optimizations
- **AudioCDN Detection**: Skips segment fetch when metadata is in URL
- **Cached Results**: Avoids re-parsing when values already detected
- **Minimal Fetches**: Range requests (0-8KB) instead of full segments
- **Lazy Parsing**: Only parses what's needed based on URL/content-type hints

## Technical Details

### Web Audio API for VU Meters
The VU meters use Web Audio API with a carefully designed audio pipeline:
- `MediaElementSource` connects to both analysers AND the audio destination via `ChannelSplitter` and `ChannelMerger`
- `ChannelSplitter` separates stereo audio into left and right channels
- Two `AnalyserNode` instances process each channel independently for real-time frequency analysis
- `ChannelMerger` recombines audio for speaker output
- This allows real-time visualization without interrupting audio playback
- Requires `crossorigin="anonymous"` attribute on the audio element for CORS-enabled streams

**Note:** Channel detection for codec information relies on ICY/ID3 tags and frame parsing, not Web Audio API, to avoid the audio disconnection issue found in early versions.

### URL Pattern Heuristics
The player extracts hints from URL patterns:
- **Bit rate**: `/64k/`, `/128k/`, `_48k`, `-96k` (8-500 kbps range)
- **Channels**: `/mono/`, `/stereo/`, `-mono`, `_stereo`

These URL hints are used when ICY/ID3 metadata or frame parsing doesn't provide the information.

### Format Detection Order
MP3 vs AAC detection uses URL/content-type hints first:
- URLs containing `/mp3` → try MP3 parser first
- URLs containing `/aac` → try AAC parser first
- Fallback: try both, prefer MP3 if both match (more common)

This prevents false positives from sync word pattern matching.

### Console Logging
Comprehensive `console.log()` statements throughout for debugging:
- **HTTP Headers** - All response headers from stream requests
- **Codec Detection** - Format hints, detected codecs with source attribution
- **Frame Parsing** - Individual frame analysis for MP3/AAC/FLAC with detailed parameters
- **Bit Rate Calculation** - Every bit rate parse attempt with source and intermediate values:
  - URL pattern extraction
  - ICY headers (HEAD and GET responses)
  - ID3 tags
  - Per-frame calculations (MP3, AAC)
  - Average calculations across multiple frames
  - Standard deviation for AAC (variance detection)
  - FLAC uncompressed rate estimation
  - Final display value with source attribution
- **Metadata Extraction** - URL-encoded protobuf decoding, ID3 parsing, ICY metadata, station/genre
- **Album Artwork** - APIC frame parsing, MusicBrainz API searches, cache hits/misses, artwork display source
- **VU Meters** - Web Audio API initialization, stereo channel splitting, real-time level analysis per channel
- **Validation Warnings** - Channel inconsistencies, invalid bit rates, parsing failures, album deduplication
- **HLS Manifest** - Playlist parsing, segment selection, nested manifest detection

Keep these logs when making changes - they're essential for diagnosing stream compatibility issues and understanding detection priority chains.

## Debugging Tips

1. **Open browser console (F12 → Console)** before loading any stream
2. **Stream Detection:**
   - Look for "Detected HLS stream from URL/content-type" for HLS
   - Check "Format hints - MP3: X AAC: Y" to see codec detection strategy
3. **Bit Rate Debugging:**
   - Follow the complete chain: URL extraction → ICY headers → ID3 tags → Frame parsing
   - MP3: "MP3 frame 1: bitRate=X kbps..." for each frame + "MP3 average bit rate: X kbps"
   - AAC: "Calculated AAC bit rate from frame: X kbps (frameLength: Y sampleRate: Z)"
   - FLAC: "Calculated FLAC uncompressed bit rate: X kbps"
   - Final: "Set bitrate: X kbps (from URL/parsed/estimated)"
4. **Channel Detection:**
   - Look for "Set channels: Stereo/Mono" to see final value
   - Check "Channel count inconsistent across frames" warnings
   - "AAC reports X channels - unusual for internet radio, likely stereo" = surround sound config corrected
   - "ID3 reports X channels - unusual for internet radio, likely stereo" = ID3 tag sanity check triggered
   - "AAC ADTS channel config: X → Y channels" shows raw ADTS header decoding
5. **HLS Streams:**
   - URL-encoded metadata: "Found X segments, using most recent for metadata"
   - Segment parsing: "Parsing HLS segment, size: X bytes"
   - Detection: "Detected AAC/MP3/FLAC from segment - channels: X bitRate: Y kbps"
   - Manifests: "Segment appears to be another manifest" if nested playlist detected
6. **Metadata Extraction:**
   - URL-encoded: "Trying to decode segment: CgXXX..." → "Successfully extracted metadata"
   - ICY: "ICY Headers: {name, genre, bitrate, channels}" from stream responses
   - ID3: "Using ID3 bit rate: X kbps (most reliable)"
7. **Error Handling:**
   - CORS: "Metadata fetch blocked (CORS restriction)" - stream plays, no metadata access
   - Invalid data: "AAC bit rate outside valid range" - parser rejecting bad values
   - Segment expiry: "Segment not available (expired or moved)" - HLS segments expire quickly
8. **Album Artwork:**
   - "Found APIC artwork, type: X MIME: image/jpeg size: Y bytes" - embedded ID3 artwork
   - "Searching for artwork via MusicBrainz API: Artist - Title" - API search started
   - "Artwork already searched for this track, skipping API call" - cache hit, preventing duplicate query
   - "Found artwork from Cover Art Archive" - API returned artwork
   - "Displaying ID3 album artwork" / "Displaying artwork from API" - artwork source
   - "Artwork API failures: X/3" - failure counter tracking
   - "Artwork API disabled after 3 consecutive failures (rate limit protection)" - API queries stopped
   - "Artwork cache size limit reached, removing oldest entry" - cache at 100 track limit
9. **Station and Genre:**
   - "Station name (ICY): ..." / "Genre (ICY): ..." - from ICY headers
   - "Genre (ID3): ..." - from ID3 TCON tags
10. **VU Meters:**
   - "Created 20 VU meter bars for left and right channels" - bars initialized
   - "Stereo audio pipeline connected: source → splitter → [analysers + merger] → destination" - Web Audio API setup
   - "VU frame 0 - L: 85.1 (12 bars) R: 83.2 (11 bars)" - per-channel levels and active bars
   - "MediaElementAudioSource outputs zeroes due to CORS access restrictions" - stream lacks CORS headers, VU meters won't work
11. **Validation Warnings:**
   - "High variance in AAC bit rate calculation - may be unreliable"
   - "Only X/Y frames had valid bit rates" - some AAC frames failed calculation
   - "Album matches title, displaying as unknown" - stream duplicates title in album field

## Known Limitations

- **Mixed Content Blocking**: When hosted on HTTPS (e.g., GitHub Pages), HTTP stream URLs will be blocked by browsers
  - All preset streams use HTTPS to avoid this issue
  - Custom HTTP URLs will not work on HTTPS-hosted sites
  - Solution: Use HTTPS stream URLs or host on HTTP (local testing)
- **VU Meter CORS Requirement**: VU meters require CORS-enabled audio streams
  - Audio element uses `crossorigin="anonymous"` to enable Web Audio API analysis
  - Streams without proper CORS headers will play audio but VU meters show zero
  - All preset streams support CORS and VU meters work correctly
  - Console warning: "MediaElementAudioSource outputs zeroes due to CORS access restrictions"
- **AAC Bit Rate Calculation**: Frame-based calculation can be noisy/unreliable
  - Standard deviation logged to help identify variance issues
  - Falls back to URL/ICY/ID3 sources when available
- **CORS Restrictions**: Many modern CDN streams block `Icy-MetaData` custom header
  - JavaScript can't access metadata even though stream plays fine
  - AudioCDN/KNKX use URL-encoded metadata as workaround
- **HLS Segment Expiry**: Segment URLs expire quickly (typical 404 errors)
  - URL-encoded metadata extraction avoids needing to fetch segments
  - AudioCDN streams automatically skip segment fetch
- **Channel Detection Accuracy**: Frame-based detection can be inconsistent
  - **Sanity checks**: Internet radio should only be mono/stereo - any channel count > 2 is corrected to stereo
  - Some streams incorrectly report surround sound configurations (5.1, 7.1) in AAC ADTS headers or ID3 tags
  - ICY headers, ID3 tags, and URL hints preferred
  - Multi-frame validation with consistency checks
  - Logs warnings when channels don't match across frames
- **Album Field Duplication**: Some streams duplicate the track title in the album field
  - Player detects when album matches title and displays "--" instead
  - Common with radio streams that don't have actual album information
  - Applies to all metadata sources (ID3, ICY, URL-encoded, SomaFM API)
- **FLAC Bit Rate**: Displayed value is uncompressed theoretical rate
  - Actual compressed stream rate varies (lossless compression)
  - Calculated from sample rate × channels × bits per sample
- **Album Artwork API**: MusicBrainz API fallback requires internet connectivity
  - Artwork lookup may fail if artist/title metadata is inaccurate
  - Some tracks may not be in MusicBrainz database
  - **Rate limit protection**:
    - Each track (artist:title combination) is only searched once per session
    - Stops queries after 3 consecutive failures
    - Cache and failure counter reset when loading a new stream
    - Cache limited to 100 tracks (oldest evicted first)
  - API queries are logged but failures don't affect playback
  - Embedded ID3 APIC artwork preferred when available (works offline)

## Project Structure

```
audio-play/
├── index.html          # Complete application (HTML + CSS + JavaScript)
├── CLAUDE.md           # Developer guidance for Claude Code
└── README.md           # This file
```

## License

This project is a demonstration/educational tool for audio stream handling and metadata extraction.
