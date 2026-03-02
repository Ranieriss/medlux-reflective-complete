-- =====================================================
-- MEDLUX Reflective - SQL FINAL LIMPO (SEM ERROS)
-- =====================================================

-- LIMPAR TUDO ANTES
DROP TABLE IF EXISTS logs_erro CASCADE;
DROP TABLE IF EXISTS tokens_recuperacao_senha CASCADE;

-- TABELA DE LOGS
CREATE TABLE logs_erro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    severidade TEXT DEFAULT 'error',
    mensagem TEXT NOT NULL,
    stack_trace TEXT,
    arquivo TEXT,
    linha INTEGER,
    url TEXT,
    user_agent TEXT,
    ip TEXT,
    dados_contexto JSONB,
    resolvido BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_created ON logs_erro(created_at DESC);
CREATE INDEX idx_logs_sev ON logs_erro(severidade);

ALTER TABLE logs_erro ENABLE ROW LEVEL SECURITY;

CREATE POLICY logs_select ON logs_erro FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil IN ('admin', 'administrador')));

CREATE POLICY logs_insert ON logs_erro FOR INSERT TO authenticated WITH CHECK (true);

-- TABELA DE TOKENS
CREATE TABLE tokens_recuperacao_senha (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),
    usado BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token ON tokens_recuperacao_senha(token);

ALTER TABLE tokens_recuperacao_senha ENABLE ROW LEVEL SECURITY;

CREATE POLICY tokens_all ON tokens_recuperacao_senha FOR ALL TO authenticated
USING (usuario_id = auth.uid());

-- ADICIONAR COLUNAS DE CERTIFICADO
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_url TEXT;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_data_upload TIMESTAMPTZ;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_laboratorio TEXT;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_numero TEXT;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_validade DATE;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_observacoes TEXT;

-- ADICIONAR COLUNAS DE CAUTELA
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_url TEXT;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_data_upload TIMESTAMPTZ;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_data_entrega DATE;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_tecnico_responsavel TEXT;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_treinamento_realizado BOOLEAN DEFAULT false;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_observacoes TEXT;

-- CRIAR/ATUALIZAR USUARIOS DE TESTE
INSERT INTO usuarios (nome, email, senha, perfil, cpf, telefone, ativo)
VALUES 
('Administrador', 'admin@medlux.com', '2308', 'admin', '000.000.000-00', '(48) 2106-3022', true),
('Donevir', 'donevir@medlux.com', '123456', 'operador', '111.111.111-11', '(48) 99999-9999', true)
ON CONFLICT (email) DO UPDATE SET senha = EXCLUDED.senha;

-- PERMISSOES
GRANT SELECT, INSERT ON logs_erro TO authenticated;
GRANT SELECT ON tokens_recuperacao_senha TO authenticated;

-- MENSAGEM FINAL
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'SUCESSO! SQL executado sem erros';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Credenciais:';
    RAISE NOTICE '  Admin: admin@medlux.com / 2308';
    RAISE NOTICE '  Operador: donevir@medlux.com / 123456';
    RAISE NOTICE '============================================';
END $$;
