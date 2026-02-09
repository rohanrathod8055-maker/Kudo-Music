'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Music2, Loader2 } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

interface LyricsLine {
    time: number;
    text: string;
}

interface LyricsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LyricsPanel({ isOpen, onClose }: LyricsPanelProps) {
    const [lyrics, setLyrics] = useState<LyricsLine[]>([]);
    const [plainLyrics, setPlainLyrics] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeLine, setActiveLine] = useState<number>(-1);
    const [isSynced, setIsSynced] = useState(false);

    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

    const { currentSong, progress, isPlaying } = usePlayerStore();

    // Fetch lyrics when song changes
    useEffect(() => {
        if (!currentSong) {
            setLyrics([]);
            setPlainLyrics('');
            setError(null);
            return;
        }

        const fetchLyrics = async () => {
            setLoading(true);
            setError(null);
            setLyrics([]);
            setPlainLyrics('');
            setActiveLine(-1);

            try {
                const params = new URLSearchParams({
                    title: currentSong.title,
                    artist: currentSong.artist.split(',')[0].trim(), // Use first artist
                });
                if (currentSong.duration) {
                    params.set('duration', String(currentSong.duration));
                }

                const response = await fetch(`/api/lyrics?${params}`);
                const data = await response.json();

                if (data.success) {
                    if (data.lyrics && data.lyrics.length > 0) {
                        setLyrics(data.lyrics);
                        setIsSynced(true);
                        lineRefs.current = new Array(data.lyrics.length).fill(null);
                    } else if (data.plainLyrics) {
                        setPlainLyrics(data.plainLyrics);
                        setIsSynced(false);
                    } else {
                        setError('No lyrics found');
                    }
                } else {
                    setError(data.error || 'Lyrics not found');
                }
            } catch (err) {
                console.error('Lyrics fetch error:', err);
                setError('Failed to load lyrics');
            } finally {
                setLoading(false);
            }
        };

        fetchLyrics();
    }, [currentSong?.id]);

    // Sync active line with playback progress
    useEffect(() => {
        if (!isSynced || lyrics.length === 0) return;

        // Find the current line based on progress
        let currentLine = -1;
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (progress >= lyrics[i].time) {
                currentLine = i;
                break;
            }
        }

        if (currentLine !== activeLine) {
            setActiveLine(currentLine);

            // Auto-scroll to active line
            if (currentLine >= 0 && lineRefs.current[currentLine] && lyricsContainerRef.current) {
                const lineEl = lineRefs.current[currentLine];
                const containerEl = lyricsContainerRef.current;

                if (lineEl) {
                    const lineTop = lineEl.offsetTop;
                    const containerHeight = containerEl.clientHeight;
                    const scrollTarget = lineTop - containerHeight / 2 + lineEl.clientHeight / 2;

                    containerEl.scrollTo({
                        top: scrollTarget,
                        behavior: 'smooth',
                    });
                }
            }
        }
    }, [progress, lyrics, isSynced, activeLine]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: '90px',
            width: '400px',
            backgroundColor: '#0a0a0a',
            borderLeft: '1px solid #282828',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50,
            animation: 'slideIn 0.3s ease',
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                borderBottom: '1px solid #282828',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Music2 size={24} color="#1DB954" />
                    <span style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>Lyrics</span>
                    {isSynced && lyrics.length > 0 && (
                        <span style={{
                            padding: '2px 8px',
                            backgroundColor: '#1DB954',
                            color: '#000',
                            fontSize: '10px',
                            fontWeight: 700,
                            borderRadius: '10px',
                            textTransform: 'uppercase',
                        }}>
                            Synced
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#b3b3b3',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Song Info */}
            {currentSong && (
                <div style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderBottom: '1px solid #1a1a1a',
                }}>
                    <img
                        src={currentSong.image}
                        alt={currentSong.title}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                        }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: 600,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {currentSong.title}
                        </p>
                        <p style={{
                            color: '#b3b3b3',
                            fontSize: '12px',
                            margin: 0,
                        }}>
                            {currentSong.artist}
                        </p>
                    </div>
                </div>
            )}

            {/* Lyrics Content */}
            <div
                ref={lyricsContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '40px 24px',
                    scrollBehavior: 'smooth',
                }}
            >
                {/* Loading State */}
                {loading && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        gap: '12px',
                    }}>
                        <Loader2 size={24} color="#1DB954" style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ color: '#b3b3b3' }}>Finding lyrics...</span>
                    </div>
                )}

                {/* Error/No Song State */}
                {!loading && !currentSong && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        gap: '12px',
                        textAlign: 'center',
                    }}>
                        <Music2 size={48} color="#535353" />
                        <p style={{ color: '#b3b3b3' }}>Play a song to see lyrics</p>
                    </div>
                )}

                {/* Error State */}
                {!loading && currentSong && error && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        gap: '12px',
                        textAlign: 'center',
                        padding: '0 20px',
                    }}>
                        <Music2 size={48} color="#535353" />
                        <p style={{ color: '#b3b3b3' }}>{error}</p>
                        <p style={{ color: '#535353', fontSize: '12px' }}>
                            Try searching for different songs
                        </p>
                    </div>
                )}

                {/* Synced Lyrics */}
                {!loading && lyrics.length > 0 && (
                    <div style={{ paddingBottom: '100px' }}>
                        {lyrics.map((line, index) => (
                            <p
                                key={index}
                                ref={el => { lineRefs.current[index] = el; }}
                                style={{
                                    fontSize: activeLine === index ? '28px' : '22px',
                                    fontWeight: activeLine === index ? 700 : 500,
                                    color: activeLine === index ? '#fff' :
                                        index < activeLine ? '#535353' : '#808080',
                                    margin: '16px 0',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    lineHeight: 1.4,
                                    transform: activeLine === index ? 'scale(1.02)' : 'scale(1)',
                                }}
                            >
                                {line.text}
                            </p>
                        ))}
                    </div>
                )}

                {/* Plain Lyrics */}
                {!loading && plainLyrics && (
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                        {plainLyrics.split('\n').map((line, index) => (
                            <p
                                key={index}
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 500,
                                    color: '#b3b3b3',
                                    margin: '12px 0',
                                    lineHeight: 1.5,
                                }}
                            >
                                {line || '\u00A0'}
                            </p>
                        ))}
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
