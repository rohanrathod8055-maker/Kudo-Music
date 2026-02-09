'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Play, Pause, Heart, Plus, Music, TrendingUp, Clock, MoreHorizontal } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useToast } from '@/components/Toast';

interface Song {
    id: string;
    title: string;
    artist: string;
    album?: string;
    image: string;
    audioUrl: string;
    duration?: number;
}

// Browse categories for when not searching
const browseCategories = [
    { name: 'Pop', color: '#8D67AB', icon: '🎵' },
    { name: 'Hip-Hop', color: '#BA5D07', icon: '🎤' },
    { name: 'Rock', color: '#E61E32', icon: '🎸' },
    { name: 'Dance', color: '#DC148C', icon: '💃' },
    { name: 'R&B', color: '#1E3264', icon: '🎹' },
    { name: 'Indie', color: '#608108', icon: '🌿' },
    { name: 'Latin', color: '#27856A', icon: '🔥' },
    { name: 'Chill', color: '#503750', icon: '😌' },
];

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const [searchQuery, setSearchQuery] = useState(query);
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);
    const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
    const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [playlists, setPlaylists] = useState<{ id: string; name: string; songs: Song[] }[]>([]);

    const { currentSong, isPlaying, setCurrentSong, setIsPlaying } = usePlayerStore();
    const toast = useToast();

    // Load liked songs on mount
    useEffect(() => {
        const saved = localStorage.getItem('likedSongs');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setLikedSongs(new Set(parsed.map((s: Song) => s.id)));
            } catch (e) { }
        }
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            const response = await fetch(`/api/songs?q=${encodeURIComponent(searchQuery.trim())}&limit=50`);
            const data = await response.json();
            setSongs(data.songs || []);
        } catch (error) {
            console.error('Search error:', error);
            setSongs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySearch = (category: string) => {
        setSearchQuery(category);
        setTimeout(() => {
            handleSearch();
        }, 0);
    };

    // Auto-search if query param exists
    useEffect(() => {
        if (query) {
            setSearchQuery(query);
            handleSearch();
        }
    }, [query]);

    const formatDuration = (seconds?: number): string => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSongClick = (song: Song) => {
        if (currentSong?.id === song.id) {
            setIsPlaying(!isPlaying);
        } else {
            setCurrentSong(song);
            setIsPlaying(true);
        }
    };

    const toggleLike = (song: Song, e: React.MouseEvent) => {
        e.stopPropagation();
        const saved = localStorage.getItem('likedSongs');
        let likedArr: Song[] = saved ? JSON.parse(saved) : [];

        if (likedSongs.has(song.id)) {
            likedArr = likedArr.filter(s => s.id !== song.id);
            setLikedSongs(prev => {
                const next = new Set(prev);
                next.delete(song.id);
                return next;
            });
        } else {
            likedArr.push(song);
            setLikedSongs(prev => new Set(prev).add(song.id));
        }

        localStorage.setItem('likedSongs', JSON.stringify(likedArr));
    };

    const addToPlaylist = (song: Song, e: React.MouseEvent) => {
        e.stopPropagation();
        // Get existing playlists
        const savedPlaylists = JSON.parse(localStorage.getItem('playlists') || '[]');
        if (savedPlaylists.length === 0) {
            toast.warning('Create a playlist first from the Playlists page!');
            return;
        }
        // Show playlist selector
        setPlaylists(savedPlaylists);
        setSelectedSong(song);
        setShowPlaylistSelector(true);
    };

    const confirmAddToPlaylist = (playlistId: string) => {
        if (!selectedSong) return;

        const savedPlaylists = JSON.parse(localStorage.getItem('playlists') || '[]');
        const playlistIndex = savedPlaylists.findIndex((p: any) => p.id === playlistId);

        if (playlistIndex === -1) return;

        const playlist = savedPlaylists[playlistIndex];
        if (!playlist.songs) playlist.songs = [];

        if (!playlist.songs.find((s: Song) => s.id === selectedSong.id)) {
            playlist.songs.push(selectedSong);
            localStorage.setItem('playlists', JSON.stringify(savedPlaylists));
            toast.success(`Added "${selectedSong.title}" to ${playlist.name}`);
        } else {
            toast.info(`"${selectedSong.title}" is already in ${playlist.name}`);
        }

        setShowPlaylistSelector(false);
        setSelectedSong(null);
    };

    return (
        <div style={{
            backgroundColor: '#121212',
            minHeight: '100%',
            paddingBottom: '100px',
        }}>
            {/* Hero Search Section */}
            <div style={{
                background: 'linear-gradient(180deg, #1a1a2e 0%, #121212 100%)',
                padding: '40px 32px 32px 32px',
            }}>
                {/* Search Bar */}
                <form onSubmit={handleSearch} style={{
                    maxWidth: '720px',
                    margin: '0 auto',
                }}>
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        borderRadius: '500px',
                        padding: '4px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}>
                        <Search size={22} style={{
                            position: 'absolute',
                            left: '20px',
                            color: '#121212',
                        }} />
                        <input
                            type="text"
                            placeholder="What do you want to listen to?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '16px 16px 16px 54px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#121212',
                                fontSize: '15px',
                                fontWeight: 500,
                                outline: 'none',
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !searchQuery.trim()}
                            style={{
                                padding: '12px 32px',
                                backgroundColor: '#FE5F6F',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '500px',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: searchQuery.trim() ? 'pointer' : 'not-allowed',
                                opacity: searchQuery.trim() ? 1 : 0.6,
                                transition: 'all 0.2s',
                            }}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </form>
            </div>

            <div style={{ padding: '0 32px' }}>
                {/* Loading State */}
                {loading && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '60px 0',
                    }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            border: '3px solid #282828',
                            borderTop: '3px solid #FE5F6F',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }} />
                        <span style={{ color: '#b3b3b3', fontSize: '16px' }}>
                            Searching for "{searchQuery}"...
                        </span>
                    </div>
                )}

                {/* Results */}
                {!loading && searched && songs.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '20px',
                        }}>
                            <h2 style={{
                                color: '#fff',
                                fontSize: '24px',
                                fontWeight: 700,
                                margin: 0,
                            }}>
                                Results for "{searchQuery}"
                            </h2>
                            <span style={{
                                color: '#b3b3b3',
                                fontSize: '14px',
                            }}>
                                {songs.length} songs found
                            </span>
                        </div>

                        {/* Song Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '24px',
                        }}>
                            {songs.map((song) => {
                                const isCurrent = currentSong?.id === song.id;
                                const isLiked = likedSongs.has(song.id);
                                const isHovered = hoveredRow === song.id;

                                return (
                                    <div
                                        key={song.id}
                                        style={{
                                            backgroundColor: isHovered ? '#282828' : '#181818',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            position: 'relative',
                                        }}
                                        onClick={() => handleSongClick(song)}
                                        onMouseEnter={() => setHoveredRow(song.id)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                    >
                                        {/* Album Art */}
                                        <div style={{
                                            position: 'relative',
                                            marginBottom: '16px',
                                        }}>
                                            <img
                                                src={song.image}
                                                alt={song.title}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '1',
                                                    borderRadius: '6px',
                                                    objectFit: 'cover',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                                }}
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://picsum.photos/seed/${song.id}/300`;
                                                }}
                                            />
                                            {/* Play Button Overlay */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '8px',
                                                right: '8px',
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                backgroundColor: '#1DB954',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: isHovered || isCurrent ? 1 : 0,
                                                transform: isHovered || isCurrent ? 'translateY(0)' : 'translateY(8px)',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 8px 8px rgba(0,0,0,0.3)',
                                            }}>
                                                {isCurrent && isPlaying ? (
                                                    <Pause size={24} fill="#000" color="#000" />
                                                ) : (
                                                    <Play size={24} fill="#000" color="#000" style={{ marginLeft: '2px' }} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Song Info */}
                                        <p style={{
                                            color: isCurrent ? '#1DB954' : '#fff',
                                            fontSize: '15px',
                                            fontWeight: 600,
                                            margin: '0 0 6px 0',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {song.title}
                                        </p>
                                        <p style={{
                                            color: '#b3b3b3',
                                            fontSize: '13px',
                                            margin: 0,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {song.artist}
                                        </p>

                                        {/* Quick Actions */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '8px',
                                            marginTop: '12px',
                                            opacity: isHovered ? 1 : 0,
                                            transition: 'opacity 0.2s',
                                        }}>
                                            <button
                                                onClick={(e) => toggleLike(song, e)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    color: isLiked ? '#1DB954' : '#b3b3b3',
                                                }}
                                                title={isLiked ? 'Remove from Liked' : 'Add to Liked'}
                                            >
                                                <Heart size={18} fill={isLiked ? '#1DB954' : 'transparent'} />
                                            </button>
                                            <button
                                                onClick={(e) => addToPlaylist(song, e)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    color: '#b3b3b3',
                                                }}
                                                title="Add to Playlist"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* No Results */}
                {!loading && searched && songs.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                    }}>
                        <Music size={64} style={{ color: '#535353', marginBottom: '24px' }} />
                        <h3 style={{
                            color: '#fff',
                            fontSize: '24px',
                            fontWeight: 700,
                            marginBottom: '8px',
                        }}>
                            No results found for "{searchQuery}"
                        </h3>
                        <p style={{
                            color: '#b3b3b3',
                            fontSize: '16px',
                            maxWidth: '400px',
                            margin: '0 auto',
                        }}>
                            Please make sure your words are spelled correctly, or use fewer or different keywords.
                        </p>
                    </div>
                )}

                {/* Browse Categories (when not searched) */}
                {!searched && (
                    <div style={{ marginTop: '24px' }}>
                        <h2 style={{
                            color: '#fff',
                            fontSize: '24px',
                            fontWeight: 700,
                            marginBottom: '20px',
                        }}>
                            Browse all
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '24px',
                        }}>
                            {browseCategories.map((category) => (
                                <div
                                    key={category.name}
                                    onClick={() => handleCategorySearch(category.name)}
                                    style={{
                                        backgroundColor: category.color,
                                        borderRadius: '8px',
                                        padding: '20px',
                                        cursor: 'pointer',
                                        minHeight: '120px',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'transform 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <span style={{
                                        color: '#fff',
                                        fontSize: '22px',
                                        fontWeight: 700,
                                    }}>
                                        {category.name}
                                    </span>
                                    <span style={{
                                        position: 'absolute',
                                        bottom: '-5px',
                                        right: '-5px',
                                        fontSize: '64px',
                                        transform: 'rotate(25deg)',
                                        opacity: 0.8,
                                    }}>
                                        {category.icon}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Playlist Selector Modal */}
            {showPlaylistSelector && selectedSong && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }} onClick={() => setShowPlaylistSelector(false)}>
                    <div style={{
                        background: 'linear-gradient(180deg, #282828 0%, #1a1a1a 100%)',
                        borderRadius: '16px',
                        padding: '24px',
                        width: '340px',
                        maxWidth: '90%',
                        maxHeight: '70vh',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: 700,
                            margin: '0 0 8px 0',
                        }}>
                            Add to Playlist
                        </h3>
                        <p style={{
                            color: '#b3b3b3',
                            fontSize: '13px',
                            margin: '0 0 20px 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            "{selectedSong.title}" by {selectedSong.artist}
                        </p>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                        }}>
                            {playlists.map((playlist) => (
                                <button
                                    key={playlist.id}
                                    onClick={() => confirmAddToPlaylist(playlist.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        backgroundColor: '#3e3e3e',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#4a4a4a';
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#3e3e3e';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '4px',
                                        background: 'linear-gradient(135deg, #7B2CBF, #E040FB)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Music size={20} color="#fff" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            color: '#fff',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            margin: 0,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {playlist.name}
                                        </p>
                                        <p style={{
                                            color: '#b3b3b3',
                                            fontSize: '12px',
                                            margin: '2px 0 0 0',
                                        }}>
                                            {playlist.songs?.length || 0} songs
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowPlaylistSelector(false)}
                            style={{
                                width: '100%',
                                marginTop: '16px',
                                padding: '12px',
                                backgroundColor: 'transparent',
                                color: '#b3b3b3',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '500px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div style={{
                backgroundColor: '#121212',
                minHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
            }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid #282828',
                    borderTop: '3px solid #FE5F6F',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }} />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
