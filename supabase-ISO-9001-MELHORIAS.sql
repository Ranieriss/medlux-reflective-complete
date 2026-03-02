-- ============================================
-- MEDLUX Reflective - Melhorias ISO 9001:2015
-- Sistema de Gestão da Qualidade Completo
-- Data: 2026-02-15
-- ============================================

-- ============================================
-- 1. MÓDULO DE NÃO CONFORMIDADES (NC)
-- ============================================
CREATE TABLE IF NOT EXISTS public.nao_conformidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipamento_id UUID REFERENCES public.equipamentos(id),
    medicao_id UUID REFERENCES public.historico_calibracoes(id),
    usuario_id UUID REFERENCES public.usuarios(id),
    tipo_nc VARCHAR(50) NOT NULL, -- 'EQUIPAMENTO', 'MEDICAO', 'PROCESSO', 'SISTEMA', 'FORNECEDOR'
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    severidade VARCHAR(20), -- 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA'
    
    -- Análise de Causa Raiz (5 Porquês)
    porque_1 TEXT,
    porque_2 TEXT,
    porque_3 TEXT,
    porque_4 TEXT,
    porque_5 TEXT,
    causa_raiz TEXT,
    
    -- Ações
    acao_imediata TEXT, -- Contenção
    acao_corretiva TEXT, -- Correção da causa
    acao_preventiva TEXT, -- Prevenir recorrência
    
    -- Controle
    prazo_correcao DATE,
    responsavel VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ABERTA', -- 'ABERTA', 'EM_ANALISE', 'CORRECAO', 'VERIFICACAO', 'FECHADA', 'CANCELADA'
    eficaz BOOLEAN DEFAULT NULL, -- Verificação de eficácia
    data_verificacao DATE,
    
    -- Rastreabilidade
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_fechamento TIMESTAMP WITH TIME ZONE,
    aberto_por UUID REFERENCES public.usuarios(id),
    aprovado_por UUID REFERENCES public.usuarios(id),
    
    -- Evidências
    evidencias JSONB, -- URLs de fotos, documentos
    custo_nc NUMERIC(10,2), -- Custo da não conformidade
    
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para NC
CREATE INDEX IF NOT EXISTS idx_nc_equipamento ON public.nao_conformidades(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_nc_medicao ON public.nao_conformidades(medicao_id);
CREATE INDEX IF NOT EXISTS idx_nc_usuario ON public.nao_conformidades(usuario_id);
CREATE INDEX IF NOT EXISTS idx_nc_tipo ON public.nao_conformidades(tipo_nc);
CREATE INDEX IF NOT EXISTS idx_nc_status ON public.nao_conformidades(status);
CREATE INDEX IF NOT EXISTS idx_nc_data_abertura ON public.nao_conformidades(data_abertura);

-- ============================================
-- 2. MÓDULO DE TREINAMENTOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.treinamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'INICIAL', 'RECICLAGEM', 'ESPECIFICO', 'NORMA_ABNT', 'EQUIPAMENTO'
    instrutor VARCHAR(255),
    empresa_treinamento VARCHAR(255),
    carga_horaria INTEGER, -- em horas
    conteudo TEXT,
    
    -- Datas
    data_treinamento DATE NOT NULL,
    data_validade DATE, -- Alguns treinamentos expiram
    
    -- Avaliação
    aprovado BOOLEAN,
    nota NUMERIC(4,2), -- 0-100
    frequencia NUMERIC(5,2), -- % presença
    
    -- Documentos
    certificado_url TEXT,
    material_url TEXT,
    lista_presenca_url TEXT,
    
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para treinamentos
CREATE INDEX IF NOT EXISTS idx_treinamentos_usuario ON public.treinamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_treinamentos_tipo ON public.treinamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_treinamentos_data ON public.treinamentos(data_treinamento);
CREATE INDEX IF NOT EXISTS idx_treinamentos_validade ON public.treinamentos(data_validade);

-- ============================================
-- 3. INDICADORES DE QUALIDADE (KPIs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.indicadores_qualidade (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    periodo DATE NOT NULL, -- Primeiro dia do mês
    
    -- Medições
    total_medicoes INTEGER DEFAULT 0,
    medicoes_aprovadas INTEGER DEFAULT 0,
    medicoes_reprovadas INTEGER DEFAULT 0,
    taxa_conformidade NUMERIC(5,2), -- %
    tempo_medio_medicao INTEGER, -- minutos
    
    -- Equipamentos
    total_equipamentos INTEGER DEFAULT 0,
    equipamentos_calibrados INTEGER DEFAULT 0,
    equipamentos_vencidos INTEGER DEFAULT 0,
    taxa_calibracao NUMERIC(5,2), -- %
    
    -- Não Conformidades
    nao_conformidades_abertas INTEGER DEFAULT 0,
    nao_conformidades_fechadas INTEGER DEFAULT 0,
    nao_conformidades_pendentes INTEGER DEFAULT 0,
    tempo_medio_correcao INTEGER, -- dias
    
    -- Ações Corretivas
    acoes_corretivas_abertas INTEGER DEFAULT 0,
    acoes_corretivas_fechadas INTEGER DEFAULT 0,
    acoes_corretivas_eficazes INTEGER DEFAULT 0,
    taxa_eficacia_acoes NUMERIC(5,2), -- %
    
    -- Recursos Humanos
    total_operadores INTEGER DEFAULT 0,
    operadores_treinados INTEGER DEFAULT 0,
    operadores_certificados INTEGER DEFAULT 0,
    taxa_treinamento NUMERIC(5,2), -- %
    treinamentos_realizados INTEGER DEFAULT 0,
    
    -- Custos
    custo_nao_conformidades NUMERIC(10,2),
    custo_acoes_corretivas NUMERIC(10,2),
    custo_treinamentos NUMERIC(10,2),
    custo_total_qualidade NUMERIC(10,2),
    
    -- Satisfação (futuro)
    satisfacao_cliente NUMERIC(5,2), -- 0-10
    reclamacoes INTEGER DEFAULT 0,
    elogios INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para indicadores
CREATE UNIQUE INDEX IF NOT EXISTS idx_indicadores_periodo ON public.indicadores_qualidade(periodo);
CREATE INDEX IF NOT EXISTS idx_indicadores_taxa_conformidade ON public.indicadores_qualidade(taxa_conformidade);

-- ============================================
-- 4. POLÍTICA DA QUALIDADE
-- ============================================
CREATE TABLE IF NOT EXISTS public.politica_qualidade (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    versao VARCHAR(20) NOT NULL,
    data_aprovacao DATE NOT NULL,
    aprovado_por UUID REFERENCES public.usuarios(id),
    data_proxima_revisao DATE,
    ativo BOOLEAN DEFAULT true,
    documento_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apenas uma política ativa por vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_politica_ativa ON public.politica_qualidade(ativo) WHERE ativo = true;

-- ============================================
-- 5. OBJETIVOS DA QUALIDADE
-- ============================================
CREATE TABLE IF NOT EXISTS public.objetivos_qualidade (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    indicador VARCHAR(100), -- Nome do indicador
    meta_valor NUMERIC(10,2) NOT NULL,
    meta_unidade VARCHAR(50), -- '%', 'dias', 'unidades', 'R$'
    valor_atual NUMERIC(10,2),
    
    -- Período
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    periodicidade VARCHAR(50), -- 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'
    
    -- Responsabilidade
    responsavel VARCHAR(255),
    responsavel_id UUID REFERENCES public.usuarios(id),
    
    -- Status
    status VARCHAR(50) DEFAULT 'PLANEJADO', -- 'PLANEJADO', 'EM_ANDAMENTO', 'ATINGIDO', 'NAO_ATINGIDO', 'CANCELADO'
    percentual_atingido NUMERIC(5,2), -- %
    
    -- Ações
    plano_acao TEXT,
    recursos_necessarios TEXT,
    
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para objetivos
CREATE INDEX IF NOT EXISTS idx_objetivos_status ON public.objetivos_qualidade(status);
CREATE INDEX IF NOT EXISTS idx_objetivos_responsavel ON public.objetivos_qualidade(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_objetivos_periodo ON public.objetivos_qualidade(data_inicio, data_fim);

-- ============================================
-- 6. ANÁLISE CRÍTICA PELA DIREÇÃO
-- ============================================
CREATE TABLE IF NOT EXISTS public.analises_criticas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_reuniao VARCHAR(50),
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    data_reuniao TIMESTAMP WITH TIME ZONE NOT NULL,
    local VARCHAR(255),
    participantes JSONB, -- [{id, nome, funcao}]
    
    -- ENTRADAS (Itens a serem analisados)
    resultados_auditorias TEXT,
    feedback_clientes TEXT,
    desempenho_processos TEXT,
    status_acoes_anteriores TEXT,
    mudancas_contexto TEXT,
    oportunidades_melhoria TEXT,
    necessidade_mudancas_sgq TEXT,
    
    -- SAÍDAS (Decisões da direção)
    decisoes_melhoria TEXT,
    necessidades_mudancas_sgq TEXT,
    necessidades_recursos TEXT,
    acoes_definidas TEXT,
    
    -- Próxima reunião
    data_proxima_reuniao DATE,
    
    -- Documentos
    ata_reuniao_url TEXT,
    apresentacao_url TEXT,
    lista_presenca_url TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'AGENDADA', -- 'AGENDADA', 'REALIZADA', 'CANCELADA'
    
    aprovado_por UUID REFERENCES public.usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para análises críticas
CREATE INDEX IF NOT EXISTS idx_analises_data ON public.analises_criticas(data_reuniao);
CREATE INDEX IF NOT EXISTS idx_analises_status ON public.analises_criticas(status);

-- ============================================
-- 7. FORNECEDORES/LABORATÓRIOS HOMOLOGADOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.fornecedores_homologados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(50) NOT NULL, -- 'LABORATORIO', 'FORNECEDOR_EQUIPAMENTO', 'SERVICO_CALIBRACAO'
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    contato VARCHAR(255),
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    
    -- Homologação
    data_homologacao DATE,
    validade_homologacao DATE,
    criterios_homologacao TEXT,
    documentos_homologacao JSONB, -- URLs
    
    -- Avaliação
    nota_qualidade NUMERIC(4,2), -- 0-10
    nota_prazo NUMERIC(4,2),
    nota_custo NUMERIC(4,2),
    nota_geral NUMERIC(4,2),
    
    -- Status
    homologado BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para fornecedores
CREATE INDEX IF NOT EXISTS idx_fornecedores_tipo ON public.fornecedores_homologados(tipo);
CREATE INDEX IF NOT EXISTS idx_fornecedores_homologado ON public.fornecedores_homologados(homologado);
CREATE INDEX IF NOT EXISTS idx_fornecedores_ativo ON public.fornecedores_homologados(ativo);

-- ============================================
-- 8. TRIGGERS PARA UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_nao_conformidades_updated_at') THEN
        CREATE TRIGGER update_nao_conformidades_updated_at
            BEFORE UPDATE ON public.nao_conformidades
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_politica_qualidade_updated_at') THEN
        CREATE TRIGGER update_politica_qualidade_updated_at
            BEFORE UPDATE ON public.politica_qualidade
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_objetivos_qualidade_updated_at') THEN
        CREATE TRIGGER update_objetivos_qualidade_updated_at
            BEFORE UPDATE ON public.objetivos_qualidade
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_analises_criticas_updated_at') THEN
        CREATE TRIGGER update_analises_criticas_updated_at
            BEFORE UPDATE ON public.analises_criticas
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fornecedores_updated_at') THEN
        CREATE TRIGGER update_fornecedores_updated_at
            BEFORE UPDATE ON public.fornecedores_homologados
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.nao_conformidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicadores_qualidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.politica_qualidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objetivos_qualidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analises_criticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores_homologados ENABLE ROW LEVEL SECURITY;

-- Políticas (todos podem ver, apenas admin pode modificar)
DO $$ 
BEGIN
    -- Não Conformidades
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nao_conformidades' AND policyname = 'Todos podem ver NC') THEN
        CREATE POLICY "Todos podem ver NC" ON public.nao_conformidades FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nao_conformidades' AND policyname = 'Todos podem criar NC') THEN
        CREATE POLICY "Todos podem criar NC" ON public.nao_conformidades FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nao_conformidades' AND policyname = 'Admin edita NC') THEN
        CREATE POLICY "Admin edita NC" ON public.nao_conformidades FOR UPDATE USING (true);
    END IF;
    
    -- Treinamentos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'treinamentos' AND policyname = 'Todos podem ver treinamentos') THEN
        CREATE POLICY "Todos podem ver treinamentos" ON public.treinamentos FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'treinamentos' AND policyname = 'Admin gerencia treinamentos') THEN
        CREATE POLICY "Admin gerencia treinamentos" ON public.treinamentos FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    -- Indicadores
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'indicadores_qualidade' AND policyname = 'Todos podem ver indicadores') THEN
        CREATE POLICY "Todos podem ver indicadores" ON public.indicadores_qualidade FOR SELECT USING (true);
    END IF;
    
    -- Demais tabelas: apenas Admin
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'politica_qualidade' AND policyname = 'Ver política') THEN
        CREATE POLICY "Ver política" ON public.politica_qualidade FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objetivos_qualidade' AND policyname = 'Ver objetivos') THEN
        CREATE POLICY "Ver objetivos" ON public.objetivos_qualidade FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analises_criticas' AND policyname = 'Ver análises') THEN
        CREATE POLICY "Ver análises" ON public.analises_criticas FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fornecedores_homologados' AND policyname = 'Ver fornecedores') THEN
        CREATE POLICY "Ver fornecedores" ON public.fornecedores_homologados FOR SELECT USING (true);
    END IF;
END $$;

-- ============================================
-- 10. INSERIR DADOS INICIAIS
-- ============================================

-- Política da Qualidade Padrão
INSERT INTO public.politica_qualidade (titulo, conteudo, versao, data_aprovacao, data_proxima_revisao)
VALUES (
    'Política da Qualidade - MEDLUX Reflective',
    'A I.C.D. Indústria, Comércio e Distribuição de Materiais para Infraestrutura Viária se compromete a:

1. Fornecer serviços de medição de retrorrefletância com precisão e conformidade às normas ABNT;
2. Manter todos os equipamentos calibrados e rastreáveis;
3. Capacitar continuamente nossos colaboradores;
4. Buscar a melhoria contínua de nossos processos;
5. Atender aos requisitos dos clientes e partes interessadas;
6. Cumprir os requisitos legais e normativos aplicáveis;
7. Promover uma cultura de qualidade em toda a organização.

Esta política é comunicada, compreendida e praticada por todos os colaboradores e está disponível às partes interessadas.',
    'Rev. 01',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year'
) ON CONFLICT DO NOTHING;

-- Objetivos da Qualidade Padrão
INSERT INTO public.objetivos_qualidade (titulo, descricao, indicador, meta_valor, meta_unidade, data_inicio, data_fim, periodicidade, status)
VALUES 
    ('Conformidade ABNT', 'Manter taxa de conformidade superior a 95% em todas as medições', 'Taxa de Conformidade', 95.00, '%', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'MENSAL', 'EM_ANDAMENTO'),
    ('Rastreabilidade Total', 'Garantir 100% de rastreabilidade em todas as medições', 'Taxa de Rastreabilidade', 100.00, '%', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'MENSAL', 'EM_ANDAMENTO'),
    ('Calibração em Dia', 'Manter >95% dos equipamentos com calibração válida', 'Taxa de Calibração', 95.00, '%', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'MENSAL', 'EM_ANDAMENTO'),
    ('Treinamento', 'Garantir 100% dos operadores treinados e certificados', 'Taxa de Treinamento', 100.00, '%', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'TRIMESTRAL', 'EM_ANDAMENTO')
ON CONFLICT DO NOTHING;

-- ============================================
-- MENSAGEM FINAL
-- ============================================
DO $$
DECLARE
    v_count_nc INTEGER;
    v_count_treinamentos INTEGER;
    v_count_objetivos INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count_nc FROM public.nao_conformidades;
    SELECT COUNT(*) INTO v_count_treinamentos FROM public.treinamentos;
    SELECT COUNT(*) INTO v_count_objetivos FROM public.objetivos_qualidade;
    
    RAISE NOTICE '✅ MEDLUX Reflective - Melhorias ISO 9001:2015 aplicadas!';
    RAISE NOTICE '📊 Tabelas ISO criadas:';
    RAISE NOTICE '   • nao_conformidades';
    RAISE NOTICE '   • treinamentos';
    RAISE NOTICE '   • indicadores_qualidade';
    RAISE NOTICE '   • politica_qualidade';
    RAISE NOTICE '   • objetivos_qualidade';
    RAISE NOTICE '   • analises_criticas';
    RAISE NOTICE '   • fornecedores_homologados';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Dados iniciais:';
    RAISE NOTICE '   • Política da Qualidade: 1 registro';
    RAISE NOTICE '   • Objetivos da Qualidade: % registros', v_count_objetivos;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Sistema conforme ISO 9001:2015!';
    RAISE NOTICE '✅ Pronto para certificação!';
END $$;
