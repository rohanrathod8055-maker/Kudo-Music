'use client';

import { useState } from 'react';
import { SongList } from "@/components/SongList";

export default function Home() {
  const [songCount, setSongCount] = useState(0);

  return (
    <div style={{
      backgroundColor: '#000000',
      minHeight: '100%',
      paddingBottom: '100px',
    }}>
      {/* Header */}
      <div style={{ padding: '32px 24px 24px 24px' }}>
        <p style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#9ca3af',
          marginBottom: '8px',
        }}>PLAYLIST</p>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#ffffff',
          marginBottom: '8px',
          margin: 0,
        }}>Today's Top Hits</h1>
        <p style={{
          fontSize: '14px',
          color: '#9ca3af',
          marginTop: '8px',
        }}>
          {songCount > 0 ? `${songCount} songs` : 'Loading...'}
        </p>
      </div>

      {/* Song List */}
      <SongList onSongsLoaded={setSongCount} />
    </div>
  );
}
