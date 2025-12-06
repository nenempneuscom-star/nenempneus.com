-- ================================================
-- DESABILITAR RLS EM TODAS AS TABELAS
-- O Prisma usa conexão direta e precisa de acesso total
-- Execute este script no SQL Editor do Supabase
-- ================================================

ALTER TABLE public.agendamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupom_usos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lojas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.favoritos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas_whatsapp DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_whatsapp DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_preco DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.refinamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.solucoes_efetivas DISABLE ROW LEVEL SECURITY;
