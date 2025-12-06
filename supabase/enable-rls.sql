-- ================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- Execute este script no SQL Editor do Supabase
-- ================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupom_usos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refinamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solucoes_efetivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ================================================
-- CRIAR POLÍTICAS DE ACESSO PARA SERVICE ROLE
-- Isso permite que o Prisma (backend) acesse os dados
-- mas bloqueia acesso direto via API pública do Supabase
-- ================================================

CREATE POLICY "Service role full access" ON public.produtos FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.categorias FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.pedido_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.pagamentos FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.conversas_whatsapp FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.mensagens_whatsapp FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.avaliacoes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.agendamentos FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.alertas_preco FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.cupom_usos FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.indicacoes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.analytics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.refinamentos FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.solucoes_efetivas FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.lojas FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.usuarios FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.clientes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.pedidos FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.veiculos FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.favoritos FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.cupons FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.settings FOR ALL USING (auth.role() = 'service_role');

-- ================================================
-- POLÍTICAS DE LEITURA PÚBLICA (opcional)
-- Descomente se quiser permitir leitura pública de algumas tabelas
-- ================================================

-- Produtos e categorias podem ser lidos publicamente (para a loja)
CREATE POLICY "Public read access" ON public.produtos FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.lojas FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.veiculos FOR SELECT USING (true);
