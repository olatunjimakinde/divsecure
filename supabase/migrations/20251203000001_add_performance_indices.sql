-- Add indices for foreign keys to improve join performance and RLS checks

-- Members table
CREATE INDEX IF NOT EXISTS idx_members_community_id ON public.members(community_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_household_id ON public.members(household_id);

-- Communities table
CREATE INDEX IF NOT EXISTS idx_communities_owner_id ON public.communities(owner_id);
CREATE INDEX IF NOT EXISTS idx_communities_slug ON public.communities(slug);

-- Households table
CREATE INDEX IF NOT EXISTS idx_households_community_id ON public.households(community_id);

-- Channels table
CREATE INDEX IF NOT EXISTS idx_channels_community_id ON public.channels(community_id);

-- Posts table
CREATE INDEX IF NOT EXISTS idx_posts_channel_id ON public.posts(channel_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);

-- Events table
CREATE INDEX IF NOT EXISTS idx_events_community_id ON public.events(community_id);

-- Visitor Codes table
CREATE INDEX IF NOT EXISTS idx_visitor_codes_community_id ON public.visitor_codes(community_id);
CREATE INDEX IF NOT EXISTS idx_visitor_codes_host_id ON public.visitor_codes(host_id);

-- Visitor Logs table
CREATE INDEX IF NOT EXISTS idx_visitor_logs_community_id ON public.visitor_logs(community_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visitor_code_id ON public.visitor_logs(visitor_code_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_guard_id ON public.visitor_logs(guard_id);

-- Subscriptions table
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Community Subscription Settings
CREATE INDEX IF NOT EXISTS idx_community_sub_settings_community_id ON public.community_subscription_settings(community_id);

-- Shifts table
CREATE INDEX IF NOT EXISTS idx_shifts_community_id ON public.shifts(community_id);
CREATE INDEX IF NOT EXISTS idx_shifts_guard_id ON public.shifts(guard_id);
