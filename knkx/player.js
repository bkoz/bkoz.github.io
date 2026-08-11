const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const playText = document.getElementById('playText');
const status = document.getElementById('status');
const currentBitrate = document.getElementById('currentBitrate');
const networkStatus = document.getElementById('networkStatus');
const bufferHealth = document.getElementById('bufferHealth');
const qualityMode = document.getElementById('qualityMode');
const albumArtwork = document.getElementById('albumArtwork');
const trackInfo = document.getElementById('trackInfo');
const lastUpdated = document.getElementById('lastUpdated');

const streams = [
    { bitrate: 256, url: 'https://knkx-live-a.edge.audiocdn.com/6285_256k/playlist.m3u8', label: '256 kbps' },
    { bitrate: 64, url: 'https://knkx-live-a.edge.audiocdn.com/6285_64k/playlist.m3u8', label: '64 kbps' },
    { bitrate: 48, url: 'https://knkx-live-a.edge.audiocdn.com/6285_48k/playlist.m3u8', label: '48 kbps' }
];

let hls = null;
let currentStreamIndex = 0;
let mode = 'auto';
let bufferCheckInterval = null;
let stallCount = 0;
let lastQualityChange = 0;
let metadataInterval = null;
let currentTrack = null;
let currentArtworkUrl = null;
let audioContext = null;
let analyser = null;
let analyserLeft = null;
let analyserRight = null;
let splitter = null;
let source = null;
let vuAnimationFrame = null;
let peakLevelLeft = 0;
let peakLevelRight = 0;
let peakDecayRate = 0.1;
let peakTimeoutLeft = null;
let peakTimeoutRight = null;
let savedPlaylist = [];

function initPlayer() {
    currentStreamIndex = 0;
    loadStream(currentStreamIndex);
    audio.volume = 0.75;
    setupAudioAnalyzer();
    loadPlaylist();
}

function setupAudioAnalyzer() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            source = audioContext.createMediaElementSource(audio);

            // Create splitter for stereo channels
            splitter = audioContext.createChannelSplitter(2);

            // Create analyzers for left and right channels
            analyserLeft = audioContext.createAnalyser();
            analyserLeft.fftSize = 256;
            analyserLeft.smoothingTimeConstant = 0.6;

            analyserRight = audioContext.createAnalyser();
            analyserRight.fftSize = 256;
            analyserRight.smoothingTimeConstant = 0.6;

            // Connect: source -> splitter -> analyzers
            source.connect(splitter);
            splitter.connect(analyserLeft, 0);
            splitter.connect(analyserRight, 1);

            // Connect to destination (speakers)
            source.connect(audioContext.destination);

            console.log('✅ Audio analyzer initialized');
        }
    } catch (err) {
        console.error('❌ Failed to setup audio analyzer:', err);
    }
}

function updateVUMeters() {
    if (!analyserLeft || !analyserRight) return;

    const bufferLengthLeft = analyserLeft.frequencyBinCount;
    const bufferLengthRight = analyserRight.frequencyBinCount;
    const dataArrayLeft = new Uint8Array(bufferLengthLeft);
    const dataArrayRight = new Uint8Array(bufferLengthRight);

    analyserLeft.getByteFrequencyData(dataArrayLeft);
    analyserRight.getByteFrequencyData(dataArrayRight);

    // Calculate average volume for each channel
    let sumLeft = 0;
    let sumRight = 0;
    for (let i = 0; i < bufferLengthLeft; i++) {
        sumLeft += dataArrayLeft[i];
        sumRight += dataArrayRight[i];
    }
    const avgLeft = sumLeft / bufferLengthLeft;
    const avgRight = sumRight / bufferLengthRight;

    // Normalize to 0-10 range (10 LEDs) with adjusted sensitivity
    const levelLeft = Math.min(10, Math.floor((avgLeft / 255) * 21));
    const levelRight = Math.min(10, Math.floor((avgRight / 255) * 21));

    // Update peak hold with flash effect
    if (levelLeft > peakLevelLeft) {
        peakLevelLeft = levelLeft;
        flashPeakLED('vuMeterLeft', levelLeft);
    } else {
        peakLevelLeft = Math.max(0, peakLevelLeft - peakDecayRate);
    }

    if (levelRight > peakLevelRight) {
        peakLevelRight = levelRight;
        flashPeakLED('vuMeterRight', levelRight);
    } else {
        peakLevelRight = Math.max(0, peakLevelRight - peakDecayRate);
    }

    // Update LED displays
    updateLEDs('vuMeterLeft', levelLeft);
    updateLEDs('vuMeterRight', levelRight);

    // Continue animation loop
    vuAnimationFrame = requestAnimationFrame(updateVUMeters);
}

