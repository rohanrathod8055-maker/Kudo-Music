'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Heart, Plus, ListMusic, LogOut, User } from 'lucide-react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';

export function Sidebar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    const mainLinks = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Search', href: '/search', icon: Search },
    ];

    const libraryLinks = [
        { name: 'Liked Songs', href: '/liked', icon: Heart, accent: true },
        { name: 'Playlists', href: '/playlists', icon: ListMusic },
    ];

    return (
        <aside className="sidebar" style={{
            width: '280px',
            minWidth: '280px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '8px',
        }}>
            {/* Top Section - Logo & Main Nav */}
            <div style={{
                backgroundColor: '#121212',
                borderRadius: '8px',
                padding: '12px',
            }}>
                {/* Logo */}
                <Link href="/" style={{
                    display: 'block',
                    padding: '8px 12px',
                    marginBottom: '16px',
                }}>
                    <img
                        src="/kudo-logo.png"
                        alt="Kudo"
                        style={{
                            height: '120px',
                            width: 'auto',
                            objectFit: 'contain',
                        }}
                    />
                </Link>

                {/* Main Navigation */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {mainLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    color: isActive ? '#fff' : '#b3b3b3',
                                    fontWeight: isActive ? 700 : 600,
                                    fontSize: '15px',
                                    transition: 'all 0.2s ease',
                                    textDecoration: 'none',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) e.currentTarget.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) e.currentTarget.style.color = '#b3b3b3';
                                }}
                            >
                                <link.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Library Section */}
            <div style={{
                backgroundColor: '#121212',
                borderRadius: '8px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Library Header */}
                <div style={{
                    padding: '16px 16px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Link
                        href="/playlists"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#b3b3b3',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}
                    >
                        <Library size={24} />
                        Your Library
                    </Link>
                    <button
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#b3b3b3',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#b3b3b3';
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="Create playlist"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Library Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '8px',
                }}>
                    {libraryLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    transition: 'background 0.2s',
                                    backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                {/* Icon Container */}
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: link.accent ? '4px' : '8px',
                                    background: link.accent
                                        ? 'linear-gradient(135deg, #450af5, #c4efd9)'
                                        : 'linear-gradient(135deg, #282828, #121212)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <link.icon
                                        size={link.accent ? 20 : 24}
                                        color="#fff"
                                        fill={link.accent ? '#fff' : 'none'}
                                    />
                                </div>

                                {/* Text */}
                                <div style={{ minWidth: 0 }}>
                                    <p style={{
                                        color: isActive ? '#fff' : '#e0e0e0',
                                        fontSize: '15px',
                                        fontWeight: 500,
                                        margin: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {link.name}
                                    </p>
                                    <p style={{
                                        color: '#a0a0a0',
                                        fontSize: '13px',
                                        margin: 0,
                                    }}>
                                        Playlist
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* User Profile Section */}
            <div style={{
                backgroundColor: '#121212',
                borderRadius: '8px',
                padding: '12px',
            }}>
                {status === 'loading' ? (
                    <div style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            border: '2px solid #282828',
                            borderTop: '2px solid #7B2CBF',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto',
                        }} />
                    </div>
                ) : session?.user ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px',
                    }}>
                        {session.user.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name || 'User'}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #7B2CBF, #E040FB)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <User size={20} color="#fff" />
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 600,
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {session.user.name || 'User'}
                            </p>
                            <p style={{
                                color: '#a0a0a0',
                                fontSize: '12px',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {session.user.email}
                            </p>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#a0a0a0',
                                cursor: 'pointer',
                                padding: '8px',
                            }}
                            title="Sign out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: '8px' }}>
                        <Link
                            href="/auth/login"
                            style={{
                                display: 'block',
                                textAlign: 'center',
                                padding: '12px 16px',
                                background: 'linear-gradient(135deg, #7B2CBF, #E040FB)',
                                borderRadius: '500px',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                marginBottom: '8px',
                            }}
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/auth/signup"
                            style={{
                                display: 'block',
                                textAlign: 'center',
                                padding: '12px 16px',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '500px',
                                color: '#b3b3b3',
                                fontSize: '14px',
                                fontWeight: 600,
                                textDecoration: 'none',
                            }}
                        >
                            Create account
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}
