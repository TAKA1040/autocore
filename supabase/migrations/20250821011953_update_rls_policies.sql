-- 既存のSELECTポリシーを一旦削除
DROP POLICY "Users can view their own profile" ON public.profiles;

-- 新しいSELECTポリシーを作成 (認証済みユーザーなら読み取り可能に)
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
USING (auth.role() = 'authenticated');
