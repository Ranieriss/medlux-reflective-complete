-- =====================================================
-- MEDLUX Reflective - SQL COMPLETO E FINAL v2
-- EXECUÇÃO LIMPA: Remove e recria tudo do zero
-- =====================================================

-- 🗑️ LIMPEZA: Remover objetos antigos com problemas
DROP TABLE IF EXISTS logs_erro CASCADE;
DROP TABLE IF EXISTS tokens_recuperacao_senha CASCADE;
DROP VIEW IF EXISTS vw_equipamentos_certificados CASCADE;
DROP VIEW IF EXISTS vw_vinculos_cautelas CASCADE;
DROP FUNCTION IF EXISTS registrar_log_erro CASCADE;
DROP FUNCTION IF EXISTS solicitar_recuperacao_senha CASCADE;
DROP FUNCTION IF EXISTS redefinir_senha_com_token CASCADE;

-- 🔧 1. CRIAR TABELA DE LOGS DE ERRO (NOVA)
CREATE TABLE logs_erro (
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

CREATE INDEX idx_logs_erro_created_at ON logs_erro(created_at DESC);
CREATE INDEX idx_logs_erro_severidade ON logs_erro(severidade);
CREATE INDEX idx_logs_erro_resolvido ON logs_erro(resolvido) WHERE NOT resolvido;

COMMENT ON TABLE logs_erro IS 'Registro de erros do sistema para debug e monitoramento';

-- 🔐 2. POLÍTICAS RLS PARA LOGS DE ERRO
ALTER TABLE logs_erro ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Qualquer autenticado pode inserir logs"
ON logs_erro FOR INSERT
TO authenticated
WITH CHECK (true);

-- 📧 3. SISTEMA DE RECUPERAÇÃO DE SENHA
CREATE TABLE tokens_recuperacao_senha (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
    usado BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tokens_recuperacao_token ON tokens_recuperacao_senha(token);
CREATE INDEX idx_tokens_recuperacao_usuario ON tokens_recuperacao_senha(usuario_id);
CREATE INDEX idx_tokens_recuperacao_expira ON tokens_recuperacao_senha(expira_em);

-- Política RLS para tokens
ALTER TABLE tokens_recuperacao_senha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar seus tokens"
ON tokens_recuperacao_senha FOR ALL
TO authenticated
USING (usuario_id = auth.uid());

-- 🔧 4. CERTIFICADOS E CAUTELAS (adicionar colunas se não existirem)
DO $$
BEGIN
    -- Equipamentos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipamentos' AND column_name = 'certificado_url') THEN
        ALTER TABLE equipamentos ADD COLUMN certificado_url TEXT;
        ALTER TABLE equipamentos ADD COLUMN certificado_data_upload TIMESTAMPTZ;
        ALTER TABLE equipamentos ADD COLUMN certificado_laboratorio TEXT;
        ALTER TABLE equipamentos ADD COLUMN certificado_numero TEXT;
        ALTER TABLE equipamentos ADD COLUMN certificado_validade DATE;
        ALTER TABLE equipamentos ADD COLUMN certificado_observacoes TEXT;
    END IF;

    -- Vínculos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vinculos' AND column_name = 'cautela_url') THEN
        ALTER TABLE vinculos ADD COLUMN cautela_url TEXT;
        ALTER TABLE vinculos ADD COLUMN cautela_data_upload TIMESTAMPTZ;
        ALTER TABLE vinculos ADD COLUMN cautela_data_entrega DATE;
        ALTER TABLE vinculos ADD COLUMN cautela_tecnico_responsavel TEXT;
        ALTER TABLE vinculos ADD COLUMN cautela_treinamento_realizado BOOLEAN DEFAULT false;
        ALTER TABLE vinculos ADD COLUMN cautela_observacoes TEXT;
    END IF;
END $$;

-- 📊 5. VIEWS ATUALIZADAS

-- View de equipamentos com certificados
CREATE VIEW vw_equipamentos_certificados AS
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

-- View de vínculos com cautelas
CREATE VIEW vw_vinculos_cautelas AS
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

-- 🔧 6. FUNCTION: Registrar log de erro
CREATE FUNCTION registrar_log_erro(
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
    -- Tentar obter usuário atual
    BEGIN
        v_usuario_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_usuario_id := NULL;
    END;

    INSERT INTO logs_erro (
        usuario_id,
        severidade,
        mensagem,
        stack_trace,
        arquivo,
        linha,
        url,
        dados_contexto,
        ip,
        user_agent
    ) VALUES (
        v_usuario_id,
        p_severidade,
        p_mensagem,
        p_stack_trace,
        p_arquivo,
        p_linha,
        p_url,
        p_dados_contexto,
        inet_client_addr()::TEXT,
        current_setting('request.headers', true)::JSON->>'user-agent'
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🔧 7. FUNCTION: Solicitar recuperação de senha
CREATE FUNCTION solicitar_recuperacao_senha(p_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, token TEXT) AS $$
DECLARE
    v_usuario_id UUID;
    v_token TEXT;
BEGIN
    -- Buscar usuário por email
    SELECT id INTO v_usuario_id
    FROM usuarios
    WHERE LOWER(email) = LOWER(p_email)
    AND ativo = true;

    IF v_usuario_id IS NULL THEN
        RETURN QUERY SELECT false, 'Usuário não encontrado', NULL::TEXT;
        RETURN;
    END IF;

    -- Gerar token único
    v_token := encode(gen_random_bytes(32), 'hex');

    -- Inserir token
    INSERT INTO tokens_recuperacao_senha (usuario_id, token)
    VALUES (v_usuario_id, v_token);

    RETURN QUERY SELECT true, 'Token gerado com sucesso', v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🔧 8. FUNCTION: Redefinir senha com token
CREATE FUNCTION redefinir_senha_com_token(
    p_token TEXT,
    p_nova_senha TEXT
) RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    v_usuario_id UUID;
    v_token_valido BOOLEAN;
BEGIN
    -- Verificar token
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

    -- Atualizar senha
    UPDATE usuarios
    SET senha = p_nova_senha,
        updated_at = NOW()
    WHERE id = v_usuario_id;

    -- Marcar token como usado
    UPDATE tokens_recuperacao_senha
    SET usado = true
    WHERE token = p_token;

    RETURN QUERY SELECT true, 'Senha redefinida com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🔧 9. ÍNDICES ADICIONAIS PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_equipamentos_tipo ON equipamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_equipamentos_status ON equipamentos(status);
CREATE INDEX IF NOT EXISTS idx_equipamentos_codigo_lower ON equipamentos(LOWER(codigo));
CREATE INDEX IF NOT EXISTS idx_usuarios_email_lower ON usuarios(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo) WHERE ativo = true;

-- 🔧 10. CORRIGIR DADOS EXISTENTES
UPDATE usuarios
SET perfil = 'operador'
WHERE perfil IS NULL OR perfil NOT IN ('admin', 'administrador', 'tecnico', 'operador');

UPDATE usuarios
SET ativo = true
WHERE ativo IS NULL;

-- 🔧 11. POPULAR DADOS DE TESTE
DO $$
BEGIN
    -- Criar usuários de teste se não existirem
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@medlux.com') THEN
        INSERT INTO usuarios (nome, email, senha, perfil, cpf, telefone, ativo)
        VALUES 
        ('Administrador', 'admin@medlux.com', '2308', 'admin', '000.000.000-00', '(48) 2106-3022', true),
        ('Donevir', 'donevir@medlux.com', '123456', 'operador', '111.111.111-11', '(48) 99999-9999', true);
    END IF;

    -- Atualizar senhas
    UPDATE usuarios SET senha = '2308' WHERE email = 'admin@medlux.com';
    UPDATE usuarios SET senha = '123456' WHERE email = 'donevir@medlux.com';
END $$;

-- 🔧 12. PERMISSÕES
GRANT SELECT, INSERT ON logs_erro TO authenticated;
GRANT SELECT ON tokens_recuperacao_senha TO authenticated;
GRANT EXECUTE ON FUNCTION registrar_log_erro TO authenticated;
GRANT EXECUTE ON FUNCTION solicitar_recuperacao_senha TO anon, authenticated;
GRANT EXECUTE ON FUNCTION redefinir_senha_com_token TO anon, authenticated;

-- ✅ CONCLUSÃO
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SQL COMPLETO EXECUTADO COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 Tabelas criadas:';
    RAISE NOTICE '   - logs_erro (NOVA - com severidade)';
    RAISE NOTICE '   - tokens_recuperacao_senha';
    RAISE NOTICE '📊 Views criadas:';
    RAISE NOTICE '   - vw_equipamentos_certificados';
    RAISE NOTICE '   - vw_vinculos_cautelas';
    RAISE NOTICE '⚙️ Functions criadas:';
    RAISE NOTICE '   - registrar_log_erro()';
    RAISE NOTICE '   - solicitar_recuperacao_senha()';
    RAISE NOTICE '   - redefinir_senha_com_token()';
    RAISE NOTICE '🔒 Políticas RLS aplicadas';
    RAISE NOTICE '📈 Índices criados';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 SISTEMA PRONTO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📧 CREDENCIAIS:';
    RAISE NOTICE '   Admin: admin@medlux.com / 2308';
    RAISE NOTICE '   Operador: donevir@medlux.com / 123456';
    RAISE NOTICE '========================================';
END $$;
