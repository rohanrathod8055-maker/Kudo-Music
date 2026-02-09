'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, ListMusic } from 'lucide-react';

export function MobileNav() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Search', href: '/search', icon: Search },
        { name: 'Liked', href: '/liked', icon: Heart },
        { name: 'Library', href: '/playlists', icon: ListMusic },
    ];

    return (
        <nav style={{
            position: 'fixed',
            bottom: 90, // Above player
            left: 0,
            right: 0,
            height: '56px',
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'none', // Hidden on desktop
            zIndex: 90,
            paddingBottom: 'env(safe-area-inset-bottom)',
        }} className="mobile-nav-container">
            {navItems.map((item) => {
                const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            color: isActive ? '#FF6B6B' : '#666',
                            textDecoration: 'none',
                            transition: 'color 0.2s ease',
                            padding: '8px',
                        }}
                    >
                        <item.icon
                            size={22}
                            strokeWidth={isActive ? 2.5 : 2}
                            style={{
                                filter: isActive ? 'drop-shadow(0 0 8px rgba(255, 107, 107, 0.5))' : 'none'
                            }}
                        />
                        <span style={{
                            fontSize: '10px',
                            fontWeight: isActive ? 600 : 500,
                        }}>
                            {item.name}
                        </span>
                    </Link>
                );
            })}

            <style jsx global>{`
                @media (max-width: 768px) {
                    .mobile-nav-container {
                        display: flex !important;
                    }
                }
            `}</style>
        </nav>
    );
}
