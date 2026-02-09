import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create client (will work with placeholder during build, real values at runtime)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    created_at: string;
}

export interface Playlist {
    id: string;
    user_id: string;
    name: string;
    songs: any[];
    created_at: string;
}

export interface LikedSong {
    id: string;
    user_id: string;
    song_data: any;
    created_at: string;
}
