-- ================================================
-- FIX: Permitir acesso do Prisma (conexão direta)
-- O Prisma usa conexão direta ao PostgreSQL, não passa pelo PostgREST
-- Por isso precisamos permitir acesso para todas as conexões autenticadas
-- Execute este script no SQL Editor do Supabase
-- ================================================

-- Opção 1: Desabilitar RLS apenas para as tabelas que o Prisma precisa escrever
-- (Mais simples, mas menos seguro para acesso via API REST do Supabase)

ALTER TABLE public.agendamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupom_usos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes DISABLE ROW LEVEL SECURITY;

-- Manter RLS apenas em tabelas que precisam de proteção extra
-- (estas podem ser lidas publicamente mas não escritas)
-- produtos, categorias, lojas, veiculos - já têm política de leitura pública

-- ================================================
-- ALTERNATIVA: Se quiser manter RLS mas permitir Prisma
-- Adicionar política que permite tudo para conexões diretas
-- (descomente se preferir esta abordagem)
-- ================================================

-- CREATE POLICY "Allow all for authenticated" ON public.agendamentos FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for authenticated" ON public.pedidos FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for authenticated" ON public.pedido_items FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for authenticated" ON public.pagamentos FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for authenticated" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for authenticated" ON public.analytics FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for authenticated" ON public.cupom_usos FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all for authenticated" ON public.avaliacoes FOR ALL USING (true) WITH CHECK (true);
