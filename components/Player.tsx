'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, Mic2, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { LyricsPanel } from './LyricsPanel';
import { mockSongs } from '@/lib/data/songs';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

export function Player() {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [ytApiReady, setYtApiReady] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);
    const [showLyrics, setShowLyrics] = useState(false);

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
        history,
    } = usePlayerStore();

    // Load YouTube IFrame API
    useEffect(() => {
        if (window.YT && window.YT.Player) {
            setYtApiReady(true);
            return;
        }

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScript = document.getElementsByTagName('script')[0];
        firstScript?.parentNode?.insertBefore(tag, firstScript);

        window.onYouTubeIframeAPIReady = () => {
            setYtApiReady(true);
        };
    }, []);

    // Create/update YouTube player when song changes
    useEffect(() => {
        if (!ytApiReady || !currentSong?.youtubeId) return;
        if (currentVideoId === currentSong.youtubeId && playerRef.current) {
            // Same video, just control play/pause
            return;
        }

        // Destroy old player
        if (playerRef.current) {
            try {
                playerRef.current.destroy();
            } catch (e) { }
            playerRef.current = null;
        }

        // Create container for new player
        const container = containerRef.current;
        if (!container) return;

        // Clear container
        container.innerHTML = '';
        const playerDiv = document.createElement('div');
        playerDiv.id = 'yt-player-' + Date.now();
        container.appendChild(playerDiv);

        setIsLoading(true);

        // Create new player
        playerRef.current = new window.YT.Player(playerDiv.id, {
            height: '1',
            width: '1',
            videoId: currentSong.youtubeId,
            playerVars: {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                fs: 0,
                iv_load_policy: 3,
                rel: 0,
                showinfo: 0,
                origin: window.location.origin,
            },
            events: {
                onReady: (event: any) => {
                    console.log('YouTube player ready');
                    setIsLoading(false);
                    setCurrentVideoId(currentSong.youtubeId!);

                    // Get and set duration
                    const dur = event.target.getDuration();
                    if (dur) setDuration(dur);

                    // Set volume
                    event.target.setVolume(volume * 100);

                    // Start playing
                    if (isPlaying) {
                        event.target.playVideo();
                    }

                    // Start progress tracking
                    startProgressTracking();
                },
                onStateChange: (event: any) => {
                    // YT.PlayerState: UNSTARTED(-1), ENDED(0), PLAYING(1), PAUSED(2), BUFFERING(3), CUED(5)
                    if (event.data === window.YT.PlayerState.PLAYING) {
                        setIsPlaying(true);
                        startProgressTracking();
                    } else if (event.data === window.YT.PlayerState.PAUSED) {
                        setIsPlaying(false);
                        stopProgressTracking();
                    } else if (event.data === window.YT.PlayerState.ENDED) {
                        setIsPlaying(false);
                        setProgress(0);
                        stopProgressTracking();
                        // Auto-play next song
                        handleSongEnded();
                    } else if (event.data === window.YT.PlayerState.BUFFERING) {
                        setIsLoading(true);
                    }
                },
                onError: (event: any) => {
                    console.error('YouTube player error:', event.data);
                    setIsLoading(false);
                },
            },
        });
    }, [ytApiReady, currentSong?.youtubeId]);

    // Handle play/pause when isPlaying changes
    useEffect(() => {
        if (!playerRef.current?.playVideo) return;

        try {
            if (isPlaying) {
                playerRef.current.playVideo();
                startProgressTracking();
            } else {
                playerRef.current.pauseVideo();
                stopProgressTracking();
            }
        } catch (e) {
            console.error('Play/pause error:', e);
        }
    }, [isPlaying]);

    // Handle volume changes
    useEffect(() => {
        if (!playerRef.current?.setVolume) return;
        try {
            playerRef.current.setVolume(volume * 100);
        } catch (e) { }
    }, [volume]);

    const startProgressTracking = useCallback(() => {
        stopProgressTracking();
        progressInterval.current = setInterval(() => {
            if (playerRef.current?.getCurrentTime) {
                try {
                    const currentTime = playerRef.current.getCurrentTime();
                    const dur = playerRef.current.getDuration();
                    if (currentTime !== undefined) {
                        setProgress(currentTime);
                    }
                    if (dur && dur !== duration) {
                        setDuration(dur);
                    }
                } catch (e) { }
            }
        }, 500);
    }, [duration]);

    const stopProgressTracking = useCallback(() => {
        if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
        }
    }, []);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setProgress(newTime);
        if (playerRef.current?.seekTo) {
            try {
                playerRef.current.seekTo(newTime, true);
            } catch (e) { }
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        setVolume(volume === 0 ? 0.7 : 0);
    };

    // Auto-play similar songs when current song ends
    const handleSongEnded = useCallback(async () => {
        // If there are songs in queue, play next
        if (queue.length > 0) {
            playNext();
            return;
        }

        // If auto-play is disabled, stop
        if (!autoPlayEnabled) return;

        // Search for similar songs based on current song
        if (currentSong) {
            try {
                const searchQuery = currentSong.artist || currentSong.title.split(' ')[0];
                setLastSearchQuery(searchQuery);

                const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.songs && data.songs.length > 0) {
                        // Filter out current song and add rest to queue
                        const similarSongs = data.songs.filter((s: any) => s.id !== currentSong.id);
                        if (similarSongs.length > 0) {
                            // If shuffle, randomize the order
                            if (shuffle) {
                                similarSongs.sort(() => Math.random() - 0.5);
                            }
                            addManyToQueue(similarSongs);
                            playNext();
                            return; // Success!
                        }
                    }
                }
            } catch (error) {
                console.error('Auto-play error:', error);
            }
        }

        // Fallback: If API failed or no similar songs found, play a random song from mock data
        console.log('Auto-play fallback: Playing random song');
        const availableSongs = mockSongs.filter(s => s.id !== currentSong?.id);
        if (availableSongs.length > 0) {
            const randomSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
            addManyToQueue([randomSong]);
            playNext();
        }
    }, [currentSong, queue, autoPlayEnabled, shuffle, playNext, addManyToQueue, setLastSearchQuery]);

    const handleNext = () => {
        if (queue.length > 0) {
            playNext();
        } else if (repeat === 'all' && history.length > 0) {
            playNext();
        } else if (autoPlayEnabled) {
            handleSongEnded();
        } else {
            playNext();
        }
    };

    const handlePrevious = () => {
        if (progress > 3) {
            // Restart current song
            if (playerRef.current && playerRef.current.seekTo) {
                playerRef.current.seekTo(0);
                setProgress(0);
            }
        } else {
            playPrevious();
        }
    };

    // Styles
    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '90px',
        backgroundColor: '#181818',
        borderTop: '1px solid #282828',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100,
    };

    const leftSectionStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flex: 1,
        minWidth: 0,
    };

    const centerSectionStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        flex: 2,
        maxWidth: '600px',
    };

    const rightSectionStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flex: 1,
        justifyContent: 'flex-end',
    };

    // Hide player completely when no song is selected
    if (!currentSong) {
        return null;
    }

    return (
        <div style={containerStyle}>
            {/* Hidden YouTube player container */}
            <div
                ref={containerRef}
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    opacity: 0,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                }}
            />

            {/* Left: Song Info */}
            <div style={leftSectionStyle}>
                <img
                    src={currentSong.image || `https://picsum.photos/seed/${currentSong.id}/56`}
                    alt={currentSong.title}
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '4px',
                        objectFit: 'cover',
                    }}
                />
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <p style={{
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 500,
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {currentSong.title}
                    </p>
                    <p style={{
                        color: '#9ca3af',
                        fontSize: '12px',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {currentSong.artist}
                    </p>
                </div>
            </div>

            {/* Center: Controls + Progress */}
            <div style={centerSectionStyle}>
                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Shuffle Button */}
                    <button
                        onClick={toggleShuffle}
                        title={shuffle ? 'Shuffle: On' : 'Shuffle: Off'}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: shuffle ? '#1DB954' : '#b3b3b3',
                            cursor: 'pointer',
                            padding: '8px',
                            position: 'relative',
                        }}
                    >
                        <Shuffle size={18} />
                        {shuffle && (
                            <span style={{
                                position: 'absolute',
                                bottom: '2px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: '#1DB954',
                            }} />
                        )}
                    </button>

                    <button
                        onClick={handlePrevious}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#b3b3b3',
                            cursor: 'pointer',
                            padding: '8px',
                        }}
                    >
                        <SkipBack size={20} fill="#b3b3b3" />
                    </button>

                    <button
                        onClick={togglePlay}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#FE5F6F',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        {isPlaying ? (
                            <Pause size={20} fill="#fff" color="#fff" />
                        ) : (
                            <Play size={20} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
                        )}
                    </button>

                    <button
                        onClick={handleNext}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#b3b3b3',
                            cursor: 'pointer',
                            padding: '8px',
                        }}
                    >
                        <SkipForward size={20} fill="#b3b3b3" />
                    </button>

                    {/* Repeat Button */}
                    <button
                        onClick={toggleRepeat}
                        title={`Repeat: ${repeat === 'off' ? 'Off' : repeat === 'all' ? 'All' : 'One'}`}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: repeat !== 'off' ? '#1DB954' : '#b3b3b3',
                            cursor: 'pointer',
                            padding: '8px',
                            position: 'relative',
                        }}
                    >
                        {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                        {repeat !== 'off' && (
                            <span style={{
                                position: 'absolute',
                                bottom: '2px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: '#1DB954',
                            }} />
                        )}
                    </button>
                </div>

                {/* Progress Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <span style={{ color: '#b3b3b3', fontSize: '11px', minWidth: '40px', textAlign: 'right' }}>
                        {formatTime(progress)}
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={progress || 0}
                        onChange={handleSeek}
                        style={{
                            flex: 1,
                            height: '4px',
                            appearance: 'none',
                            backgroundColor: '#4d4d4d',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: `linear-gradient(to right, #FE5F6F ${(progress / (duration || 100)) * 100}%, #4d4d4d ${(progress / (duration || 100)) * 100}%)`,
                        }}
                    />
                    <span style={{ color: '#b3b3b3', fontSize: '11px', minWidth: '40px' }}>
                        {formatTime(duration)}
                    </span>
                </div>
            </div>

            {/* Right: Volume + Status */}
            <div style={rightSectionStyle}>
                {isPlaying && (
                    <span style={{
                        color: '#1DB954',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#1DB954',
                            animation: 'pulse 1.5s infinite',
                        }} />
                        Playing
                    </span>
                )}

                <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer' }}>
                    {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    style={{
                        width: '100px',
                        height: '4px',
                        appearance: 'none',
                        backgroundColor: '#4d4d4d',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: `linear-gradient(to right, #FE5F6F ${volume * 100}%, #4d4d4d ${volume * 100}%)`,
                    }}
                />

                {/* Lyrics Button */}
                <button
                    onClick={() => setShowLyrics(!showLyrics)}
                    title="Lyrics"
                    style={{
                        background: showLyrics ? 'rgba(29, 185, 84, 0.2)' : 'none',
                        border: showLyrics ? '1px solid #1DB954' : 'none',
                        color: showLyrics ? '#1DB954' : '#b3b3b3',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '4px',
                        marginLeft: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Mic2 size={18} />
                </button>
            </div>

            {/* Lyrics Panel */}
            <LyricsPanel isOpen={showLyrics} onClose={() => setShowLyrics(false)} />

            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #fff;
                    cursor: pointer;
                    opacity: 0;
                    transition: opacity 0.15s;
                }
                input[type="range"]:hover::-webkit-slider-thumb {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}
