
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseServiceKey) {
            return NextResponse.json({ error: 'Service Role Key not configured' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Get the current user's session token to verify they are allowed to do this
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Verify requester profile
        const { data: requesterProfile } = await supabaseAdmin
            .from('profiles')
            .select('client_id, role')
            .eq('id', user.id)
            .single();

        if (!requesterProfile || requesterProfile.role !== 'client') {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const { email, full_name, role } = await req.json();

        if (!email || !full_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create User in Auth
        // Note: This will send a confirmation email if configured, or just create it.
        // For a portal member, we might want to auto-confirm or set a temp password.
        // Here we'll generate a random password and return it (or just let them reset).
        const tempPassword = Math.random().toString(36).slice(-8) + "Aa1@";

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name, role: role || 'user' }
        });

        if (createError) throw createError;
        if (!newUser.user) throw new Error('Failed to create user');

        // 2. Create Profile linked to same client
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: newUser.user.id,
                email,
                full_name,
                client_id: requesterProfile.client_id,
                role: role || 'user',
                is_active: true
            });

        if (profileError) {
            // Rollback? ideally yes, but simple for now
            console.error('Profile creation failed', profileError);
            return NextResponse.json({ error: 'User created but profile failed' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'User created successfully',
            user: {
                id: newUser.user.id,
                email: newUser.user.email,
                tempPassword // In a real app, send this via email, don't return it
            }
        });

    } catch (error: any) {
        console.error('Invite error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
