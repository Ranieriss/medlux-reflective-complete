-- =====================================================
-- MEDLUX Reflective - SQL CORRETO (Baseado na estrutura real)
-- =====================================================

-- LIMPAR TABELAS ANTIGAS
DROP TABLE IF EXISTS logs_erro CASCADE;
DROP TABLE IF EXISTS tokens_recuperacao_senha CASCADE;

-- CRIAR TABELA DE LOGS (nova estrutura)
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

-- CRIAR TABELA DE TOKENS
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

-- ADICIONAR COLUNAS DE CERTIFICADO (se não existirem)
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_url TEXT;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_data_upload TIMESTAMPTZ;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_laboratorio TEXT;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_numero TEXT;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_validade DATE;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_observacoes TEXT;

-- ADICIONAR COLUNAS DE CAUTELA (se não existirem)
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_url TEXT;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_data_upload TIMESTAMPTZ;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_data_entrega DATE;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_tecnico_responsavel TEXT;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_treinamento_realizado BOOLEAN DEFAULT false;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_observacoes TEXT;

-- ADICIONAR COLUNAS EXTRAS EM USUARIOS (se não existirem)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- ATUALIZAR SENHAS (usando o nome correto da coluna: senha_hash)
UPDATE usuarios SET senha_hash = '2308' WHERE email = 'admin@medlux.com';

-- INSERIR USUARIO OPERADOR SE NAO EXISTIR
INSERT INTO usuarios (nome, email, senha_hash, perfil, cpf, telefone, ativo)
VALUES ('Donevir', 'donevir@medlux.com', '123456', 'operador', '111.111.111-11', '(48) 99999-9999', true)
ON CONFLICT (email) DO UPDATE SET senha_hash = '123456';

-- PERMISSOES
GRANT SELECT, INSERT ON logs_erro TO authenticated;
GRANT SELECT ON tokens_recuperacao_senha TO authenticated;

-- MENSAGEM FINAL
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ SQL EXECUTADO COM SUCESSO!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Tabelas criadas:';
    RAISE NOTICE '  ✓ logs_erro';
    RAISE NOTICE '  ✓ tokens_recuperacao_senha';
    RAISE NOTICE '';
    RAISE NOTICE 'Colunas adicionadas:';
    RAISE NOTICE '  ✓ equipamentos (6 colunas certificado)';
    RAISE NOTICE '  ✓ vinculos (6 colunas cautela)';
    RAISE NOTICE '  ✓ usuarios (cpf, telefone, foto_url)';
    RAISE NOTICE '';
    RAISE NOTICE '👤 Credenciais atualizadas:';
    RAISE NOTICE '  Admin: admin@medlux.com / 2308';
    RAISE NOTICE '  Operador: donevir@medlux.com / 123456';
    RAISE NOTICE '============================================';
    RAISE NOTICE '🎉 SISTEMA PRONTO PARA USO!';
    RAISE NOTICE '============================================';
END $$;
