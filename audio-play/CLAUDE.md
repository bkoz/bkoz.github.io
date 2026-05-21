# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a standalone HTML5 audio stream player with advanced codec detection and metadata extraction capabilities. The entire application is contained in a single `index.html` file with no dependencies or build process.

## Usage

**To run the application:**
```bash
open index.html
```

The file can be opened directly in any modern web browser (Chrome, Firefox, Safari, Edge).

**To test changes:**
Simply refresh the browser after editing `index.html`. Open the browser console (F12 → Console) to see detailed detection and metadata logs.

## Architecture

### Single-File Design
Everything (HTML, CSS, JavaScript) is in `index.html`. This design choice:
- Eliminates build tooling complexity
- Makes the application completely portable
- Simplifies debugging with all code in one place

### Core Components

**1. Stream Type Detection & Parsing**
The player automatically detects and handles three stream types:

- **HLS Streams** (`.m3u8` URLs)
  - Parses M3U8 manifests to find segments
  - Extracts ID3 metadata tags from segments (artist, title, album, technical data)
  - Special handling for SomaFM streams via their JSON API
  
- **Icecast/Shoutcast Streams** (ICY protocol)
  - Requests `Icy-MetaData: 1` header
  - Parses ICY headers: `icy-br`, `icy-channels`, `icy-metaint`
  - Reads inline metadata blocks for current song info
  - Note: Many modern CDN streams block custom headers via CORS
  
- **Plain Audio Files** (MP3, AAC, FLAC)
  - Direct audio frame parsing for codec info
  - FLAC support for lossless audio streams

**2. Codec Detection Priority Chain**

The player attempts multiple detection methods in priority order:

For **Bit Rate**:
1. ID3 tags (`TXXX.adr`)
2. ICY headers (`icy-br`)
3. URL pattern extraction (`/64k/`, `/128k/`)
4. Parsed from audio frames (MP3 tables, AAC frame length calculation)
5. Smart estimation based on codec type

For **Channels**:
1. ID3 tags (`TXXX.ach`) - with sanity checks for internet radio (≤2 channels)
2. ICY headers (`icy-channels`)
3. Parsed from audio frames (with consistency validation across multiple frames)
4. URL pattern extraction (`/mono/`, `/stereo/`)
5. Defaults to "Stereo (typical)" after 3 seconds if unknown

**Channel Validation**: Internet radio streams should only be mono (1) or stereo (2). Any channel count > 2 (surround sound configurations) is treated as a parsing error and corrected to stereo with a warning logged.

For **Codec**:
1. ID3 tags (`TXXX.aot` or `TFLT`)
2. Content-Type header hints
3. URL hints (`/mp3`, `.aac`)
4. Audio frame signature detection (MP3 sync word 0xFFE, AAC ADTS sync word 0xFFF)

**3. Audio Frame Parsing**

MP3 and AAC parsers:
- Search for sync words in the first 32KB of stream data (MP3: 0xFFE, AAC ADTS: 0xFFF)
- Analyze up to 5 frames for accuracy
- Validate consistency across frames (especially for channels)
- **Sanity checks for internet radio**: Channel counts > 2 are corrected to stereo (surround sound configs are parsing errors on radio streams)
- Round to common standard values
- Log warnings for inconsistencies or invalid values

FLAC parser:
- Detects FLAC marker ("fLaC") 
- Parses STREAMINFO metadata block for sample rate, channels, and bits per sample
- Calculates uncompressed bit rate (lossless compression means variable compressed rate)

**4. Metadata Extraction**

Multiple extraction paths for track information (title, artist, album, station, genre):
- **HLS URL-Encoded Metadata**: AudioCDN/KNKX streams encode metadata as base64 protobuf in segment URLs
- **HLS ID3 Tags**: Text track cuechange events with ID3 frame parsing (TIT2, TPE1, TALB, TCON)
- **ICY Metadata**: Inline stream metadata blocks parsed at `icy-metaint` intervals
- **ICY Headers**: Station name (`icy-name`) and genre (`icy-genre`) from HTTP headers
- **API Polling**: SomaFM JSON API for song metadata (special case)

Updates every 5 seconds to catch song changes.

**5. Album Artwork**

Album artwork is displayed using a two-tier approach:
- **ID3 APIC Frames (Primary)**: Extracts embedded artwork from HLS stream segments
  - Parses APIC (Attached Picture) frames in ID3v2 tags
  - Converts binary image data to base64 data URLs
  - Works offline, most reliable for streams that include it (SomaFM, some HLS)
- **MusicBrainz API (Fallback)**: Queries external services when embedded artwork not found
  - Searches MusicBrainz database using artist + title metadata
  - Fetches 250px cover art from Cover Art Archive
  - Free, no API key required
  - Used for Radio Paradise, KNKX, and streams without embedded artwork
  - **Rate limit protection**:
    - Caches searched tracks (artist:title) to prevent duplicate API calls
    - Stops queries after 3 consecutive failures
    - Resets on success or new stream
    - Cache limited to 100 tracks (FIFO eviction)

