import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { email, name, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists. Please sign in.' }, { status: 400 });
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
                image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`, // Auto-generate avatar
            })
            .select()
            .single();

        if (userError) {
            console.error('Create user error:', userError);
            return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
        }

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
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
