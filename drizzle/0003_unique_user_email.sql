-- Migration: Adicionar constraint UNIQUE no campo email da tabela users
-- Garante que nunca existam dois usuários com o mesmo e-mail no banco local

-- Passo 1: Remover possíveis duplicatas (mantém o registro mais antigo por id)
-- Caso existam, o mais recente é removido
DELETE FROM users a
USING users b
WHERE a.id > b.id
  AND a.email IS NOT NULL
  AND a.email = b.email;

-- Passo 2: Adicionar a constraint UNIQUE
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE ("email");
