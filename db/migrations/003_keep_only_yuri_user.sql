DO $$
DECLARE
  v_target_email CONSTANT TEXT := 'yuriwelter34@gmail.com';
  v_target_user_id UUID;
BEGIN
  SELECT id
  INTO v_target_user_id
  FROM users
  WHERE email = v_target_email
  LIMIT 1;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário alvo % não encontrado. Migração cancelada para evitar perda de dados.', v_target_email;
  END IF;

  DELETE FROM users
  WHERE id <> v_target_user_id;
END
$$;
