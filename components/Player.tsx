'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, Shuffle, Repeat, Repeat1, Mic2 } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { mockSongs } from '@/lib/data/songs';
import { LyricsPanel } from './LyricsPanel';

export function Player() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [showLyrics, setShowLyrics] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const previousVolume = useRef(0.7);

    const {
        currentSong,
        isPlaying,
        volume,
        progress,
        duration,
        shuffle,
        repeat,
        queue,
        autoPlayEnabled,
        lastSearchQuery,
        setVolume,
        setProgress,
        setDuration,
        setIsPlaying,
        setIsLoading,
        toggleShuffle,
        toggleRepeat,
        playNext,
        playPrevious,
        addManyToQueue,
        setLastSearchQuery,
        setCurrentSong,
        history,
    } = usePlayerStore();

    // Load and play audio when song changes
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong?.audioUrl) return;

        setIsLoading(true);
        audio.src = currentSong.audioUrl;
        audio.load();

        audio.onloadedmetadata = () => {
            setDuration(audio.duration);
            setIsLoading(false);
            audio.play().catch(console.error);
            setIsPlaying(true);
        };

        audio.onerror = () => {
            console.error('Audio playback error');
            setIsLoading(false);
            setIsPlaying(false);
        };

    }, [currentSong?.id, currentSong?.audioUrl]);

    // Handle play/pause
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.play().catch(console.error);
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    // Handle volume
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    // Progress tracking - runs when song changes
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            setProgress(audio.currentTime);
        };

        audio.addEventListener('timeupdate', updateProgress);

        // Also use interval as backup
        const interval = setInterval(() => {
            if (audio && !audio.paused) {
                setProgress(audio.currentTime);
            }
        }, 200);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            clearInterval(interval);
        };
    }, [currentSong?.id, setProgress]);

    // Handle song end
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = async () => {
            // If repeat one, restart
            if (repeat === 'one') {
                audio.currentTime = 0;
                audio.play();
                return;
            }

            // If queue has songs, play next
            if (queue.length > 0) {
                playNext();
                return;
            }

            // If autoplay enabled, try to fetch similar songs
            if (autoPlayEnabled && currentSong) {
                try {
                    const searchQuery = lastSearchQuery || currentSong.artist;
                    const response = await fetch(`/api/songs?q=${encodeURIComponent(searchQuery)}&limit=10`);
                    const data = await response.json();

                    if (data.songs?.length > 0) {
                        // Filter out current song and songs in history
                        const historyIds = new Set(history.map(s => s.id));
                        const newSongs = data.songs.filter(
                            (s: any) => s.id !== currentSong.id && !historyIds.has(s.id)
                        );

                        if (newSongs.length > 0) {
                            addManyToQueue(newSongs);
                            playNext();
                            return;
                        }
                    }

                    // Fallback to random mock song
                    const randomSong = mockSongs[Math.floor(Math.random() * mockSongs.length)];
                    if (randomSong) {
                        addManyToQueue([randomSong]);
                        playNext();
                    }
                } catch (error) {
                    console.error('Auto-play fetch error:', error);
                    // Fallback to mock songs
                    const randomSong = mockSongs[Math.floor(Math.random() * mockSongs.length)];
                    if (randomSong) {
                        addManyToQueue([randomSong]);
                        playNext();
                    }
                }
            }
        };

        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, [repeat, queue, autoPlayEnabled, currentSong, history, lastSearchQuery]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        setProgress(newTime);
    };

    const formatTime = (seconds: number): string => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        if (isMuted) {
            setIsMuted(false);
            setVolume(previousVolume.current);
        } else {
            previousVolume.current = volume;
            setIsMuted(true);
        }
    };

    const handleNext = async () => {
        // If we have songs in queue, play next
        if (queue.length > 0) {
            playNext();
            return;
        }

        // Fetch random songs (not based on current song)
        if (currentSong) {
            // Random search terms for variety
            const randomQueries = ['pop hits', 'rock', 'hip hop', 'bollywood', 'drake', 'taylor swift', 'arijit singh', 'ed sheeran', 'the weeknd', 'dua lipa', 'bad bunny', 'ariana grande', 'justin bieber', 'billie eilish'];
            const randomQuery = randomQueries[Math.floor(Math.random() * randomQueries.length)];

            try {
                const response = await fetch(`/api/songs?q=${encodeURIComponent(randomQuery)}&limit=20`);
                const data = await response.json();

                if (data.songs?.length > 0) {
                    // Pick a random song from results (not just the first one)
                    const historyIds = new Set([...history.map(s => s.id), currentSong.id]);
                    const newSongs = data.songs.filter((s: any) => !historyIds.has(s.id));

                    if (newSongs.length > 0) {
                        const randomIndex = Math.floor(Math.random() * Math.min(newSongs.length, 10));
                        const randomSong = newSongs[randomIndex];
                        setCurrentSong(randomSong);
                        return;
                    }
                }
            } catch (error) {
                console.error('Failed to fetch random songs:', error);
            }

            // Fallback to mock songs
            const randomSong = mockSongs[Math.floor(Math.random() * mockSongs.length)];
            if (randomSong && randomSong.id !== currentSong.id) {
                setCurrentSong(randomSong);
            }
        }
    };

    const handlePrevious = () => {
        const audio = audioRef.current;

        // If more than 3 seconds in, restart current song
        if (audio && progress > 3) {
            audio.currentTime = 0;
            setProgress(0);
            return;
        }

        // Otherwise go to previous song
        if (history.length > 0) {
            playPrevious();
        } else {
            // Restart current song
            if (audio) {
                audio.currentTime = 0;
                setProgress(0);
            }
        }
    };

    // Don't render if no song
    if (!currentSong) return null;

    return (
        <>
            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                src={currentSong?.audioUrl}
                preload="auto"
            />

            {/* Player UI */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '90px',
                    backgroundColor: '#181818',
                    borderTop: '1px solid #282828',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    zIndex: 1000,
                }}
            >
                {/* Song Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '30%', minWidth: '180px' }}>
                    <img
                        src={currentSong.image}
                        alt={currentSong.title}
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                        }}
                        onError={(e) => {
                            e.currentTarget.src = `https://picsum.photos/seed/${currentSong.id}/300`;
                        }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                        <p
                            style={{
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 500,
                                margin: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {currentSong.title}
                        </p>
                        <p
                            style={{
                                color: '#b3b3b3',
                                fontSize: '11px',
                                margin: '4px 0 0 0',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {currentSong.artist}
                        </p>
                    </div>
                </div>

                {/* Center Controls */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    {/* Control Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Shuffle */}
                        <button
                            onClick={toggleShuffle}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                color: shuffle ? '#1DB954' : '#b3b3b3',
                            }}
                        >
                            <Shuffle size={16} />
                        </button>

                        {/* Previous */}
                        <button
                            onClick={handlePrevious}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                color: '#b3b3b3',
                            }}
                        >
                            <SkipBack size={20} fill="#b3b3b3" />
                        </button>

                        {/* Play/Pause */}
                        <button
                            onClick={togglePlay}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {isPlaying ? (
                                <Pause size={16} fill="#000" color="#000" />
                            ) : (
                                <Play size={16} fill="#000" color="#000" style={{ marginLeft: '2px' }} />
                            )}
                        </button>

                        {/* Next */}
                        <button
                            onClick={handleNext}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                color: '#b3b3b3',
                            }}
                        >
                            <SkipForward size={20} fill="#b3b3b3" />
                        </button>

                        {/* Repeat */}
                        <button
                            onClick={toggleRepeat}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                color: repeat !== 'off' ? '#1DB954' : '#b3b3b3',
                            }}
                        >
                            {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '600px' }}>
                        <span style={{ color: '#b3b3b3', fontSize: '11px', minWidth: '40px', textAlign: 'right' }}>
                            {formatTime(progress)}
                        </span>
                        <input
                            type="range"
                            className="progress-slider"
                            min={0}
                            max={duration || 100}
                            value={progress}
                            onChange={handleSeek}
                            style={{
                                flex: 1,
                                '--progress': `${duration ? (progress / duration) * 100 : 0}%`,
                            } as React.CSSProperties}
                        />
                        <span style={{ color: '#b3b3b3', fontSize: '11px', minWidth: '40px' }}>
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Volume Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '30%', justifyContent: 'flex-end', minWidth: '180px' }}>
                    {/* Lyrics Button */}
                    <button
                        onClick={() => setShowLyrics(!showLyrics)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            color: showLyrics ? '#1DB954' : '#b3b3b3',
                        }}
                        title="Lyrics"
                    >
                        <Mic2 size={18} />
                    </button>
                    <button
                        onClick={toggleMute}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            color: '#b3b3b3',
                        }}
                    >
                        {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input
                        type="range"
                        className="volume-slider"
                        min={0}
                        max={1}
                        step={0.01}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                            setIsMuted(false);
                            setVolume(parseFloat(e.target.value));
                        }}
                        style={{
                            '--volume': `${(isMuted ? 0 : volume) * 100}%`,
                        } as React.CSSProperties}
                    />
                </div>
            </div>

            {/* Lyrics Panel */}
            {showLyrics && currentSong && (
                <LyricsPanel
                    isOpen={showLyrics}
                    onClose={() => setShowLyrics(false)}
                />
            )}
        </>
    );
}
