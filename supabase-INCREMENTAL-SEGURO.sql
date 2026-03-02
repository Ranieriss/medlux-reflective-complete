-- =====================================================
-- MEDLUX Reflective - SQL INCREMENTAL (SEM ERROS)
-- Executa apenas o que ainda não existe
-- =====================================================

-- 🔧 1. CRIAR TABELA LOGS_ERRO (se não existir)
CREATE TABLE IF NOT EXISTS logs_erro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    severidade TEXT NOT NULL DEFAULT 'error',
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

-- Índices (só cria se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_logs_erro_created_at') THEN
        CREATE INDEX idx_logs_erro_created_at ON logs_erro(created_at DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_logs_erro_severidade') THEN
        CREATE INDEX idx_logs_erro_severidade ON logs_erro(severidade);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_logs_erro_resolvido') THEN
        CREATE INDEX idx_logs_erro_resolvido ON logs_erro(resolvido) WHERE NOT resolvido;
    END IF;
END $$;

-- RLS
ALTER TABLE logs_erro ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem ver todos os logs" ON logs_erro;
CREATE POLICY "Admins podem ver todos os logs"
ON logs_erro FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE id = auth.uid()
        AND perfil IN ('admin', 'administrador')
    )
);

DROP POLICY IF EXISTS "Qualquer autenticado pode inserir logs" ON logs_erro;
CREATE POLICY "Qualquer autenticado pode inserir logs"
ON logs_erro FOR INSERT
TO authenticated
WITH CHECK (true);

