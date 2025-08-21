-- 既存のポリシーをすべて削除します
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- RLS自体を無効化します
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;