function updateLEDs(meterId, level) {
    const meter = document.getElementById(meterId);
    const leds = meter.querySelectorAll('.led-bar');

    leds.forEach((led, index) => {
        if (index < level) {
            led.classList.add('active');
        } else {
            led.classList.remove('active');
        }
    });
}

function startVUMeters() {
    if (!vuAnimationFrame) {
        updateVUMeters();
    }
}

function flashPeakLED(meterId, level) {
    if (level === 0) return;

    const meter = document.getElementById(meterId);
    const leds = meter.querySelectorAll('.led-bar');
    const peakLED = leds[level - 1];

    if (peakLED) {
        // Clear any existing timeout for this meter
        if (meterId === 'vuMeterLeft' && peakTimeoutLeft) {
            clearTimeout(peakTimeoutLeft);
        }
        if (meterId === 'vuMeterRight' && peakTimeoutRight) {
            clearTimeout(peakTimeoutRight);
        }

        // Add peak class
        peakLED.classList.add('peak');

        // Remove after 400ms
        const timeout = setTimeout(() => {
            peakLED.classList.remove('peak');
        }, 400);

        if (meterId === 'vuMeterLeft') {
            peakTimeoutLeft = timeout;
        } else {
            peakTimeoutRight = timeout;
        }
    }
}

function stopVUMeters() {
    if (vuAnimationFrame) {
        cancelAnimationFrame(vuAnimationFrame);
        vuAnimationFrame = null;
    }

    // Clear timeouts
    if (peakTimeoutLeft) {
        clearTimeout(peakTimeoutLeft);
        peakTimeoutLeft = null;
    }
    if (peakTimeoutRight) {
        clearTimeout(peakTimeoutRight);
        peakTimeoutRight = null;
    }

    // Clear all LEDs and peaks
    updateLEDs('vuMeterLeft', 0);
    updateLEDs('vuMeterRight', 0);
    peakLevelLeft = 0;
    peakLevelRight = 0;

    // Remove peak classes
    const allLeds = document.querySelectorAll('.led-bar');
    allLeds.forEach(led => led.classList.remove('peak'));
}

function loadStream(index) {
    const stream = streams[index];
    console.log('📡 Loading stream:', stream.label, stream.url);

    if (hls) {
        hls.destroy();
    }

    if (Hls.isSupported()) {
        hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 30,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            debug: false
        });

        hls.loadSource(stream.url);
        hls.attachMedia(audio);

        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            console.log('✅ Stream ready:', stream.label);
            currentBitrate.textContent = stream.label;
            setStatus('Ready - ' + stream.label, false);
        });

        hls.on(Hls.Events.ERROR, function(event, data) {
            if (!data.fatal) return;

            console.error('❌ HLS Error:', data.type, data.details);

            if (mode === 'auto' && currentStreamIndex < streams.length - 1) {
                console.log('⬇️ Trying lower quality stream...');
                currentStreamIndex++;
                stallCount = 0;
                loadStream(currentStreamIndex);
            } else {
                setStatus('Stream error: ' + data.details, true);
            }
        });

    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        audio.src = stream.url;
        currentBitrate.textContent = stream.label;
    } else {
        setStatus('Your browser does not support HLS streaming', true);
    }

    currentStreamIndex = index;
}

function togglePlay() {
    if (audio.paused) {
        playBtn.disabled = true;
        setStatus('Starting stream...', false);

        // Resume AudioContext if suspended
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }

        audio.play().then(() => {
            console.log('✅ Playback started');
            playBtn.classList.add('playing');
            playIcon.textContent = '⏸';
            playText.textContent = 'Pause';
            playBtn.disabled = false;
            setStatus('Streaming live - ' + streams[currentStreamIndex].label, false);
            startMonitoring();
            startMetadataFetch();
            startVUMeters();
        }).catch(err => {
            console.error('❌ Play error:', err);
            setStatus('Failed to play: ' + err.message, true);
            playBtn.disabled = false;
        });
    } else {
        audio.pause();
        playBtn.classList.remove('playing');
        playIcon.textContent = '▶';
        playText.textContent = 'Play';
        setStatus('Paused', false);
        stopMonitoring();
        stopMetadataFetch();
        stopVUMeters();
    }
}

function setVolume(value) {
    audio.volume = value / 100;
    document.getElementById('volumeValue').textContent = value + '%';
}

function setStatus(message, isError = false) {
    status.textContent = message;
    status.className = 'status';
    if (isError) {
        status.classList.add('error');
    } else if (message.includes('live') || message.includes('Ready')) {
        status.classList.add('success');
    }
}

function changeQualityMode(newMode) {
    mode = newMode;
    console.log('🎚️ Quality mode changed to:', mode);

    if (mode === 'auto') {
        if (currentStreamIndex !== 0) {
            const wasPlaying = !audio.paused;
            loadStream(0);
            if (wasPlaying) {
                setTimeout(() => audio.play(), 100);
            }
        }
    } else {
        const targetIndex = streams.findIndex(s => s.bitrate == newMode);
        if (targetIndex !== -1 && targetIndex !== currentStreamIndex) {
            const wasPlaying = !audio.paused;
            loadStream(targetIndex);
            if (wasPlaying) {
                setTimeout(() => audio.play(), 100);
            }
        }
    }
}

function startMonitoring() {
    if (bufferCheckInterval) return;

    stallCount = 0;

    bufferCheckInterval = setInterval(() => {
        if (audio.paused) return;

        const buffered = audio.buffered;
        let bufferSeconds = 0;

        if (buffered.length > 0) {
            bufferSeconds = buffered.end(buffered.length - 1) - audio.currentTime;
        }

        bufferHealth.textContent = bufferSeconds.toFixed(1) + 's';

        if (mode === 'auto') {
            const now = Date.now();
            const timeSinceLastChange = now - lastQualityChange;

            if (timeSinceLastChange < 10000) return;

            if (bufferSeconds < 2 && currentStreamIndex < streams.length - 1) {
                stallCount++;
                if (stallCount >= 2) {
                    console.log('⬇️ Buffer low, stepping down quality');
                    currentStreamIndex++;
                    const wasPlaying = !audio.paused;
                    loadStream(currentStreamIndex);
                    if (wasPlaying) setTimeout(() => audio.play(), 100);
                    stallCount = 0;
                    lastQualityChange = now;
                    updateNetworkStatus('fair');
                }
            } else if (bufferSeconds > 15 && currentStreamIndex > 0) {
                console.log('⬆️ Buffer healthy, stepping up quality');
                currentStreamIndex--;
                const wasPlaying = !audio.paused;
                loadStream(currentStreamIndex);
                if (wasPlaying) setTimeout(() => audio.play(), 100);
                stallCount = 0;
                lastQualityChange = now;
                updateNetworkStatus('excellent');
            } else if (bufferSeconds > 5) {
                stallCount = 0;
                updateNetworkStatus('good');
            }
        }
    }, 2000);

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
}

function stopMonitoring() {
    if (bufferCheckInterval) {
        clearInterval(bufferCheckInterval);
        bufferCheckInterval = null;
    }
    audio.removeEventListener('waiting', handleWaiting);
    audio.removeEventListener('playing', handlePlaying);
}

function handleWaiting() {
    console.log('⏳ Buffering...');
    setStatus('Buffering...', false);
}

function handlePlaying() {
    console.log('▶️ Playing');
    setStatus('Streaming live - ' + streams[currentStreamIndex].label, false);
}

function updateNetworkStatus(quality) {
    networkStatus.className = 'quality-badge ' + quality;
    const labels = {
        'excellent': 'Excellent',
        'good': 'Good',
        'fair': 'Fair',
        'poor': 'Poor'
    };
    networkStatus.textContent = labels[quality] || 'Good';
}

async function fetchMetadata() {
    try {
        console.log('🔍 Fetching metadata...');
        const stream = streams[currentStreamIndex];

        const masterResp = await fetch(stream.url);
        const masterText = await masterResp.text();

        const masterLines = masterText.split('\n');
        let mediaUrl = null;
        for (let line of masterLines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('http')) {
                mediaUrl = trimmed;
                break;
            }
        }

        if (!mediaUrl) {
            console.log('❌ No media URL found in master playlist');
            return;
        }

        const mediaResp = await fetch(mediaUrl);
        const mediaText = await mediaResp.text();

        const mediaLines = mediaText.split('\n');
        let lastTrack = null;

        for (let i = 0; i < mediaLines.length; i++) {
            if (mediaLines[i].startsWith('#EXTINF:')) {
                const match = mediaLines[i].match(/#EXTINF:[\d.]+,(.+)/);
                if (match) {
                    lastTrack = match[1].trim();
                }
            }
        }

        if (lastTrack && lastTrack !== currentTrack) {
            console.log('✅ New track detected:', lastTrack);
            currentTrack = lastTrack;
            updateTrackDisplay(lastTrack);

            const now = new Date().toLocaleTimeString();
            lastUpdated.textContent = `Updated at ${now}`;
        }

    } catch (err) {
        console.error('❌ Metadata fetch error:', err);
    }
}

function updateTrackDisplay(trackString) {
    console.log('🎵 updateTrackDisplay called with:', trackString);
    let artist = null;
    let title = null;

    if (trackString.includes(' - ')) {
        const [artistPart, ...titleParts] = trackString.split(' - ');
        artist = artistPart.trim();
        title = titleParts.join(' - ').trim();
        trackInfo.innerHTML = `<span class="artist">${escapeHtml(artist)}</span><span class="title">${escapeHtml(title)}</span>`;
    } else {
        trackInfo.innerHTML = `<span class="title">${escapeHtml(trackString)}</span>`;
    }

    if (artist && title) {
        fetchAlbumArtwork(artist, title);
        // Automatically add to history
        addToHistory(artist, title);
    } else {
        resetArtwork();
    }
}

async function fetchAlbumArtwork(artist, title) {
    try {
        console.log('🎨 fetchAlbumArtwork called');
        albumArtwork.classList.add('loading');

        let artworkUrl = null;
        let albumName = null;

        // Try iTunes first - it returns album info
        const itunesData = await fetchItunesArtwork(artist, title);
        if (itunesData) {
            artworkUrl = itunesData.artworkUrl;
            albumName = itunesData.albumName;
        }

        // Fallback to MusicBrainz if iTunes fails
        if (!artworkUrl) {
            const mbData = await fetchMusicBrainzArtwork(artist, title);
            if (mbData) {
                artworkUrl = mbData.artworkUrl;
                albumName = mbData.albumName;
            }
        }

        // Store album name for history
        if (albumName) {
            updateHistoryAlbum(artist, title, albumName);
        }

        if (artworkUrl && artworkUrl !== currentArtworkUrl) {
            currentArtworkUrl = artworkUrl;

            const img = document.createElement('img');
            img.alt = `${artist} - ${title}`;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.display = 'block';
            img.style.objectFit = 'cover';

            img.onload = function() {
                console.log('✅ Image loaded successfully');
                albumArtwork.classList.remove('loading');
            };

            img.onerror = function() {
                console.error('❌ Image failed to load');
                resetArtwork();
                albumArtwork.classList.remove('loading');
            };

            albumArtwork.innerHTML = '';
            albumArtwork.appendChild(img);
            img.src = artworkUrl;

            console.log('✅ Album artwork element created and added to DOM');
        } else {
            albumArtwork.classList.remove('loading');
        }

    } catch (err) {
        console.error('❌ Album artwork fetch error:', err);
        albumArtwork.classList.remove('loading');
        resetArtwork();
    }
}

function resetArtwork() {
    if (albumArtwork.querySelector('img')) {
        albumArtwork.innerHTML = '<span class="artwork-placeholder">🎵</span>';
        currentArtworkUrl = null;
    }
}

async function fetchItunesArtwork(artist, title) {
    try {
        const searchTerm = encodeURIComponent(`${artist} ${title}`);
        const apiUrl = `https://itunes.apple.com/search?term=${searchTerm}&media=music&entity=song&limit=1`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(apiUrl, {
            method: 'GET',
            mode: 'cors',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('iTunes API failed');
        }

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const artworkUrl = result.artworkUrl100.replace('100x100', '600x600');
            const albumName = result.collectionName;
            console.log('iTunes artwork found:', artworkUrl, 'Album:', albumName);
            return { artworkUrl, albumName };
        }
        return null;
    } catch (err) {
        console.log('iTunes API error:', err.message);
        return null;
    }
}

async function fetchMusicBrainzArtwork(artist, title) {
    try {
        const query = encodeURIComponent(`artist:"${artist}" AND recording:"${title}"`);
        const searchUrl = `https://musicbrainz.org/ws/2/recording/?query=${query}&fmt=json&limit=1`;

        const searchResp = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'KNKXPlayer/1.0 (https://knkx.org)'
            }
        });

        if (!searchResp.ok) {
            throw new Error('MusicBrainz search failed');
        }

        const searchData = await searchResp.json();

        if (!searchData.recordings || searchData.recordings.length === 0) {
            return null;
        }

        const recording = searchData.recordings[0];
        if (!recording.releases || recording.releases.length === 0) {
            return null;
        }

        const release = recording.releases[0];
        const releaseId = release.id;
        const albumName = release.title;
        const coverUrl = `https://coverartarchive.org/release/${releaseId}/front-500`;

        const coverResp = await fetch(coverUrl, { method: 'HEAD' });
        if (coverResp.ok) {
            console.log('MusicBrainz artwork found, Album:', albumName);
            return { artworkUrl: coverUrl, albumName };
        }

        return null;
    } catch (err) {
        console.log('MusicBrainz API error:', err.message);
        return null;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function startMetadataFetch() {
    fetchMetadata();
    metadataInterval = setInterval(fetchMetadata, 10000);
}

function stopMetadataFetch() {
    if (metadataInterval) {
        clearInterval(metadataInterval);
        metadataInterval = null;
    }
}

function openExternal(url) {
    try {
        const { shell } = require('electron');
        shell.openExternal(url);
    } catch (err) {
        console.error('Failed to open external link:', err);
    }
}

// Playlist functions (now for history tracking)
function loadPlaylist() {
    try {
        const saved = localStorage.getItem('knkx-history');
        if (saved) {
            savedPlaylist = JSON.parse(saved);
            renderPlaylist();
        }
    } catch (err) {
        console.error('Failed to load history:', err);
    }
}

function savePlaylist() {
    try {
        localStorage.setItem('knkx-history', JSON.stringify(savedPlaylist));
    } catch (err) {
        console.error('Failed to save history:', err);
    }
}

function addToHistory(artist, title) {
    // Check if this exact track was just added (avoid duplicates on metadata refresh)
    const lastTrack = savedPlaylist[0];
    if (lastTrack && lastTrack.artist === artist && lastTrack.title === title) {
        return;
    }

    // Add new track to history
    savedPlaylist.unshift({
        artist: artist,
        title: title,
        album: null, // Will be updated when artwork fetch completes
        timestamp: new Date().toISOString(),
        artworkUrl: currentArtworkUrl
    });

    // Limit history to 100 tracks
    if (savedPlaylist.length > 100) {
        savedPlaylist = savedPlaylist.slice(0, 100);
    }

    savePlaylist();
    renderPlaylist();
}

function updateHistoryAlbum(artist, title, albumName) {
    // Find the most recent matching track and update its album
    const track = savedPlaylist.find(item =>
        item.artist === artist && item.title === title && !item.album
    );

    if (track) {
        track.album = albumName;
        savePlaylist();
        renderPlaylist();
    }
}

function renderPlaylist() {
    const container = document.getElementById('playlistContainer');
    const countEl = document.getElementById('historyCount');

    if (savedPlaylist.length === 0) {
        container.innerHTML = '<div class="playlist-empty">No tracks played yet. Start playing to see your listening history.</div>';
        countEl.textContent = '0 tracks';
        return;
    }

    countEl.textContent = `${savedPlaylist.length} track${savedPlaylist.length !== 1 ? 's' : ''}`;

    container.innerHTML = savedPlaylist.map((track, index) => `
        <div class="playlist-item">
            <div class="playlist-track-info">
                ${track.artist ? `<span class="playlist-artist">${escapeHtml(track.artist)}</span>` : ''}
                <span class="playlist-title">${escapeHtml(track.title)}</span>
                ${track.album ? `<span class="playlist-album">Album: ${escapeHtml(track.album)}</span>` : ''}
                <span class="playlist-time">${formatTimestamp(track.timestamp)}</span>
            </div>
            <button class="playlist-remove" onclick="removeTrack(${index})">Remove</button>
        </div>
    `).join('');
}

function removeTrack(index) {
    savedPlaylist.splice(index, 1);
    savePlaylist();
    renderPlaylist();
}

function clearPlaylist() {
    if (savedPlaylist.length === 0) return;

    if (confirm('Are you sure you want to clear your play history?')) {
        savedPlaylist = [];
        savePlaylist();
        renderPlaylist();
    }
}

function exportPlaylist() {
    if (savedPlaylist.length === 0) {
        alert('No tracks to export!');
        return;
    }

    const text = savedPlaylist.map(track => {
        const artistPart = track.artist ? `${track.artist} - ` : '';
        const albumPart = track.album ? ` [${track.album}]` : '';
        const datePart = new Date(track.timestamp).toLocaleString();
        return `${artistPart}${track.title}${albumPart} (${datePart})`;
    }).join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knkx-history-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

initPlayer();
