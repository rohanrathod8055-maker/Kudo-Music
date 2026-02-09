'use client';

import { Music2 } from 'lucide-react';

interface KudoLogoProps {
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

export function KudoLogo({ size = 'md', showIcon = true }: KudoLogoProps) {
    const sizes = {
        sm: { fontSize: '20px', iconSize: 18, gap: '6px' },
        md: { fontSize: '28px', iconSize: 24, gap: '8px' },
        lg: { fontSize: '48px', iconSize: 40, gap: '12px' },
    };

    const config = sizes[size];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: config.gap,
        }}>
            {showIcon && (
                <div style={{
                    width: `${config.iconSize + 12}px`,
                    height: `${config.iconSize + 12}px`,
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFA94D 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
                }}>
                    <Music2 size={config.iconSize} color="#fff" strokeWidth={2.5} />
                </div>
            )}
            <span style={{
                fontSize: config.fontSize,
                fontWeight: 800,
                letterSpacing: '-1px',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFA94D 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}>
                Kudo
            </span>
        </div>
    );
}
