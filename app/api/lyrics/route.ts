import { NextRequest, NextResponse } from 'next/server';

interface LyricsLine {
    time: number; // Start time in seconds
    text: string;
}

interface LyricsResponse {
    success: boolean;
    lyrics?: LyricsLine[];
    plainLyrics?: string;
    error?: string;
}

// Fetch synced lyrics for a song
export async function GET(request: NextRequest) {
    const title = request.nextUrl.searchParams.get('title');
    const artist = request.nextUrl.searchParams.get('artist');
    const duration = request.nextUrl.searchParams.get('duration');

    if (!title || !artist) {
        return NextResponse.json({
            success: false,
            error: 'Title and artist are required'
        }, { status: 400 });
    }

    console.log(`Fetching lyrics for: ${title} by ${artist}`);

    try {
        // Try LRCLIB API first (free, has synced lyrics)
        const lrclibUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}${duration ? `&duration=${duration}` : ''}`;

        const response = await fetch(lrclibUrl, {
            headers: {
                'User-Agent': 'Kudo Music Player/1.0 (https://kudo.app)',
            },
        });

        if (response.ok) {
            const data = await response.json();

            // Prefer synced lyrics if available
            if (data.syncedLyrics) {
                const lyrics = parseLRC(data.syncedLyrics);
                console.log(`Found ${lyrics.length} synced lines`);
                return NextResponse.json({
                    success: true,
                    lyrics,
                    synced: true,
                });
            }

            // Fall back to plain lyrics
            if (data.plainLyrics) {
                console.log('Found plain lyrics');
                return NextResponse.json({
                    success: true,
                    plainLyrics: data.plainLyrics,
                    synced: false,
                });
            }
        }

        // Try searching LRCLIB if exact match fails
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
        const searchResponse = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Kudo Music Player/1.0 (https://kudo.app)',
            },
        });

        if (searchResponse.ok) {
            const results = await searchResponse.json();
            if (Array.isArray(results) && results.length > 0) {
                // Find best match
                const match = results.find((r: any) => r.syncedLyrics) || results[0];

                if (match.syncedLyrics) {
                    const lyrics = parseLRC(match.syncedLyrics);
                    return NextResponse.json({
                        success: true,
                        lyrics,
                        synced: true,
                    });
                }

                if (match.plainLyrics) {
                    return NextResponse.json({
                        success: true,
                        plainLyrics: match.plainLyrics,
                        synced: false,
                    });
                }
            }
        }

        return NextResponse.json({
            success: false,
            error: 'Lyrics not found'
        });

    } catch (error) {
        console.error('Lyrics fetch error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch lyrics'
        }, { status: 500 });
    }
}

// Parse LRC format to array of timed lines
function parseLRC(lrc: string): LyricsLine[] {
    const lines: LyricsLine[] = [];
    const lrcLines = lrc.split('\n');

    for (const line of lrcLines) {
        // Match [mm:ss.xx] or [mm:ss:xx] format
        const match = line.match(/\[(\d{1,2}):(\d{2})(?:[:.])(\d{2,3})\](.*)$/);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const centiseconds = parseInt(match[3], 10);
            const text = match[4].trim();

            if (text) { // Only add lines with text
                const time = minutes * 60 + seconds + centiseconds / (match[3].length === 3 ? 1000 : 100);
                lines.push({ time, text });
            }
        }
    }

    return lines.sort((a, b) => a.time - b.time);
}
