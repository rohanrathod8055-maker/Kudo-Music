'use client';

import { useState, useEffect, CSSProperties } from 'react';
import { Clock, Search, X, Heart } from 'lucide-react';
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

interface SongListProps {
    onSongsLoaded?: (count: number) => void;
    channel?: string; // 'discover', 'new-releases', 'viral-top-100', etc.
    showSearch?: boolean;
}

const styles: Record<string, CSSProperties> = {
    container: {
        padding: '0 24px 100px 24px',
    },
    searchContainer: {
        marginBottom: '24px',
        position: 'relative',
    },
    searchInput: {
        width: '100%',
        maxWidth: '400px',
        padding: '12px 16px 12px 44px',
        backgroundColor: '#282828',
        border: 'none',
        borderRadius: '24px',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
    },
    searchIcon: {
        position: 'absolute',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#b3b3b3',
    },
    clearButton: {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: '#b3b3b3',
        cursor: 'pointer',
        padding: '4px',
    },
    tableHeader: {
        display: 'grid',
        gridTemplateColumns: '40px 1fr 1fr 40px 80px',
        gap: '16px',
        padding: '12px 16px',
        borderBottom: '1px solid #282828',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: '#6b7280',
    },
    songRow: {
        display: 'grid',
        gridTemplateColumns: '40px 1fr 1fr 40px 80px',
        gap: '16px',
        padding: '8px 16px',
        alignItems: 'center',
        cursor: 'pointer',
        borderRadius: '4px',
    },
    thumbnail: {
        width: '40px',
        height: '40px',
        minWidth: '40px',
        minHeight: '40px',
        maxWidth: '40px',
        maxHeight: '40px',
        objectFit: 'cover' as const,
        borderRadius: '4px',
        flexShrink: 0,
    },
    titleContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: 0,
    },
    titleText: {
        fontSize: '14px',
        color: '#ffffff',
        margin: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    artistText: {
        fontSize: '14px',
        color: '#9ca3af',
        margin: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    timeText: {
        fontSize: '14px',
        color: '#9ca3af',
        textAlign: 'right' as const,
    },
    indexText: {
        fontSize: '14px',
        color: '#9ca3af',
        textAlign: 'center' as const,
    },
    loadingText: {
        color: '#9ca3af',
        textAlign: 'center' as const,
        padding: '40px 0',
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center' as const,
        padding: '40px 0',
    },
};

export function SongList({ onSongsLoaded, channel = 'discover', showSearch = true }: SongListProps) {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());

    const { currentSong, setCurrentSong, setIsPlaying } = usePlayerStore();

    // Load liked songs from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('likedSongs');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setLikedSongs(new Set(parsed.map((s: Song) => s.id)));
            } catch (e) { }
        }
    }, []);

    const fetchSongs = async (query?: string) => {
        try {
            setLoading(true);
            setError(null);

            let url = `/api/songs?channel=${channel}&limit=100`;
            if (query) {
                url = `/api/songs?q=${encodeURIComponent(query)}&limit=100`;
            }

            console.log('Fetching:', url);
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to fetch songs');
            }

            console.log(`Loaded ${data.songs?.length || 0} songs`);
            setSongs(data.songs || []);
            onSongsLoaded?.(data.songs?.length || 0);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load songs');
        } finally {
            setLoading(false);
            setSearching(false);
        }
    };

    useEffect(() => {
        fetchSongs();
    }, [channel]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setSearching(true);
            fetchSongs(searchQuery.trim());
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        fetchSongs();
    };

    const formatDuration = (seconds?: number): string => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSongClick = (song: Song) => {
        console.log('Playing:', song.title, '| YouTube:', song.youtubeId);
        setCurrentSong(song);
        setIsPlaying(true);
    };

    const toggleLike = (song: Song, e: React.MouseEvent) => {
        e.stopPropagation();

        const saved = localStorage.getItem('likedSongs');
        let likedList: Song[] = saved ? JSON.parse(saved) : [];

        if (likedSongs.has(song.id)) {
            // Remove from liked
            likedList = likedList.filter(s => s.id !== song.id);
            setLikedSongs(prev => {
                const next = new Set(prev);
                next.delete(song.id);
                return next;
            });
        } else {
            // Add to liked
            likedList.push(song);
            setLikedSongs(prev => new Set(prev).add(song.id));
        }

        localStorage.setItem('likedSongs', JSON.stringify(likedList));
    };

    if (loading && songs.length === 0) {
        return (
            <div style={styles.container}>
                <p style={styles.loadingText}>
                    {searching ? `Searching for "${searchQuery}"...` : 'Loading songs...'}
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <p style={styles.errorText}>{error}</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Search Bar */}
            {showSearch && (
                <form onSubmit={handleSearch} style={styles.searchContainer as CSSProperties}>
                    <Search size={20} style={styles.searchIcon as CSSProperties} />
                    <input
                        type="text"
                        placeholder="Search for songs, artists..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchInput}
                    />
                    {searchQuery && (
                        <button type="button" onClick={clearSearch} style={styles.clearButton as CSSProperties}>
                            <X size={18} />
                        </button>
                    )}
                </form>
            )}

            {/* Table Header */}
            <div style={styles.tableHeader as CSSProperties}>
                <span style={{ textAlign: 'center' }}>#</span>
                <span>TITLE</span>
                <span>ARTIST</span>
                <span></span>
                <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Clock size={14} />
                </span>
            </div>

            {/* Song Rows */}
            {songs.map((song, index) => {
                const isPlaying = currentSong?.id === song.id;
                const isHovered = hoveredRow === song.id;
                const isLiked = likedSongs.has(song.id);

                return (
                    <div
                        key={song.id}
                        style={{
                            ...styles.songRow,
                            backgroundColor: isHovered ? 'rgba(255,255,255,0.1)' :
                                isPlaying ? 'rgba(254, 95, 111, 0.1)' : 'transparent',
                        }}
                        onClick={() => handleSongClick(song)}
                        onMouseEnter={() => setHoveredRow(song.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                    >
                        <span style={{
                            ...styles.indexText,
                            color: isPlaying ? '#FE5F6F' : '#9ca3af',
                        }}>
                            {index + 1}
                        </span>

                        <div style={styles.titleContainer}>
                            <img
                                src={song.image}
                                alt={song.title}
                                style={styles.thumbnail}
                                onError={(e) => {
                                    e.currentTarget.src = `https://picsum.photos/seed/${song.freefyId}/40`;
                                }}
                            />
                            <p style={{
                                ...styles.titleText,
                                color: isPlaying ? '#FE5F6F' : '#ffffff',
                            }}>
                                {song.title}
                            </p>
                        </div>

                        <p style={styles.artistText}>{song.artist}</p>

                        <button
                            onClick={(e) => toggleLike(song, e)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                opacity: isHovered || isLiked ? 1 : 0,
                                transition: 'opacity 0.15s',
                            }}
                        >
                            <Heart
                                size={16}
                                fill={isLiked ? '#1DB954' : 'transparent'}
                                color={isLiked ? '#1DB954' : '#b3b3b3'}
                            />
                        </button>

                        <span style={styles.timeText}>{formatDuration(song.duration)}</span>
                    </div>
                );
            })}

            {songs.length === 0 && !loading && (
                <p style={{ ...styles.loadingText, marginTop: '40px' }}>
                    No songs found. Try a different search.
                </p>
            )}
        </div>
    );
}
