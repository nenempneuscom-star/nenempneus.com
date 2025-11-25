-- Migration: Adicionar campo feature_flags à tabela settings
-- Data: 2025-11-25
-- Descrição: Adiciona controle de feature flags para habilitar/desabilitar funcionalidades

-- Adicionar coluna feature_flags (JSON) com valor padrão
ALTER TABLE "public"."settings"
ADD COLUMN IF NOT EXISTS "feature_flags" JSONB DEFAULT '{"importacaoEmMassa":false,"exportacaoRelatorios":true,"notificacoesWhatsapp":true}'::jsonb;

-- Atualizar registros existentes que não têm o campo (caso a coluna já exista mas esteja NULL)
UPDATE "public"."settings"
SET "feature_flags" = '{"importacaoEmMassa":false,"exportacaoRelatorios":true,"notificacoesWhatsapp":true}'::jsonb
WHERE "feature_flags" IS NULL;

-- Verificar resultado
-- SELECT id, loja_id, feature_flags FROM "public"."settings";
