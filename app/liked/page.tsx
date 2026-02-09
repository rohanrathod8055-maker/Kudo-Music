'use client';

import { useState, useEffect } from 'react';
import { Heart, Clock } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

interface Song {
    id: string;
    title: string;
    artist: string;
    album?: string;
    image: string;
    freefyId: string;
    youtubeId?: string;
    duration?: number;
}

export default function LikedSongsPage() {
    const [likedSongs, setLikedSongs] = useState<Song[]>([]);
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);
    const { currentSong, setCurrentSong, setIsPlaying } = usePlayerStore();

    useEffect(() => {
        // Load liked songs from localStorage
        const saved = localStorage.getItem('likedSongs');
        if (saved) {
            try {
                setLikedSongs(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse liked songs:', e);
            }
        }
    }, []);

    const formatDuration = (seconds?: number): string => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSongClick = (song: Song) => {
        setCurrentSong(song);
        setIsPlaying(true);
    };

    const removeSong = (songId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = likedSongs.filter(s => s.id !== songId);
        setLikedSongs(updated);
        localStorage.setItem('likedSongs', JSON.stringify(updated));
    };

    return (
        <div style={{
            backgroundColor: '#000000',
            minHeight: '100%',
            paddingBottom: '100px',
        }}>
            {/* Header with gradient */}
            <div style={{
                padding: '60px 24px 24px 24px',
                background: 'linear-gradient(180deg, #5038a0 0%, #000000 100%)',
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
                    <div style={{
                        width: '232px',
                        height: '232px',
                        background: 'linear-gradient(135deg, #450af5, #c4efd9)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}>
                        <Heart size={80} fill="#fff" color="#fff" />
                    </div>
                    <div>
                        <p style={{
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            color: '#fff',
                            marginBottom: '8px',
                        }}>PLAYLIST</p>
                        <h1 style={{
                            fontSize: '72px',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            margin: 0,
                            lineHeight: 1,
                        }}>Liked Songs</h1>
                        <p style={{
                            fontSize: '14px',
                            color: '#b3b3b3',
                            marginTop: '16px',
                        }}>
                            {likedSongs.length} songs
                        </p>
                    </div>
                </div>
            </div>

            {/* Song List */}
            <div style={{ padding: '0 24px' }}>
                {likedSongs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <Heart size={48} style={{ color: '#6b7280', marginBottom: '16px' }} />
                        <p style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>
                            Songs you like will appear here
                        </p>
                        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                            Click the heart icon on any song to add it to your library
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Table Header */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 1fr 40px 80px',
                            gap: '16px',
                            padding: '12px 16px',
                            borderBottom: '1px solid #282828',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            color: '#6b7280',
                        }}>
                            <span style={{ textAlign: 'center' }}>#</span>
                            <span>TITLE</span>
                            <span>ARTIST</span>
                            <span></span>
                            <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Clock size={14} />
                            </span>
                        </div>

                        {/* Song Rows */}
                        {likedSongs.map((song, index) => {
                            const isPlaying = currentSong?.id === song.id;
                            const isHovered = hoveredRow === song.id;

                            return (
                                <div
                                    key={song.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '40px 1fr 1fr 40px 80px',
                                        gap: '16px',
                                        padding: '8px 16px',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        backgroundColor: isHovered ? 'rgba(255,255,255,0.1)' :
                                            isPlaying ? 'rgba(254, 95, 111, 0.1)' : 'transparent',
                                    }}
                                    onClick={() => handleSongClick(song)}
                                    onMouseEnter={() => setHoveredRow(song.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    <span style={{
                                        fontSize: '14px',
                                        color: isPlaying ? '#FE5F6F' : '#9ca3af',
                                        textAlign: 'center',
                                    }}>
                                        {index + 1}
                                    </span>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                        <img
                                            src={song.image}
                                            alt={song.title}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '4px',
                                                objectFit: 'cover',
                                            }}
                                        />
                                        <p style={{
                                            fontSize: '14px',
                                            color: isPlaying ? '#FE5F6F' : '#ffffff',
                                            margin: 0,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {song.title}
                                        </p>
                                    </div>

                                    <p style={{
                                        fontSize: '14px',
                                        color: '#9ca3af',
                                        margin: 0,
                                    }}>
                                        {song.artist}
                                    </p>

                                    <button
                                        onClick={(e) => removeSong(song.id, e)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                        }}
                                    >
                                        <Heart size={16} fill="#1DB954" color="#1DB954" />
                                    </button>

                                    <span style={{
                                        fontSize: '14px',
                                        color: '#9ca3af',
                                        textAlign: 'right',
                                    }}>
                                        {formatDuration(song.duration)}
                                    </span>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
}
