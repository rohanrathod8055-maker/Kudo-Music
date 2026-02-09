import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate 6-digit OTP
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
    try {
        const { email, name } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
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

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in database
        await supabase.from('otps').upsert({
            email,
            otp,
            expires_at: expiresAt.toISOString(),
        });

        // Try to send email via Resend
        let emailSent = false;
        if (process.env.RESEND_API_KEY) {
            try {
                const result = await resend.emails.send({
                    from: 'Kudo Music <onboarding@resend.dev>',
                    to: email,
                    subject: 'Your Kudo verification code',
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Welcome to Kudo!</h1>
                            </div>
                            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                                Hi ${name || 'there'},<br><br>
                                Your verification code is:
                            </p>
                            <div style="background: linear-gradient(135deg, #7B2CBF, #E040FB); color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                                ${otp}
                            </div>
                            <p style="color: #999; font-size: 14px; text-align: center;">
                                This code expires in 10 minutes.
                            </p>
                        </div>
                    `,
                });
                console.log('Resend result:', result);
                emailSent = !result.error;
            } catch (emailError) {
                console.error('Resend error:', emailError);
            }
        }

        // ALWAYS return OTP for now (Resend free tier limitation)
        // In production with verified domain, remove devOtp
        return NextResponse.json({
            success: true,
            message: emailSent ? 'OTP sent to your email!' : 'Check your OTP below',
            devOtp: otp, // Always show OTP until domain is verified
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
    }
}
