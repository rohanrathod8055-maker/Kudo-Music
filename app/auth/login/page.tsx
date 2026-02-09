'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Music } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                window.location.href = '/';
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
        }}>
            {/* Background gradient */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0a 50%)',
                pointerEvents: 'none',
            }} />

            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '420px',
                background: 'linear-gradient(180deg, rgba(40,40,40,0.9) 0%, rgba(20,20,20,0.95) 100%)',
                borderRadius: '24px',
                padding: '48px 40px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
            }}>
                {/* Logo */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '40px',
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #7B2CBF, #E040FB, #00D9FF)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                    }}>
                        <Music size={32} color="#fff" />
                    </div>
                    <h1 style={{
                        color: '#fff',
                        fontSize: '28px',
                        fontWeight: 700,
                        margin: 0,
                    }}>
                        Welcome back
                    </h1>
                    <p style={{
                        color: '#b3b3b3',
                        fontSize: '14px',
                        margin: '8px 0 0 0',
                    }}>
                        Sign in to continue to Kudo
                    </p>
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailLogin}>
                    {error && (
                        <div style={{
                            backgroundColor: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            marginBottom: '16px',
                            color: '#ef4444',
                            fontSize: '13px',
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            color: '#b3b3b3',
                            fontSize: '13px',
                            fontWeight: 600,
                            marginBottom: '8px',
                        }}>
                            Email
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="#6b6b6b" style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                            }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 48px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#7B2CBF'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            color: '#b3b3b3',
                            fontSize: '13px',
                            fontWeight: 600,
                            marginBottom: '8px',
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="#6b6b6b" style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                            }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 48px 14px 48px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#7B2CBF'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                {showPassword ? (
                                    <EyeOff size={18} color="#6b6b6b" />
                                ) : (
                                    <Eye size={18} color="#6b6b6b" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px 24px',
                            background: 'linear-gradient(135deg, #7B2CBF 0%, #E040FB 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '500px',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(123,44,191,0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                {/* Sign up link */}
                <p style={{
                    textAlign: 'center',
                    color: '#b3b3b3',
                    fontSize: '14px',
                    marginTop: '24px',
                }}>
                    Don't have an account?{' '}
                    <Link href="/auth/signup" style={{
                        color: '#E040FB',
                        fontWeight: 600,
                        textDecoration: 'none',
                    }}>
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
