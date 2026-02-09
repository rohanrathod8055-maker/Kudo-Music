import { create } from 'zustand';

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

interface PlayerStore {
    // State
    currentSong: Song | null;
    isPlaying: boolean;
    volume: number;
    progress: number;
    duration: number;
    isLoading: boolean;

    // Shuffle and Queue
    shuffle: boolean;
    repeat: 'off' | 'all' | 'one';
    queue: Song[];
    history: Song[];
    autoPlayEnabled: boolean;

    // Actions
    setCurrentSong: (song: Song) => void;
    setYoutubeId: (youtubeId: string) => void;
    togglePlay: () => void;
    setIsPlaying: (playing: boolean) => void;
    setVolume: (volume: number) => void;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    setIsLoading: (loading: boolean) => void;

    // Shuffle & Queue Actions
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    toggleAutoPlay: () => void;
    addToQueue: (song: Song) => void;
    addManyToQueue: (songs: Song[]) => void;
    clearQueue: () => void;
    playNext: () => void;
    playPrevious: () => void;

    // For auto-play similar
    lastSearchQuery: string;
    setLastSearchQuery: (query: string) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
    // Initial state
    currentSong: null,
    isPlaying: false,
    volume: 0.7,
    progress: 0,
    duration: 0,
    isLoading: false,

    // Shuffle and Queue initial state
    shuffle: false,
    repeat: 'off',
    queue: [],
    history: [],
    autoPlayEnabled: true,
    lastSearchQuery: '',

    // Actions
    setCurrentSong: (song) => {
        const currentSong = get().currentSong;
        if (currentSong) {
            // Add current song to history before changing
            set((state) => ({
                history: [...state.history.slice(-20), currentSong],
            }));
        }
        set({
            currentSong: song,
            isPlaying: false,
            progress: 0,
            isLoading: true,
        });
    },

    setYoutubeId: (youtubeId) => set((state) => ({
        currentSong: state.currentSong ? { ...state.currentSong, youtubeId } : null,
        isPlaying: true,
        isLoading: false,
    })),

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    setVolume: (volume) => set({ volume }),
    setProgress: (progress) => set({ progress }),
    setDuration: (duration) => set({ duration }),
    setIsLoading: (loading) => set({ isLoading: loading }),

    // Shuffle & Queue Actions
    toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

    toggleRepeat: () => set((state) => {
        const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
        const currentIndex = modes.indexOf(state.repeat);
        const nextIndex = (currentIndex + 1) % modes.length;
        return { repeat: modes[nextIndex] };
    }),

    toggleAutoPlay: () => set((state) => ({ autoPlayEnabled: !state.autoPlayEnabled })),

    addToQueue: (song) => set((state) => ({
        queue: [...state.queue, song],
    })),

    addManyToQueue: (songs) => set((state) => ({
        queue: [...state.queue, ...songs],
    })),

    clearQueue: () => set({ queue: [] }),

    setLastSearchQuery: (query) => set({ lastSearchQuery: query }),

    playNext: () => {
        const state = get();
        const { queue, shuffle, repeat, currentSong } = state;

        // Handle repeat one
        if (repeat === 'one' && currentSong) {
            set({ progress: 0, isPlaying: true });
            return;
        }

        // If queue has songs
        if (queue.length > 0) {
            let nextIndex = 0;

            if (shuffle) {
                // Pick random song from queue
                nextIndex = Math.floor(Math.random() * queue.length);
            }

            const nextSong = queue[nextIndex];
            const newQueue = [...queue];
            newQueue.splice(nextIndex, 1);

            // Add current to history
            const history = currentSong
                ? [...state.history.slice(-20), currentSong]
                : state.history;

            set({
                currentSong: nextSong,
                queue: newQueue,
                history,
                progress: 0,
                isLoading: true,
            });
        } else if (repeat === 'all' && currentSong) {
            // Repeat from history
            const history = state.history;
            if (history.length > 0) {
                const nextSong = history[0];
                set({
                    currentSong: nextSong,
                    history: [...history.slice(1), currentSong],
                    progress: 0,
                    isLoading: true,
                });
            }
        }
        // If autoPlayEnabled and queue is empty, the Player component will fetch similar songs
    },

    playPrevious: () => {
        const state = get();
        const { history, currentSong } = state;

        if (history.length > 0) {
            const prevSong = history[history.length - 1];
            const newHistory = history.slice(0, -1);

            // Add current to front of queue
            const newQueue = currentSong
                ? [currentSong, ...state.queue]
                : state.queue;

            set({
                currentSong: prevSong,
                history: newHistory,
                queue: newQueue,
                progress: 0,
                isLoading: true,
            });
        }
    },
}));
