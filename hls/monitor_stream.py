#!/usr/bin/env python3
"""
HLS Stream Monitor for KUT/KUTX Radio
Fetches and displays real-time track metadata from the HLS stream
"""

import requests
import time
import re
from datetime import datetime
from typing import Optional, Dict, List

class HLSStreamMonitor:
    def __init__(self, master_url: str):
        self.master_url = master_url
        self.media_url: Optional[str] = None
        self.last_track: Optional[str] = None

    def get_media_playlist_url(self) -> str:
        """Fetch the master playlist and extract the media playlist URL"""
        response = requests.get(self.master_url)
        response.raise_for_status()

        # Extract the media playlist URL from master
        for line in response.text.split('\n'):
            if line.startswith('http'):
                return line.strip()

        raise ValueError("No media playlist URL found in master playlist")

    def parse_extinf(self, extinf_line: str) -> Dict[str, str]:
        """Parse EXTINF tag to extract duration and metadata"""
        # Format: #EXTINF:duration,artist - title
        match = re.match(r'#EXTINF:([\d.]+),(.+)', extinf_line)
        if not match:
            return {}

        duration = float(match.group(1))
        metadata = match.group(2)

        # Try to split artist and title
        if ' - ' in metadata:
            parts = metadata.split(' - ', 1)
            return {
                'duration': duration,
                'artist': parts[0].strip(),
                'title': parts[1].strip(),
                'full': metadata
            }
        else:
            return {
                'duration': duration,
                'title': metadata,
                'full': metadata
            }

    def get_current_tracks(self) -> List[Dict[str, str]]:
        """Fetch the media playlist and extract current track information"""
        if not self.media_url:
            self.media_url = self.get_media_playlist_url()

        try:
            response = requests.get(self.media_url, timeout=10)
            response.raise_for_status()
        except requests.RequestException:
            # Session may have expired, refresh media URL
            self.media_url = self.get_media_playlist_url()
            response = requests.get(self.media_url, timeout=10)
            response.raise_for_status()

        lines = response.text.split('\n')
        tracks = []

        for i, line in enumerate(lines):
            if line.startswith('#EXTINF:'):
                track_info = self.parse_extinf(line)
                if track_info:
                    # Next line should be the segment URL
                    if i + 1 < len(lines):
                        track_info['segment'] = lines[i + 1].strip()
                    tracks.append(track_info)

        return tracks

    def monitor(self, interval: int = 10, display_all: bool = False):
        """
        Monitor the stream and display track changes

        Args:
            interval: Seconds between playlist refreshes
            display_all: If True, show all segments; if False, only show changes
        """
        print(f"🎵 Monitoring HLS stream: {self.master_url}")
        print(f"Refresh interval: {interval}s")
        print("-" * 80)

        try:
            while True:
                tracks = self.get_current_tracks()

                if tracks:
                    current = tracks[-1]  # Most recent track
                    timestamp = datetime.now().strftime("%H:%M:%S")

                    if display_all:
                        print(f"\n[{timestamp}] Playlist segments ({len(tracks)} total):")
                        for idx, track in enumerate(tracks[-5:], 1):  # Show last 5
                            artist = track.get('artist', '')
                            title = track.get('title', track.get('full', 'Unknown'))
                            duration = track.get('duration', 0)

                            if artist:
                                print(f"  {idx}. {artist} - {title} ({duration:.2f}s)")
                            else:
                                print(f"  {idx}. {title} ({duration:.2f}s)")

                    # Detect track changes
                    current_track = current.get('full', '')
                    if current_track != self.last_track:
                        artist = current.get('artist', '')
                        title = current.get('title', current_track)
                        duration = current.get('duration', 0)

                        if artist:
                            print(f"\n🎶 [{timestamp}] NOW PLAYING: {artist} - {title} ({duration:.1f}s)")
                        else:
                            print(f"\n📻 [{timestamp}] {title} ({duration:.1f}s)")

                        self.last_track = current_track

                time.sleep(interval)

        except KeyboardInterrupt:
            print("\n\n👋 Stream monitoring stopped")
        except Exception as e:
            print(f"\n❌ Error: {e}")
            raise


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Monitor HLS audio stream and display track metadata'
    )
    parser.add_argument(
        '--url',
        default='https://streams.kut.org/4428/playlist.m3u8',
        help='Master playlist URL (default: KUT/KUTX stream)'
    )
    parser.add_argument(
        '--interval',
        type=int,
        default=10,
        help='Refresh interval in seconds (default: 10)'
    )
    parser.add_argument(
        '--show-all',
        action='store_true',
        help='Show all segments, not just track changes'
    )

    args = parser.parse_args()

    monitor = HLSStreamMonitor(args.url)
    monitor.monitor(interval=args.interval, display_all=args.show_all)


if __name__ == '__main__':
    main()
