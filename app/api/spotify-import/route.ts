import { NextRequest, NextResponse } from 'next/server';

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

// Import a Spotify playlist - try multiple approaches
export async function GET(request: NextRequest) {
    const playlistId = request.nextUrl.searchParams.get('playlistId');

    if (!playlistId) {
        return NextResponse.json({
            success: false,
            error: 'Playlist ID is required'
        }, { status: 400 });
    }

    console.log('Importing Spotify playlist:', playlistId);

    // Try multiple API endpoints
    const endpoints = [
        `https://freefy.app/api/v1/channel/${playlistId}`,
        `https://freefy.app/api/v1/playlists/${playlistId}`,
        `https://freefy.app/api/v1/spotify/playlists/${playlistId}`,
    ];

    for (const url of endpoints) {
        try {
            console.log('Trying:', url);

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://freefy.app/',
                },
            });

            if (!response.ok) {
                console.log(`${url} returned ${response.status}`);
                continue;
            }

            const contentType = response.headers.get('content-type');
            const text = await response.text();

            // Check for HTML response
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                console.log('Got HTML response, trying next');
                continue;
            }

            const data = JSON.parse(text);
            const result = processPlaylistData(data, playlistId);

            if (result.success) {
                return NextResponse.json(result);
            }
        } catch (error) {
            console.error('Error with endpoint:', url, error);
        }
    }

    // Fallback: Use search to find popular songs as a demo
    try {
        console.log('All endpoints failed, using fallback search');

        // Search for generic popular songs
        const searchResponse = await fetch(
            'https://freefy.app/api/v1/channel/discover',
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                },
            }
        );

        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            const result = processPlaylistData(searchData, 'discover');

            if (result.success && result.songs.length > 0) {
                return NextResponse.json({
                    ...result,
                    playlist: {
                        name: 'Imported Playlist',
                        description: 'Songs from Kudo',
                        image: null,
                    },
                    note: 'Could not access Spotify playlist directly. Showing popular songs instead.',
                });
            }
        }
    } catch (e) {
        console.error('Fallback also failed:', e);
    }

    return NextResponse.json({
        success: false,
        error: 'Could not import playlist. The Spotify playlist API may be temporarily unavailable. Please try again later or create a playlist manually.'
    });
}

interface ProcessedResult {
    success: boolean;
    songs: Song[];
    playlist: {
        name: string;
        description: string;
        image: string | null;
    };
    total: number;
}

function processPlaylistData(data: any, playlistId: string): ProcessedResult {
    // Extract data from various possible response structures
    let rawData = data;

    if (data.channel) rawData = data.channel;
    if (data.playlist) rawData = data.playlist;
    if (data.data) rawData = data.data;

    // Find tracks array
    let tracks: any[] = [];

    // Try various nested structures
    const possibleTrackPaths = [
        rawData?.content?.data,
        rawData?.tracks?.data,
        rawData?.tracks,
        rawData?.songs,
        rawData?.items,
        data?.content?.data,
        data?.tracks?.data,
        data?.data,
        Array.isArray(data) ? data : null,
    ];

    for (const path of possibleTrackPaths) {
        if (Array.isArray(path) && path.length > 0) {
            tracks = path.filter((item: any) =>
                item.model_type === 'track' || item.src || item.name
            );
            if (tracks.length > 0) break;
        }
    }

    console.log(`Found ${tracks.length} tracks`);

    if (tracks.length === 0) {
        return {
            success: false,
            songs: [],
            playlist: { name: '', description: '', image: null },
            total: 0,
        };
    }

    const songs: Song[] = tracks
        .filter((track: any) => track.name && track.src)
        .slice(0, 50) // Limit to 50 songs
        .map((track: any) => {
            // Extract YouTube ID
            let youtubeId = track.src;
            if (youtubeId?.includes('youtube.com/watch?v=')) {
                youtubeId = youtubeId.split('v=')[1]?.split('&')[0];
            } else if (youtubeId?.includes('youtu.be/')) {
                youtubeId = youtubeId.split('youtu.be/')[1]?.split('?')[0];
            }

            // Get best image
            let imageUrl = track.album?.image ||
                track.image ||
                track.artists?.[0]?.image_small ||
                track.artists?.[0]?.image;

            // Upgrade to larger image
            if (imageUrl?.includes('ab67616d00001e02')) {
                imageUrl = imageUrl.replace('ab67616d00001e02', 'ab67616d0000b273');
            }

            return {
                id: String(track.id || Math.random().toString(36).substr(2, 9)),
                title: track.name,
                artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
                album: track.album?.name || '',
                image: imageUrl || `https://picsum.photos/seed/${track.id}/300`,
                freefyId: String(track.id),
                youtubeId: youtubeId,
                duration: track.duration ? Math.round(track.duration / 1000) : undefined,
            };
        })
        .filter((song: Song) => song.youtubeId);

    console.log(`Processed ${songs.length} playable songs`);

    return {
        success: songs.length > 0,
        songs,
        playlist: {
            name: rawData?.name || 'Imported Playlist',
            description: rawData?.description || '',
            image: rawData?.image || null,
        },
        total: songs.length,
    };
}
