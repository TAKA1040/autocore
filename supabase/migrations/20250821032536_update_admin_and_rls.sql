-- 1. dash201206@gmail.com を管理者に設定し、承認する
-- このUPDATEは、auth.usersにdash201206@gmail.comのレコードが存在し、
-- かつprofilesテーブルにそのユーザーのレコードがトリガーによって作成されている前提です。
UPDATE public.profiles
SET
  role = 'ADMIN',
  status = 'APPROVED'
WHERE email = 'dash201206@gmail.com';

-- 2. RLSポリシーをSECURITY_AND_CI_DECLARATION.mdのルールに則って再設定
-- 既存のポリシーをすべて削除 (念のため)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- profiles: 本人のみ select/update 可 (auth.uid() = id)
CREATE POLICY "Users can view and update their own profile"
ON public.profiles FOR ALL
USING (auth.uid() = id);

-- 管理者ロール (profiles.role = 'ADMIN') には全件許可ポリシーを別途付与
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);
