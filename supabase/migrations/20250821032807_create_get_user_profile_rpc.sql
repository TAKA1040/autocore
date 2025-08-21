-- get_user_profile_by_id 関数を作成
CREATE OR REPLACE FUNCTION public.get_user_profile_by_id(user_id_in uuid)
RETURNS TABLE (id uuid, email text, status text, role text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER -- Service Role Key で実行されるため、RLSをバイパス
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.status,
    p.role,
    p.created_at
  FROM
    public.profiles p
  WHERE
    p.id = user_id_in;
END;
$$;

-- 権限設定 (必要に応じて)
-- GRANT EXECUTE ON FUNCTION public.get_user_profile_by_id(uuid) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_user_profile_by_id(uuid) TO service_role;