## Important Implementation Details

### Web Audio API Removed
Early versions used `MediaElementSource` for channel detection, but this **disconnected the audio element from browser output**, causing no sound in Chrome. The audio now plays through the default browser path. Channel detection relies on ICY/ID3 tags and frame parsing instead.

### URL-Encoded Metadata (AudioCDN/KNKX)
Some HLS providers (like AudioCDN used by KNKX) encode metadata directly in segment URLs as base64-encoded protobuf:
- The player parses segment URLs from HLS playlists
- **Uses the LAST segment** (most recent) from the playlist for current track info
- Extracts base64 path segments (e.g., `Cg1TYW1ib3UgU2FtYm91EgxFbGlhbmUgRWxpYXM...`)
- Filters segments: min 30 chars, must start with protobuf markers (`Cg`, `Eg`, `Kg`, `Sg`)
- Skips cache IDs (all uppercase), known paths (`file`, `var`, `cache`), segment files
- Decodes as protobuf-like structure with field markers:
  - `0x0A` = Title
  - `0x12` = Artist
  - `0x4A` = Album
- Updates every 5 seconds when playlist refreshes
- Avoids 404 errors from expired segment URLs by not fetching them
- Automatically detects AudioCDN streams (`cdnstream.com`) and skips segment fetch

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

### Preset Streams
Default presets configured:
- **Radio Paradise - Main Mix (FLAC)**: Direct FLAC stream with ICY metadata, album artwork via API (default)
- **Radio Paradise - Rock Mix (FLAC)**: Direct FLAC stream with ICY metadata, album artwork via API
- **Radio Paradise - Beyond (FLAC)**: Direct FLAC stream with ICY metadata, album artwork via API
- **KNKX 88.5 FM (HLS/48k)**: AudioCDN HLS stream with URL-encoded metadata, 48 kbps AAC
- **KNKX 88.5 FM (HLS/256k)**: AudioCDN HLS stream with URL-encoded metadata, 256 kbps AAC high quality
- **SomaFM Groove Salad (AAC 64k)**: HLS stream with ID3 tags and JSON metadata API, 64 kbps AAC
- **SomaFM Groove Salad (FLAC)**: HLS stream with lossless FLAC audio and JSON metadata API

When adding new presets, test that codec/metadata detection works correctly for that stream type.

### Console Logging
Comprehensive `console.log()` statements throughout for debugging:
- **HTTP Headers**: All response headers from stream requests
- **Codec Detection**: Format hints, detected codecs with source attribution
- **Frame Parsing**: Individual frame analysis (MP3/AAC/FLAC) with detailed parameters
- **Bit Rate Calculation**: Every parse attempt with source and intermediate values:
  - URL pattern extraction with matched pattern
  - ICY headers from HEAD and GET responses
  - ID3 tags (TXXX.adr)
  - Per-frame calculations for MP3 and AAC with frame details
  - Average calculations across multiple frames
  - Standard deviation for AAC variance detection
  - FLAC uncompressed rate estimation from sample rate/channels/bits
  - Final display value with source attribution (URL/parsed/estimated)
- **Metadata Extraction**: URL-encoded protobuf decoding, ID3 parsing, ICY metadata blocks, station/genre
- **Album Artwork**: APIC frame parsing, MusicBrainz API searches, cache hits/misses, artwork display
- **Validation Warnings**: Channel inconsistencies, invalid bit rates, parsing failures
- **HLS Manifest**: Playlist parsing, segment selection (most recent), nested manifest detection

Keep these logs when making changes - they're essential for diagnosing stream compatibility issues and understanding the detection priority chain.

## Common Modifications

**Adding a new preset stream:**
Add to the `<select id="streamPreset">` options in HTML and ensure URL is valid.

**Adjusting codec detection:**
Modify `detectAudioFormat()` function. Test with multiple stream types after changes.

**Changing metadata update frequency:**
Adjust interval in `startMetadataMonitoring()` (currently 5000ms).

**Modifying bit rate rounding:**
Update `commonBitRates` array in `detectAudioFormat()`.

## Debugging Tips

1. **Open browser console (F12 → Console)** before loading any stream to see detailed detection logs
2. **Follow the bit rate detection chain** (logged at every step):
   - URL extraction: "Extracted bit rate from URL with pattern X: Y kbps"
   - ICY headers: "Using ICY bit rate: X kbps (most reliable)"
   - ID3 tags: "Using ID3 bit rate: X kbps (most reliable)"
   - MP3 frames: "MP3 frame N: bitRate=X kbps..." then "MP3 average bit rate: X kbps"
   - AAC frames: "Calculated AAC bit rate from frame: X kbps" then "Average bit rate from AAC frames: X kbps"
   - FLAC: "Calculated FLAC uncompressed bit rate: X kbps"
   - Final value: "Set bitrate: X kbps (from URL/parsed/estimated)"