-- 🔧 2. CRIAR TABELA TOKENS_RECUPERACAO_SENHA (se não existir)
CREATE TABLE IF NOT EXISTS tokens_recuperacao_senha (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
    usado BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tokens_recuperacao_token') THEN
        CREATE INDEX idx_tokens_recuperacao_token ON tokens_recuperacao_senha(token);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tokens_recuperacao_usuario') THEN
        CREATE INDEX idx_tokens_recuperacao_usuario ON tokens_recuperacao_senha(usuario_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tokens_recuperacao_expira') THEN
        CREATE INDEX idx_tokens_recuperacao_expira ON tokens_recuperacao_senha(expira_em);
    END IF;
END $$;

-- RLS
ALTER TABLE tokens_recuperacao_senha ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem gerenciar seus tokens" ON tokens_recuperacao_senha;
CREATE POLICY "Usuários podem gerenciar seus tokens"
ON tokens_recuperacao_senha FOR ALL
TO authenticated
USING (usuario_id = auth.uid());

-- 🔧 3. ADICIONAR COLUNAS DE CERTIFICADO (se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'equipamentos' AND column_name = 'certificado_url') THEN
        ALTER TABLE equipamentos ADD COLUMN certificado_url TEXT;
        ALTER TABLE equipamentos ADD COLUMN certificado_data_upload TIMESTAMPTZ;
        ALTER TABLE equipamentos ADD COLUMN certificado_laboratorio TEXT;
        ALTER TABLE equipamentos ADD COLUMN certificado_numero TEXT;
        ALTER TABLE equipamentos ADD COLUMN certificado_validade DATE;
        ALTER TABLE equipamentos ADD COLUMN certificado_observacoes TEXT;
        RAISE NOTICE '✅ Colunas de certificado adicionadas em equipamentos';
    ELSE
        RAISE NOTICE '⏭️ Colunas de certificado já existem em equipamentos';
    END IF;
END $$;

-- 🔧 4. ADICIONAR COLUNAS DE CAUTELA (se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vinculos' AND column_name = 'cautela_url') THEN
        ALTER TABLE vinculos ADD COLUMN cautela_url TEXT;
        ALTER TABLE vinculos ADD COLUMN cautela_data_upload TIMESTAMPTZ;
        ALTER TABLE vinculos ADD COLUMN cautela_data_entrega DATE;
        ALTER TABLE vinculos ADD COLUMN cautela_tecnico_responsavel TEXT;
        ALTER TABLE vinculos ADD COLUMN cautela_treinamento_realizado BOOLEAN DEFAULT false;
        ALTER TABLE vinculos ADD COLUMN cautela_observacoes TEXT;
        RAISE NOTICE '✅ Colunas de cautela adicionadas em vínculos';
    ELSE
        RAISE NOTICE '⏭️ Colunas de cautela já existem em vínculos';
    END IF;
END $$;

-- 🔧 5. CRIAR/ATUALIZAR VIEWS
CREATE OR REPLACE VIEW vw_equipamentos_certificados AS
SELECT 
    e.*,
    CASE
        WHEN e.certificado_url IS NULL THEN 'SEM_CERTIFICADO'
        WHEN e.certificado_validade IS NULL THEN 'CERTIFICADO_SEM_VALIDADE'
        WHEN e.certificado_validade < CURRENT_DATE THEN 'CERTIFICADO_VENCIDO'
        WHEN e.certificado_validade < (CURRENT_DATE + INTERVAL '30 days') THEN 'CERTIFICADO_ATENCAO'
        ELSE 'CERTIFICADO_VALIDO'
    END as status_certificado,
    e.certificado_validade - CURRENT_DATE as dias_ate_vencimento_certificado
FROM equipamentos e;

CREATE OR REPLACE VIEW vw_vinculos_cautelas AS
SELECT 
    v.*,
    u.nome as usuario_nome,
    u.email as usuario_email,
    u.cpf as usuario_cpf,
    u.telefone as usuario_telefone,
    u.perfil as usuario_perfil,
    e.codigo as equipamento_codigo,
    e.nome as equipamento_nome,
    e.tipo as equipamento_tipo,
    e.status as equipamento_status,
    CASE
        WHEN v.cautela_url IS NULL THEN 'SEM_CAUTELA'
        WHEN NOT v.cautela_treinamento_realizado THEN 'TREINAMENTO_PENDENTE'
        ELSE 'CAUTELA_COMPLETA'
    END as status_cautela
FROM vinculos v
LEFT JOIN usuarios u ON v.usuario_id = u.id
LEFT JOIN equipamentos e ON v.equipamento_id = e.id;

-- 🔧 6. CRIAR/ATUALIZAR FUNCTIONS
CREATE OR REPLACE FUNCTION registrar_log_erro(
    p_mensagem TEXT,
    p_severidade TEXT DEFAULT 'error',
    p_stack_trace TEXT DEFAULT NULL,
    p_arquivo TEXT DEFAULT NULL,
    p_linha INTEGER DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
    p_dados_contexto JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_usuario_id UUID;
BEGIN
    BEGIN
        v_usuario_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_usuario_id := NULL;
    END;

    INSERT INTO logs_erro (
        usuario_id, severidade, mensagem, stack_trace,
        arquivo, linha, url, dados_contexto, ip, user_agent
    ) VALUES (
        v_usuario_id, p_severidade, p_mensagem, p_stack_trace,
        p_arquivo, p_linha, p_url, p_dados_contexto,
        inet_client_addr()::TEXT,
        current_setting('request.headers', true)::JSON->>'user-agent'
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION solicitar_recuperacao_senha(p_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, token TEXT) AS $$
DECLARE
    v_usuario_id UUID;
    v_token TEXT;
BEGIN
    SELECT id INTO v_usuario_id
    FROM usuarios
    WHERE LOWER(email) = LOWER(p_email) AND ativo = true;

    IF v_usuario_id IS NULL THEN
        RETURN QUERY SELECT false, 'Usuário não encontrado', NULL::TEXT;
        RETURN;
    END IF;

    v_token := encode(gen_random_bytes(32), 'hex');
    INSERT INTO tokens_recuperacao_senha (usuario_id, token)
    VALUES (v_usuario_id, v_token);

    RETURN QUERY SELECT true, 'Token gerado com sucesso', v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION redefinir_senha_com_token(
    p_token TEXT,
    p_nova_senha TEXT
) RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    v_usuario_id UUID;
    v_token_valido BOOLEAN;
BEGIN
    SELECT usuario_id, (expira_em > NOW() AND NOT usado)
    INTO v_usuario_id, v_token_valido
    FROM tokens_recuperacao_senha
    WHERE token = p_token;

    IF v_usuario_id IS NULL THEN
        RETURN QUERY SELECT false, 'Token inválido';
        RETURN;
    END IF;

    IF NOT v_token_valido THEN
        RETURN QUERY SELECT false, 'Token expirado ou já utilizado';
        RETURN;
    END IF;

    UPDATE usuarios SET senha = p_nova_senha, updated_at = NOW()
    WHERE id = v_usuario_id;

    UPDATE tokens_recuperacao_senha SET usado = true WHERE token = p_token;

    RETURN QUERY SELECT true, 'Senha redefinida com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🔧 7. CRIAR ÍNDICES ADICIONAIS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_equipamentos_tipo') THEN
        CREATE INDEX idx_equipamentos_tipo ON equipamentos(tipo);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_equipamentos_status') THEN
        CREATE INDEX idx_equipamentos_status ON equipamentos(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_equipamentos_codigo_lower') THEN
        CREATE INDEX idx_equipamentos_codigo_lower ON equipamentos(LOWER(codigo));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_usuarios_email_lower') THEN
        CREATE INDEX idx_usuarios_email_lower ON usuarios(LOWER(email));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_usuarios_perfil') THEN
        CREATE INDEX idx_usuarios_perfil ON usuarios(perfil);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_usuarios_ativo') THEN
        CREATE INDEX idx_usuarios_ativo ON usuarios(ativo) WHERE ativo = true;
    END IF;
END $$;

-- 🔧 8. CORRIGIR DADOS EXISTENTES
UPDATE usuarios
SET perfil = 'operador'
WHERE perfil IS NULL OR perfil NOT IN ('admin', 'administrador', 'tecnico', 'operador');

UPDATE usuarios SET ativo = true WHERE ativo IS NULL;

-- 🔧 9. GARANTIR USUÁRIOS DE TESTE
DO $$
BEGIN
    -- Admin
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@medlux.com') THEN
        INSERT INTO usuarios (nome, email, senha, perfil, cpf, telefone, ativo)
        VALUES ('Administrador', 'admin@medlux.com', '2308', 'admin', 
                '000.000.000-00', '(48) 2106-3022', true);
    ELSE
        UPDATE usuarios SET senha = '2308', ativo = true, perfil = 'admin'
        WHERE email = 'admin@medlux.com';
    END IF;

    -- Donevir
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'donevir@medlux.com') THEN
        INSERT INTO usuarios (nome, email, senha, perfil, cpf, telefone, ativo)
        VALUES ('Donevir', 'donevir@medlux.com', '123456', 'operador',
                '111.111.111-11', '(48) 99999-9999', true);
    ELSE
        UPDATE usuarios SET senha = '123456', ativo = true, perfil = 'operador'
        WHERE email = 'donevir@medlux.com';
    END IF;
END $$;

-- 🔧 10. PERMISSIONS
GRANT SELECT, INSERT ON logs_erro TO authenticated;
GRANT SELECT ON tokens_recuperacao_senha TO authenticated;
GRANT EXECUTE ON FUNCTION registrar_log_erro TO authenticated;
GRANT EXECUTE ON FUNCTION solicitar_recuperacao_senha TO anon, authenticated;
GRANT EXECUTE ON FUNCTION redefinir_senha_com_token TO anon, authenticated;

-- ✅ MENSAGEM FINAL
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SQL EXECUTADO COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 Tabelas: logs_erro, tokens_recuperacao_senha';
    RAISE NOTICE '📊 Views: vw_equipamentos_certificados, vw_vinculos_cautelas';
    RAISE NOTICE '⚙️ Functions: 3 criadas/atualizadas';
    RAISE NOTICE '🔒 Políticas RLS aplicadas';
    RAISE NOTICE '📈 Índices criados';
    RAISE NOTICE '👤 Usuários de teste atualizados';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📧 CREDENCIAIS DE TESTE:';
    RAISE NOTICE '   Admin: admin@medlux.com / 2308';
    RAISE NOTICE '   Donevir: donevir@medlux.com / 123456';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 SISTEMA PRONTO PARA USO!';
    RAISE NOTICE '========================================';
END $$;
