import { NextRequest, NextResponse } from 'next/server';

export interface Song {
    id: string;
    title: string;
    artist: string;
    album?: string;
    image: string;
    audioUrl: string;
    duration?: number;
}

const JIOSAAVN_API = 'https://jiosaavn-api-privatecvc2.vercel.app';

// Search for songs
async function searchSongs(query: string, limit: number = 30): Promise<any[]> {
    console.log('Searching JioSaavn for:', query);

    try {
        const response = await fetch(
            `${JIOSAAVN_API}/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`,
            { next: { revalidate: 300 } }
        );

        if (!response.ok) {
            console.error('JioSaavn search failed:', response.status);
            return [];
        }

        const data = await response.json();

        if (data.status === 'SUCCESS' && data.data?.results) {
            console.log(`Found ${data.data.results.length} songs`);
            return data.data.results;
        }

        return [];
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

// Get trending/popular songs
async function getTrendingSongs(limit: number = 50): Promise<any[]> {
    console.log('Fetching trending songs');

    try {
        // Search for popular artists to get trending music
        const queries = ['arijit singh', 'ap dhillon', 'diljit dosanjh', 'taylor swift', 'weekend'];
        const allSongs: any[] = [];

        for (const query of queries) {
            const response = await fetch(
                `${JIOSAAVN_API}/search/songs?query=${encodeURIComponent(query)}&limit=10`,
                { next: { revalidate: 300 } }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'SUCCESS' && data.data?.results) {
                    allSongs.push(...data.data.results);
                }
            }
        }

        // Shuffle and return
        return allSongs.sort(() => Math.random() - 0.5).slice(0, limit);
    } catch (error) {
        console.error('Trending fetch error:', error);
        return [];
    }
}

function transformTrack(track: any): Song | null {
    try {
        if (!track.name || !track.downloadUrl?.length) return null;

        // Get best quality audio URL (320kbps preferred)
        const downloadUrls = track.downloadUrl;
        let audioUrl = downloadUrls[downloadUrls.length - 1]?.link; // Best quality is usually last

        if (!audioUrl) return null;

        // Get best quality image (500x500)
        const images = track.image;
        let imageUrl = images?.[images.length - 1]?.link || images?.[0]?.link || `https://picsum.photos/seed/${track.id}/300`;

        return {
            id: track.id,
            title: track.name,
            artist: track.primaryArtists || 'Unknown Artist',
            album: track.album?.name || '',
            image: imageUrl,
            audioUrl: audioUrl,
            duration: parseInt(track.duration) || undefined,
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
        const channel = searchParams.get('channel') || 'discover';
        const limit = parseInt(searchParams.get('limit') || '30');

        console.log('=== Songs API ===');
        console.log('Query:', query, 'Channel:', channel, 'Limit:', limit);

        let tracks: any[] = [];

        if (query) {
            tracks = await searchSongs(query, limit);
        } else {
            tracks = await getTrendingSongs(limit);
        }

        // Transform and filter
        const songs: Song[] = tracks
            .map(transformTrack)
            .filter((song): song is Song => song !== null)
            .slice(0, limit);

        // Deduplicate by ID
        const seen = new Set<string>();
        const uniqueSongs = songs.filter(song => {
            if (seen.has(song.id)) return false;
            seen.add(song.id);
            return true;
        });

        console.log(`Returning ${uniqueSongs.length} unique songs`);

        return NextResponse.json({
            success: true,
            songs: uniqueSongs,
            total: uniqueSongs.length,
            source: query ? 'search' : channel,
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