3. **For HLS streams with URL-encoded metadata (AudioCDN/KNKX)**:
   - Look for "Found X segments, using most recent for metadata"
   - Check "Trying to decode segment: CgXXX..." for base64 protobuf decoding
   - Verify "Successfully extracted metadata: {title, artist, album}"
   - Updates every 5 seconds with new segments from refreshed playlist
4. **For HLS streams with ID3** (SomaFM):
   - Check for tag detection in cuechange events
   - Look for "Detected AAC/MP3/FLAC from segment - channels: X bitRate: Y kbps"
5. **For ICY streams** (Icecast/Shoutcast):
   - Verify "ICY Headers: {name, genre, metaint, bitrate, channels}" shows metadata support
   - If CORS blocked: "Metadata fetch blocked (CORS restriction)" - stream plays but no metadata
6. **Channel detection validation**:
   - "Set channels: Stereo/Mono" shows final value
   - "Channel count inconsistent across frames" warns of parsing issues
   - "AAC reports X channels - unusual for internet radio, likely stereo" = surround sound config corrected
   - "ID3 reports X channels - unusual for internet radio, likely stereo" = ID3 tag sanity check triggered
   - "AAC ADTS channel config: X → Y channels" shows raw ADTS header decoding
7. **Album artwork**:
   - "Found APIC artwork, type: X MIME: image/jpeg size: Y bytes" = embedded ID3 artwork found
   - "Searching for artwork via MusicBrainz API: Artist - Title" = API fallback search
   - "Artwork already searched for this track, skipping API call" = cache hit, preventing duplicate query
   - "Found artwork from Cover Art Archive" = API successfully returned artwork
   - "Displaying ID3 album artwork" / "Displaying artwork from API" = source of displayed artwork
   - "Artwork API failures: X/3" = failure counter tracking for rate limit protection
   - "Artwork API disabled after 3 consecutive failures (rate limit protection)" = API queries stopped
   - "Artwork cache size limit reached, removing oldest entry" = cache at 100 track limit
8. **Station and genre metadata**:
   - "Station name (ICY): ..." / "Genre (ICY): ..." = from ICY headers
   - "Genre (ID3): ..." / "Genre (ID3 TCON): ..." = from ID3 tags
9. **Common warnings and their meaning**:
   - "AAC bit rate outside valid range (8-500 kbps) - ignoring" = invalid data, not real AAC
   - "High variance in AAC bit rate calculation - may be unreliable" = inconsistent frame data
   - "Segment appears to be another manifest, not audio data" = nested HLS playlist detected
   - "Segment not available (expired or moved)" = HLS segment expired (normal)
   - "Album matches title, displaying as unknown" = stream duplicates title in album field

## Known Limitations

- **AAC Bit Rate Calculation**: Frame-based calculation can be noisy/unreliable due to variable frame lengths
  - Standard deviation is calculated and logged to identify high variance
  - Falls back to URL patterns, ICY headers, or ID3 tags when available
- **CORS Restrictions**: Many modern CDN streams block `Icy-MetaData` custom header via CORS policy
  - JavaScript cannot access metadata even though browser plays stream fine
  - AudioCDN/KNKX streams use URL-encoded metadata as workaround
  - Player detects CORS failures and stops retrying to avoid console spam
- **HLS Segment Expiry**: Segment URLs expire quickly (typical 404 errors after ~10 seconds)
  - URL-encoded metadata extraction reads from playlist URLs directly, avoiding segment fetch
  - AudioCDN streams (`cdnstream.com`) automatically skip segment fetch
- **Channel Detection Accuracy**: Audio frame-based detection can be inconsistent across frames
  - Parser validates consistency by comparing 5 frames, logs warnings on mismatch
  - **Sanity checks**: Internet radio should only be mono/stereo - any channel count > 2 is corrected to stereo
  - Some streams incorrectly report surround sound configurations (5.1, 7.1) in AAC ADTS headers or ID3 tags
  - ICY headers (`icy-channels`), ID3 tags (`TXXX.ach`), and URL hints preferred
  - Falls back to "Stereo (typical)" after 3 seconds if unknown
- **Album Field Duplication**: Some streams duplicate the track title in the album field
  - Player detects when album matches title and displays "--" instead
  - Common with radio streams that don't have actual album information
  - Applies to all metadata sources (ID3, ICY, URL-encoded, SomaFM API)
- **Album Artwork API Rate Limiting**: MusicBrainz API fallback has built-in protection
  - Each track (artist:title combination) is only searched once per session
  - Stops queries after 3 consecutive failures to prevent rate limiting
  - Cache and failure counter reset when loading a new stream
  - Cache limited to 100 tracks (FIFO eviction)
  - Embedded ID3 APIC artwork preferred (no API calls, works offline)
- **FLAC Bit Rate**: Displayed value is uncompressed theoretical rate, not actual stream rate
  - FLAC uses lossless compression; actual compressed rate varies
  - Calculated as: sample rate × channels × bits per sample ÷ 1000
