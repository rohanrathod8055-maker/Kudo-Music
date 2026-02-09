'use client';

import { useState, useEffect } from 'react';
import { Plus, Music, Link, Trash2, Play, Clock, X, ListMusic, ExternalLink } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useToast } from '@/components/Toast';

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

interface Playlist {
    id: string;
    name: string;
    description?: string;
    image?: string;
    songs: Song[];
    createdAt: number;
}

export default function PlaylistsPage() {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [spotifyUrl, setSpotifyUrl] = useState('');
    const [importing, setImporting] = useState(false);
    const [importStatus, setImportStatus] = useState('');
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const { currentSong, isPlaying, setCurrentSong, setIsPlaying } = usePlayerStore();
    const toast = useToast();

    // Load playlists from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('playlists');
        if (saved) {
            try {
                setPlaylists(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse playlists:', e);
            }
        }
    }, []);

    const savePlaylists = (updated: Playlist[]) => {
        setPlaylists(updated);
        localStorage.setItem('playlists', JSON.stringify(updated));
    };

    const createPlaylist = () => {
        if (!newPlaylistName.trim()) return;

        const newPlaylist: Playlist = {
            id: Date.now().toString(),
            name: newPlaylistName.trim(),
            songs: [],
            createdAt: Date.now(),
        };

        savePlaylists([...playlists, newPlaylist]);
        setNewPlaylistName('');
        setShowCreateModal(false);
    };

    const deletePlaylist = (id: string) => {
        savePlaylists(playlists.filter(p => p.id !== id));
        if (selectedPlaylist?.id === id) {
            setSelectedPlaylist(null);
        }
        setDeleteConfirmId(null);
        toast.success('Playlist deleted successfully');
    };

    const removeSongFromPlaylist = (playlistId: string, songId: string) => {
        const updated = playlists.map(p => {
            if (p.id === playlistId) {
                return { ...p, songs: p.songs.filter(s => s.id !== songId) };
            }
            return p;
        });
        savePlaylists(updated);
        if (selectedPlaylist?.id === playlistId) {
            setSelectedPlaylist(updated.find(p => p.id === playlistId) || null);
        }
    };

    // Import from Spotify playlist URL
    const importSpotifyPlaylist = async () => {
        if (!spotifyUrl.trim()) return;

        // Extract playlist ID from Spotify URL
        // Formats: 
        // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
        // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
        let playlistId = '';

        if (spotifyUrl.includes('open.spotify.com/playlist/')) {
            playlistId = spotifyUrl.split('playlist/')[1]?.split('?')[0] || '';
        } else if (spotifyUrl.includes('spotify:playlist:')) {
            playlistId = spotifyUrl.split('spotify:playlist:')[1] || '';
        } else {
            playlistId = spotifyUrl.trim(); // Assume it's just the ID
        }

        if (!playlistId) {
            setImportStatus('Invalid Spotify playlist URL');
            return;
        }

        setImporting(true);
        setImportStatus('Importing playlist...');

        try {
            // Use Freefy's API to fetch Spotify playlist
            const response = await fetch(`/api/spotify-import?playlistId=${playlistId}`);
            const data = await response.json();

            if (data.success && data.playlist) {
                const newPlaylist: Playlist = {
                    id: Date.now().toString(),
                    name: data.playlist.name || `Imported Playlist`,
                    description: data.playlist.description,
                    image: data.playlist.image,
                    songs: data.songs || [],
                    createdAt: Date.now(),
                };

                savePlaylists([...playlists, newPlaylist]);
                setSpotifyUrl('');
                setShowImportModal(false);
                setImportStatus('');
                setSelectedPlaylist(newPlaylist);
            } else {
                setImportStatus(data.error || 'Failed to import playlist. Try another URL.');
            }
        } catch (error) {
            console.error('Import error:', error);
            setImportStatus('Error importing playlist. Please try again.');
        } finally {
            setImporting(false);
        }
    };

    const handleSongClick = (song: Song) => {
        if (currentSong?.id === song.id) {
            setIsPlaying(!isPlaying);
        } else {
            setCurrentSong(song);
            setIsPlaying(true);
        }
    };

    const formatDuration = (seconds?: number): string => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const playAllSongs = (playlist: Playlist) => {
        if (playlist.songs.length > 0) {
            setCurrentSong(playlist.songs[0]);
            setIsPlaying(true);
        }
    };

    return (
        <div style={{
            backgroundColor: '#121212',
            minHeight: '100%',
            paddingBottom: '100px',
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(180deg, #1a1a2e 0%, #121212 100%)',
                padding: '40px 32px 32px 32px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        margin: 0,
                    }}>
                        Your Playlists
                    </h1>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setShowImportModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                backgroundColor: '#1DB954',
                                color: '#000',
                                border: 'none',
                                borderRadius: '500px',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            <ExternalLink size={18} />
                            Import from Spotify
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                backgroundColor: '#FE5F6F',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '500px',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            <Plus size={18} />
                            Create Playlist
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '0 32px' }}>
                {!selectedPlaylist ? (
                    // Playlist Grid
                    <>
                        {playlists.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                                <ListMusic size={64} style={{ color: '#535353', marginBottom: '24px' }} />
                                <h3 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
                                    Create your first playlist
                                </h3>
                                <p style={{ color: '#b3b3b3', fontSize: '16px', marginBottom: '24px' }}>
                                    It's easy, we'll help you
                                </p>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        style={{
                                            padding: '12px 32px',
                                            backgroundColor: '#fff',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '500px',
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Create playlist
                                    </button>
                                    <button
                                        onClick={() => setShowImportModal(true)}
                                        style={{
                                            padding: '12px 32px',
                                            backgroundColor: 'transparent',
                                            color: '#fff',
                                            border: '1px solid #535353',
                                            borderRadius: '500px',
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Import from Spotify
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '24px',
                                marginTop: '24px',
                            }}>
                                {playlists.map((playlist) => (
                                    <div
                                        key={playlist.id}
                                        onClick={() => setSelectedPlaylist(playlist)}
                                        style={{
                                            backgroundColor: '#181818',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.3s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#282828'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181818'}
                                    >
                                        <div style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            borderRadius: '6px',
                                            marginBottom: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: playlist.image
                                                ? `url(${playlist.image}) center/cover`
                                                : 'linear-gradient(135deg, #450af5, #c4efd9)',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                        }}>
                                            {!playlist.image && <Music size={48} color="#fff" />}
                                        </div>
                                        <p style={{
                                            color: '#fff',
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            margin: '0 0 8px 0',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {playlist.name}
                                        </p>
                                        <p style={{
                                            color: '#b3b3b3',
                                            fontSize: '14px',
                                            margin: 0,
                                        }}>
                                            {playlist.songs.length} songs
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    // Playlist Detail View
                    <>
                        <button
                            onClick={() => setSelectedPlaylist(null)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#b3b3b3',
                                background: 'none',
                                border: 'none',
                                fontSize: '14px',
                                cursor: 'pointer',
                                padding: '16px 0',
                            }}
                        >
                            ← Back to playlists
                        </button>

                        {/* Playlist Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', marginBottom: '24px' }}>
                            <div style={{
                                width: '200px',
                                height: '200px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: selectedPlaylist.image
                                    ? `url(${selectedPlaylist.image}) center/cover`
                                    : 'linear-gradient(135deg, #450af5, #c4efd9)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                            }}>
                                {!selectedPlaylist.image && <Music size={64} color="#fff" />}
                            </div>
                            <div>
                                <p style={{ color: '#b3b3b3', fontSize: '12px', marginBottom: '8px' }}>PLAYLIST</p>
                                <h2 style={{ color: '#fff', fontSize: '48px', fontWeight: 700, margin: '0 0 16px 0' }}>
                                    {selectedPlaylist.name}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span style={{ color: '#b3b3b3' }}>{selectedPlaylist.songs.length} songs</span>
                                    <button
                                        onClick={() => playAllSongs(selectedPlaylist)}
                                        disabled={selectedPlaylist.songs.length === 0}
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            backgroundColor: '#1DB954',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: selectedPlaylist.songs.length > 0 ? 'pointer' : 'not-allowed',
                                            opacity: selectedPlaylist.songs.length > 0 ? 1 : 0.5,
                                        }}
                                    >
                                        <Play size={24} fill="#000" color="#000" style={{ marginLeft: '2px' }} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmId(selectedPlaylist.id)}
                                        style={{
                                            color: '#b3b3b3',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Songs Table */}
                        {selectedPlaylist.songs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <p style={{ color: '#b3b3b3' }}>No songs in this playlist yet. Add songs from search!</p>
                            </div>
                        ) : (
                            <>
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

                                {selectedPlaylist.songs.map((song, index) => {
                                    const isCurrent = currentSong?.id === song.id;
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
                                                    isCurrent ? 'rgba(254, 95, 111, 0.1)' : 'transparent',
                                            }}
                                            onClick={() => handleSongClick(song)}
                                            onMouseEnter={() => setHoveredRow(song.id)}
                                            onMouseLeave={() => setHoveredRow(null)}
                                        >
                                            <span style={{ fontSize: '14px', color: isCurrent ? '#FE5F6F' : '#9ca3af', textAlign: 'center' }}>
                                                {index + 1}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                                <img
                                                    src={song.image}
                                                    alt={song.title}
                                                    style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                                                />
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: isCurrent ? '#FE5F6F' : '#fff',
                                                    margin: 0,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {song.title}
                                                </p>
                                            </div>
                                            <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {song.artist}
                                            </p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeSongFromPlaylist(selectedPlaylist.id, song.id);
                                                }}
                                                style={{ color: '#b3b3b3', background: 'none', border: 'none', cursor: 'pointer', opacity: isHovered ? 1 : 0 }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <span style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'right' }}>
                                                {formatDuration(song.duration)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Create Playlist Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }} onClick={() => setShowCreateModal(false)}>
                    <div style={{
                        backgroundColor: '#282828',
                        borderRadius: '12px',
                        padding: '32px',
                        width: '400px',
                        maxWidth: '90%',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h3 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: 0 }}>
                                Create Playlist
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ color: '#b3b3b3', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Playlist name"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '16px',
                                backgroundColor: '#3e3e3e',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '16px',
                                marginBottom: '24px',
                            }}
                        />
                        <button
                            onClick={createPlaylist}
                            disabled={!newPlaylistName.trim()}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: '#1DB954',
                                color: '#000',
                                border: 'none',
                                borderRadius: '500px',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: newPlaylistName.trim() ? 'pointer' : 'not-allowed',
                                opacity: newPlaylistName.trim() ? 1 : 0.5,
                            }}
                        >
                            Create
                        </button>
                    </div>
                </div>
            )}

            {/* Import from Spotify Modal */}
            {showImportModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }} onClick={() => !importing && setShowImportModal(false)}>
                    <div style={{
                        backgroundColor: '#282828',
                        borderRadius: '12px',
                        padding: '32px',
                        width: '500px',
                        maxWidth: '90%',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: 0 }}>
                                Import Spotify Playlist
                            </h3>
                            <button onClick={() => !importing && setShowImportModal(false)} style={{ color: '#b3b3b3', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '24px' }}>
                            Paste a Spotify playlist URL and we'll import all the songs for you!
                        </p>
                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <Link size={20} style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#b3b3b3',
                            }} />
                            <input
                                type="text"
                                placeholder="https://open.spotify.com/playlist/..."
                                value={spotifyUrl}
                                onChange={(e) => setSpotifyUrl(e.target.value)}
                                disabled={importing}
                                style={{
                                    width: '100%',
                                    padding: '16px 16px 16px 48px',
                                    backgroundColor: '#3e3e3e',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#fff',
                                    fontSize: '14px',
                                }}
                            />
                        </div>
                        {importStatus && (
                            <p style={{
                                color: importStatus.includes('Error') || importStatus.includes('Invalid') || importStatus.includes('Failed') ? '#ff6b6b' : '#b3b3b3',
                                fontSize: '14px',
                                marginBottom: '16px',
                            }}>
                                {importStatus}
                            </p>
                        )}
                        <button
                            onClick={importSpotifyPlaylist}
                            disabled={importing || !spotifyUrl.trim()}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: '#1DB954',
                                color: '#000',
                                border: 'none',
                                borderRadius: '500px',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: (importing || !spotifyUrl.trim()) ? 'not-allowed' : 'pointer',
                                opacity: (importing || !spotifyUrl.trim()) ? 0.5 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            {importing ? (
                                <>
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid #000',
                                        borderTop: '2px solid transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                    }} />
                                    Importing...
                                </>
                            ) : (
                                'Import Playlist'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }} onClick={() => setDeleteConfirmId(null)}>
                    <div style={{
                        background: 'linear-gradient(180deg, #282828 0%, #1a1a1a 100%)',
                        borderRadius: '16px',
                        padding: '32px',
                        width: '380px',
                        maxWidth: '90%',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #e91429 0%, #ff6b6b 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                        }}>
                            <Trash2 size={28} color="#fff" />
                        </div>
                        <h3 style={{
                            color: '#fff',
                            fontSize: '20px',
                            fontWeight: 700,
                            margin: '0 0 8px 0',
                            textAlign: 'center',
                        }}>
                            Delete Playlist?
                        </h3>
                        <p style={{
                            color: '#b3b3b3',
                            fontSize: '14px',
                            textAlign: 'center',
                            margin: '0 0 24px 0',
                            lineHeight: '1.5',
                        }}>
                            This action cannot be undone. All songs in this playlist will be removed.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    backgroundColor: 'transparent',
                                    color: '#fff',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '500px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fff'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deletePlaylist(deleteConfirmId)}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    background: 'linear-gradient(135deg, #e91429 0%, #ff6b6b 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '500px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                Delete
                            </button>
                        </div>
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
