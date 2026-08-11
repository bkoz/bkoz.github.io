# KNKX Player

An Electron-based desktop application for streaming KNKX live radio - Jazz and NPR News for the Pacific Northwest.

## Features

- **HLS Streaming** - High-quality adaptive bitrate streaming (256k/64k/48k)
- **Now Playing** - Displays current track information with automatic updates
- **Album Artwork** - Fetches album covers from iTunes API and MusicBrainz
- **Adaptive Quality** - Automatically adjusts stream quality based on network conditions
- **Manual Quality Control** - Choose between Auto, High (256 kbps), Medium (64 kbps), or Low (48 kbps)
- **Buffer Monitoring** - Real-time display of buffer health and network status
- **Volume Control** - Adjustable volume slider

## Installation

```bash
npm install
```

## Usage

Start the application:

```bash
npm start
```

## Development

Run in development mode:

```bash
npm run dev
```

## Technical Details

- **Framework**: Electron
- **Streaming**: HLS.js for adaptive bitrate streaming
- **Audio Format**: AAC
- **Bitrates**: 256 kbps (High), 64 kbps (Medium), 48 kbps (Low)
- **Metadata**: Fetched from KNKX stream playlists
- **Artwork Sources**: iTunes API (primary), MusicBrainz/Cover Art Archive (fallback)

## Stream URLs

- High Quality: https://knkx-live-a.edge.audiocdn.com/6285_256k/playlist.m3u8
- Medium Quality: https://knkx-live-a.edge.audiocdn.com/6285_64k/playlist.m3u8
- Low Quality: https://knkx-live-a.edge.audiocdn.com/6285_48k/playlist.m3u8

## License

MIT
