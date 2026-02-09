import { NextRequest, NextResponse } from 'next/server';

export interface Song {
    id: string;
    title: string;
    artist: string;
    album?: string;
    image: string;
    freefyId: string;
    youtubeId?: string;
    duration?: number;
}

// Channel mapping - some channels may return different results
const CHANNEL_ENDPOINTS: Record<string, string[]> = {
    'discover': ['https://freefy.app/api/v1/channel/discover'],
    'new-releases': ['https://freefy.app/api/v1/channel/new-releases'],
    'viral-top-100': ['https://freefy.app/api/v1/channel/discover'], // fallback to discover
    'top-charts': ['https://freefy.app/api/v1/channel/top-charts', 'https://freefy.app/api/v1/channel/discover'],
    'popular': ['https://freefy.app/api/v1/channel/discover'],
};

// Fetch tracks from a channel
async function fetchChannel(url: string): Promise<any[]> {
    console.log('Fetching:', url);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            console.error(`Failed: ${url} - ${response.status}`);
            return [];
        }

        const data = await response.json();
        const tracks: any[] = [];

        // Handle nested channel structure (Discover page)
        if (data.channel?.content?.data) {
            for (const item of data.channel.content.data) {
                // Direct track
                if (item.model_type === 'track') {
                    tracks.push(item);
                }
                // Sub-channel with tracks (like Today's Top Hits within Discover)
                if (item.content?.data) {
                    for (const subItem of item.content.data) {
                        if (subItem.model_type === 'track') {
                            tracks.push(subItem);
                        }
                    }
                }
            }
        }

        console.log(`Got ${tracks.length} tracks from ${url}`);
        return tracks;
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
}

// Search Freefy for tracks - uses their search API with proper headers
async function searchTracks(query: string, limit: number = 50): Promise<any[]> {
    // Freefy's search requires specific headers to get JSON response
    const searchUrls = [
        `https://freefy.app/api/v1/search/${encodeURIComponent(query)}?limit=${limit}&modelTypes=track`,
        `https://freefy.app/api/v1/search?query=${encodeURIComponent(query)}&limit=${limit}&modelTypes=track`,
    ];

    for (const url of searchUrls) {
        console.log('Searching:', url);

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': 'https://freefy.app/search',
                },
            });

            if (!response.ok) {
                console.log(`Search returned ${response.status}`);
                continue;
            }

            // Check if we got JSON
            const contentType = response.headers.get('content-type');
            const text = await response.text();

            // Check if response starts with HTML
            if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
                console.log('Got HTML response, trying next URL');
                continue;
            }

            try {
                const data = JSON.parse(text);
                let tracks: any[] = [];

                // Try different response formats from Freefy API
                if (data.results?.tracks?.data) {
                    tracks = data.results.tracks.data;
                } else if (data.tracks?.data) {
                    tracks = data.tracks.data;
                } else if (data.results?.data) {
                    tracks = data.results.data.filter((r: any) => r.model_type === 'track');
                } else if (data.results && Array.isArray(data.results)) {
                    tracks = data.results.filter((r: any) => r.model_type === 'track');
                } else if (data.data && Array.isArray(data.data)) {
                    tracks = data.data.filter((r: any) => r.model_type === 'track');
                } else if (Array.isArray(data)) {
                    tracks = data.filter((r: any) => r.model_type === 'track');
                }

                if (tracks.length > 0) {
                    console.log(`Search found ${tracks.length} tracks`);
                    return tracks;
                }

                console.log('Parsed JSON but no tracks found. Keys:', Object.keys(data));
            } catch (parseErr) {
                console.log('Failed to parse JSON:', parseErr);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    // Fallback: If API search fails, filter from discover channel
    console.log('API search failed, falling back to discover channel filter');
    const discoverTracks = await fetchChannel('https://freefy.app/api/v1/channel/discover');
    const queryLower = query.toLowerCase();

    const filtered = discoverTracks.filter((track: any) => {
        const name = (track.name || '').toLowerCase();
        const artists = track.artists?.map((a: any) => a.name.toLowerCase()).join(' ') || '';
        return name.includes(queryLower) || artists.includes(queryLower);
    });

    console.log(`Fallback search found ${filtered.length} tracks matching "${query}"`);
    return filtered;
}

function transformTrack(track: any): Song | null {
    try {
        if (!track.name) return null;

        // Get artist names
        const artists = track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';

        // Get image - prefer album, then track, then fallback
        let imageUrl = track.album?.image ||
            track.image ||
            track.artists?.[0]?.image_small ||
            `https://picsum.photos/seed/${track.id}/300`;

        // Use higher quality Spotify images
        if (imageUrl?.includes('ab67616d00001e02')) {
            imageUrl = imageUrl.replace('ab67616d00001e02', 'ab67616d0000b273');
        }

        // Get YouTube ID - handle both formats
        let youtubeId = track.src;
        if (youtubeId?.includes('youtube.com/watch?v=')) {
            youtubeId = youtubeId.split('v=')[1]?.split('&')[0];
        }

        return {
            id: String(track.id),
            title: track.name,
            artist: artists,
            album: track.album?.name || track.album_name || '',
            image: imageUrl,
            freefyId: String(track.id),
            youtubeId: youtubeId || undefined,
            duration: track.duration ? Math.round(track.duration / 1000) : undefined,
        };
    } catch (error) {
        console.error('Transform error:', error);
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q') || searchParams.get('query');
        const channelName = searchParams.get('channel') || 'discover';
        const limit = parseInt(searchParams.get('limit') || '100');

        console.log('=== Songs API ===');
        console.log('Query:', query, 'Channel:', channelName, 'Limit:', limit);

        let allTracks: any[] = [];

        // Search mode
        if (query) {
            console.log('Searching for:', query);
            allTracks = await searchTracks(query, limit);
        }
        // Channel mode
        else {
            const endpoints = CHANNEL_ENDPOINTS[channelName] || CHANNEL_ENDPOINTS['discover'];

            for (const endpoint of endpoints) {
                const tracks = await fetchChannel(endpoint);
                allTracks.push(...tracks);
            }

            console.log(`Total tracks from ${channelName}: ${allTracks.length}`);
        }

        // Transform and filter (only songs with YouTube IDs are playable)
        const songs: Song[] = allTracks
            .map(transformTrack)
            .filter((song): song is Song => song !== null && !!song.youtubeId)
            .slice(0, limit);

        // Deduplicate by song ID
        const seen = new Set<string>();
        const uniqueSongs = songs.filter(song => {
            if (seen.has(song.id)) return false;
            seen.add(song.id);
            return true;
        });

        console.log(`Returning ${uniqueSongs.length} unique songs`);

        // Log first few
        uniqueSongs.slice(0, 3).forEach(s => {
            console.log(`- ${s.title} by ${s.artist}`);
        });

        return NextResponse.json({
            success: true,
            songs: uniqueSongs,
            total: uniqueSongs.length,
            source: query ? 'search' : channelName,
        });

    } catch (error) {
        console.error('Songs API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            songs: [],
        }, { status: 500 });
    }
}
