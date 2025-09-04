CREATE TABLE public.allowed_paths (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id uuid REFERENCES public.profiles(id)
);

COMMENT ON TABLE public.allowed_paths IS 'Stores the list of allowed paths for tool commands.';

ALTER TABLE public.allowed_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view paths" ON public.allowed_paths
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow admin users to manage paths" ON public.allowed_paths
    FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );
