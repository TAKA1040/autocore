CREATE TABLE public.tools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    command TEXT NOT NULL,
    port INTEGER,
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id uuid REFERENCES public.profiles(id)
);

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view tools" ON public.tools
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow admin users to manage tools" ON public.tools
    FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );