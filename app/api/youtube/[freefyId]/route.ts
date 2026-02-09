import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/youtube/[freefyId] - Fetch YouTube video ID for a song
 * Uses multiple services to search YouTube for the song
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ freefyId: string }> }
) {
    try {
        const { freefyId } = await params;

        // Get track details from Freefy
        const trackUrl = `https://freefy.app/api/v1/tracks/${freefyId}`;
        const trackResponse = await fetch(trackUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
        });

        if (!trackResponse.ok) {
            throw new Error(`Failed to fetch track: ${trackResponse.status}`);
        }

        const trackData = await trackResponse.json();
        const track = trackData.track || trackData;

        const trackName = track.name || '';
        const artistName = track.artists?.[0]?.name || '';

        if (!trackName) {
            throw new Error('Track name not found');
        }

        const searchQuery = `${artistName} ${trackName}`;
        let youtubeId = null;

        // Try Piped API instances (YouTube alternative API)
        const pipedInstances = [
            'https://pipedapi.kavin.rocks',
            'https://api.piped.yt',
            'https://pipedapi.syncpundit.io',
        ];

        for (const instance of pipedInstances) {
            try {
                const searchUrl = `${instance}/search?q=${encodeURIComponent(searchQuery)}&filter=music_songs`;
                console.log('Trying Piped:', searchUrl);

                const searchResponse = await fetch(searchUrl, {
                    headers: { 'Accept': 'application/json' },
                    signal: AbortSignal.timeout(5000), // 5 second timeout
                });

                if (searchResponse.ok) {
                    const data = await searchResponse.json();
                    if (data.items && data.items.length > 0) {
                        // Extract video ID from URL like "/watch?v=VIDEO_ID"
                        const firstResult = data.items[0];
                        if (firstResult.url) {
                            const match = firstResult.url.match(/[?&]v=([^&]+)/);
                            if (match) {
                                youtubeId = match[1];
                                console.log('Found YouTube ID via Piped:', youtubeId);
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
                console.log(`Piped instance ${instance} failed:`, e);
                continue;
            }
        }

        // If Piped fails, try scraping YouTube search page
        if (!youtubeId) {
            try {
                const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery + ' official audio')}`;
                const ytResponse = await fetch(ytUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                    signal: AbortSignal.timeout(5000),
                });

                if (ytResponse.ok) {
                    const html = await ytResponse.text();
                    // Look for video IDs in the response
                    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
                    if (videoIdMatch) {
                        youtubeId = videoIdMatch[1];
                        console.log('Found YouTube ID via scraping:', youtubeId);
                    }
                }
            } catch (e) {
                console.error('YouTube scraping failed:', e);
            }
        }

        return NextResponse.json({
            success: !!youtubeId,
            freefyId,
            youtubeId,
            searchQuery,
            trackName,
            artistName,
        });

    } catch (error) {
        console.error('Error fetching YouTube ID:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get YouTube ID',
            youtubeId: null,
        }, { status: 500 });
    }
}
