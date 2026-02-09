import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { email, otp, name, password } = await request.json();

        if (!email || !otp || !password) {
            return NextResponse.json(
                { error: 'Email, OTP, and password are required' },
                { status: 400 }
            );
        }

        // Verify OTP
        const { data: otpRecord, error: otpError } = await supabase
            .from('otps')
            .select('*')
            .eq('email', email)
            .eq('otp', otp)
            .single();

        if (otpError || !otpRecord) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        // Check if OTP expired
        if (new Date(otpRecord.expires_at) < new Date()) {
            return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert({
                email,
                name: name || email.split('@')[0],
                password_hash: passwordHash,
            })
            .select()
            .single();

        if (userError) {
            console.error('Create user error:', userError);
            return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
        }

        // Delete used OTP
        await supabase.from('otps').delete().eq('email', email);

        return NextResponse.json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
