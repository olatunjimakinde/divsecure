import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'

describe('RLS Verification', () => {
    it('should prevent cross-community data access', async () => {
        console.log('Starting RLS Verification...');

        // Read .env.local
        const envPath = path.resolve(process.cwd(), '.env.local')
        if (!fs.existsSync(envPath)) {
            console.error('.env.local not found');
            throw new Error('.env.local not found');
        }
        const envContent = fs.readFileSync(envPath, 'utf-8')
        const env: Record<string, string> = {}
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=')
            if (key && value) {
                env[key.trim()] = value.trim()
            }
        })

        const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
        const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
        const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY']

        if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
            console.error('Missing Supabase keys')
            throw new Error('Missing Supabase keys')
        }

        // Admin client to setup data
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        const runId = Date.now();
        const emailA = `userA_${runId}@example.com`;
        const emailB = `userB_${runId}@example.com`;
        const password = 'Password123!';

        try {
            // 1. Create Users
            console.log('Creating Test Users...');
            const { data: userA, error: errA } = await supabaseAdmin.auth.admin.createUser({ email: emailA, password, email_confirm: true });
            if (errA) throw errA;
            const { data: userB, error: errB } = await supabaseAdmin.auth.admin.createUser({ email: emailB, password, email_confirm: true });
            if (errB) throw errB;

            const idA = userA.user!.id;
            const idB = userB.user!.id;

            // 2. Create Communities
            console.log('Creating Test Communities...');
            const { data: commA } = await supabaseAdmin.from('communities').insert({
                name: `Community A ${runId}`, slug: `comm-a-${runId}`, owner_id: idA
            }).select().single();

            const { data: commB } = await supabaseAdmin.from('communities').insert({
                name: `Community B ${runId}`, slug: `comm-b-${runId}`, owner_id: idB
            }).select().single();

            if (!commA || !commB) throw new Error('Failed to create communities');

            // 3. Add Members
            await supabaseAdmin.from('members').insert({ community_id: commA.id, user_id: idA, role: 'community_manager', status: 'approved' });
            await supabaseAdmin.from('members').insert({ community_id: commB.id, user_id: idB, role: 'community_manager', status: 'approved' });

            // 4. Create Channels and Posts in Community A
            console.log('Creating content in Community A...');
            const { data: channelA, error: createChanError } = await supabaseAdmin.from('channels').insert({
                community_id: commA.id, name: 'General A', slug: 'general-a'
            }).select().single();

            if (createChanError) {
                console.error('Channel Creation Error:', createChanError);
                throw new Error('Failed to create channel: ' + createChanError.message);
            }

            if (!channelA) throw new Error('Failed to create channel (no data)');

            await supabaseAdmin.from('posts').insert({
                channel_id: channelA.id, user_id: idA, content: 'Secret post in Community A'
            });

            // 5. TEST: User B tries to read content from Community A
            console.log('TEST: Authenticating as User B and trying to read Community A data...');

            // Sign in as User B
            const { data: authData } = await supabaseAdmin.auth.signInWithPassword({ email: emailB, password });
            const tokenB = authData.session?.access_token;

            if (!tokenB) throw new Error('Failed to login as User B');

            // Create client for User B
            const supabaseB = createClient(supabaseUrl, supabaseAnonKey, {
                global: { headers: { Authorization: `Bearer ${tokenB}` } }
            });

            // Attempt 1: Read Posts
            const { data: posts, error: postError } = await supabaseB.from('posts').select('*').eq('channel_id', channelA.id);

            if (postError) console.error('Error fetching posts:', postError);

            console.log(`User B fetched ${posts?.length || 0} posts from Community A.`);

            // Attempt 2: Read Channels
            const { data: channels, error: chanError } = await supabaseB.from('channels').select('*').eq('id', channelA.id);

            console.log(`User B fetched ${channels?.length || 0} channels from Community A.`);

            // 6. Verify Results
            // ASSERTION: Posts should be empty
            expect(posts).toHaveLength(0);

            // ASSERTION: Channels should be empty
            expect(channels).toHaveLength(0);

            // Cleanup
            console.log('Cleaning up...');
            await supabaseAdmin.from('communities').delete().in('id', [commA.id, commB.id]);
            await supabaseAdmin.auth.admin.deleteUser(idA);
            await supabaseAdmin.auth.admin.deleteUser(idB);

        } catch (err) {
            console.error('Unexpected Error:', err);
            throw err;
        }
    }, 30000); // 30s timeout
});
