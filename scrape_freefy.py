import requests
import json
from pathlib import Path

def fetch_freefy_songs():
    """Fetch songs from Freefy discover page"""
    url = "https://freefy.app/api/v1/channels/5"
    
    try:
        response = requests.get(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        if response.status_code == 200:
            data = response.json()
            return data.get('channel', {}).get('content', {}).get('data', [])
        return []
    except Exception as e:
        print(f"Error fetching songs: {e}")
        return []

def transform_to_spotify_format(freefy_songs):
    """Transform Freefy songs to Spotify clone format"""
    songs = []
    
    for idx, item in enumerate(freefy_songs[:20], 1):  # Limit to 20 songs
        if item.get('model_type') == 'track':
            track = item.get('track', {})
            
            # Get artist info
            artists = track.get('artists', [])
            artist_name = artists[0].get('name', 'Unknown Artist') if artists else 'Unknown Artist'
            
            # Get album info
            album = track.get('album', {})
            album_name = album.get('name', track.get('name', 'Single'))
            
            # Get image
            image = track.get('image', '')
            if image:
                image = f"https://freefy.app/{image}" if not image.startswith('http') else image
            
            # Get YouTube ID if available (Freefy stores it)
            youtube_id = track.get('youtube_id', '')
            
            # If no YouTube ID, we'll need to search for it (can be done later)
            if not youtube_id:
                # Generate a placeholder that can be searched later
                youtube_id = f"{track.get('name', '')} {artist_name}".replace(' ', '+')
            
            song = {
                'id': str(idx),
                'title': track.get('name', 'Unknown'),
                'artist': artist_name,
                'album': album_name,
                'image': image or '/images/placeholder.jpg',
                'youtubeId': youtube_id,
                'duration': track.get('duration', 180000) // 1000  # Convert ms to seconds
            }
            
            songs.append(song)
    
    return songs

def generate_typescript_file(songs):
    """Generate TypeScript file with songs data"""
    ts_content = """import { Song } from '@/store/usePlayerStore';

export const mockSongs: Song[] = [\n"""
    
    for song in songs:
        ts_content += f"""  {{
    id: '{song['id']}',
    title: "{song['title'].replace('"', '\\"')}",
    artist: "{song['artist'].replace('"', '\\"')}",
    album: "{song['album'].replace('"', '\\"')}",
    image: "{song['image']}",
    youtubeId: "{song['youtubeId']}",
    duration: {song.get('duration', 180)},
  }},\n"""
    
    ts_content += "];\n"
    
    return ts_content

def main():
    print("Fetching songs from Freefy...")
    freefy_songs = fetch_freefy_songs()
    
    if not freefy_songs:
        print("No songs found or error occurred")
        return
    
    print(f"Found {len(freefy_songs)} items")
    
    # Transform to Spotify format
    songs = transform_to_spotify_format(freefy_songs)
    print(f"Transformed {len(songs)} songs")
    
    # Generate TypeScript file
    ts_content = generate_typescript_file(songs)
    
    # Write to file
    output_path = Path(__file__).parent / 'lib' / 'data' / 'songs.ts'
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    
    print(f"✅ Successfully scraped {len(songs)} songs!")
    print(f"📁 Saved to: {output_path}")
    
    # Show first few songs
    print("\nFirst 3 songs:")
    for song in songs[:3]:
        print(f"  - {song['title']} by {song['artist']}")

if __name__ == "__main__":
    main()
