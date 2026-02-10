-- Create feedbacks table
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('bug', 'inquiry', 'suggestion', 'other')),
    content TEXT NOT NULL,
    contact_email TEXT,
    device_info JSONB, -- OS, 브라우저 정보 등
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'pending'::text CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    admin_comment TEXT
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedbacks
CREATE POLICY "Users can insert their own feedbacks"
    ON public.feedbacks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedbacks
CREATE POLICY "Users can view their own feedbacks"
    ON public.feedbacks FOR SELECT
    USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON public.feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON public.feedbacks(created_at);
