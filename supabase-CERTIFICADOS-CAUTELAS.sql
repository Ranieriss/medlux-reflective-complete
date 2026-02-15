-- =====================================================
-- MEDLUX Reflective - Certificados e Cautelas
-- Script para adicionar suporte a PDFs de certificação
-- =====================================================

-- 1️⃣ EQUIPAMENTOS: Adicionar campos para certificado de calibração
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_url TEXT;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_data_upload TIMESTAMPTZ;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_laboratorio TEXT;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_numero TEXT;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_validade DATE;
ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS certificado_observacoes TEXT;

-- 2️⃣ VÍNCULOS: Adicionar campos para cautela de recebimento técnico
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_url TEXT;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_data_upload TIMESTAMPTZ;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_data_entrega DATE;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_tecnico_responsavel TEXT;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_treinamento_realizado BOOLEAN DEFAULT false;
ALTER TABLE vinculos ADD COLUMN IF NOT EXISTS cautela_observacoes TEXT;

-- 3️⃣ ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_equipamentos_certificado 
ON equipamentos(certificado_url) WHERE certificado_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_equipamentos_certificado_validade 
ON equipamentos(certificado_validade) WHERE certificado_validade IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vinculos_cautela 
ON vinculos(cautela_url) WHERE cautela_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vinculos_cautela_entrega 
ON vinculos(cautela_data_entrega) WHERE cautela_data_entrega IS NOT NULL;

-- 4️⃣ VIEW: Equipamentos com status de certificado
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

-- 5️⃣ VIEW: Vínculos com status de cautela
CREATE OR REPLACE VIEW vw_vinculos_cautelas AS
SELECT 
    v.*,
    u.nome as usuario_nome,
    u.email as usuario_email,
    u.cpf as usuario_cpf,
    u.telefone as usuario_telefone,
    e.codigo as equipamento_codigo,
    e.nome as equipamento_nome,
    e.tipo as equipamento_tipo,
    CASE
        WHEN v.cautela_url IS NULL THEN 'SEM_CAUTELA'
        WHEN NOT v.cautela_treinamento_realizado THEN 'TREINAMENTO_PENDENTE'
        ELSE 'CAUTELA_COMPLETA'
    END as status_cautela
FROM vinculos v
LEFT JOIN usuarios u ON v.usuario_id = u.id
LEFT JOIN equipamentos e ON v.equipamento_id = e.id;

-- 6️⃣ FUNCTION: Validar vencimento de certificados
CREATE OR REPLACE FUNCTION validar_vencimento_certificados()
RETURNS TABLE(
    equipamento_id UUID,
    equipamento_codigo TEXT,
    equipamento_nome TEXT,
    certificado_validade DATE,
    dias_restantes INTEGER,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.codigo,
        e.nome,
        e.certificado_validade,
        (e.certificado_validade - CURRENT_DATE)::INTEGER as dias_restantes,
        CASE
            WHEN e.certificado_validade < CURRENT_DATE THEN 'VENCIDO'
            WHEN e.certificado_validade < (CURRENT_DATE + INTERVAL '30 days') THEN 'ATENÇÃO'
            ELSE 'VÁLIDO'
        END as status
    FROM equipamentos e
    WHERE e.certificado_url IS NOT NULL
    AND e.certificado_validade IS NOT NULL
    AND e.status = 'ativo'
    ORDER BY e.certificado_validade ASC;
END;
$$ LANGUAGE plpgsql;

-- 7️⃣ FUNCTION: Listar cautelas pendentes
CREATE OR REPLACE FUNCTION listar_cautelas_pendentes()
RETURNS TABLE(
    vinculo_id UUID,
    usuario_nome TEXT,
    usuario_email TEXT,
    equipamento_codigo TEXT,
    equipamento_nome TEXT,
    data_inicio DATE,
    status_cautela TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        u.nome,
        u.email,
        e.codigo,
        e.nome,
        v.data_inicio,
        CASE
            WHEN v.cautela_url IS NULL THEN 'SEM CAUTELA'
            WHEN NOT v.cautela_treinamento_realizado THEN 'TREINAMENTO PENDENTE'
            ELSE 'COMPLETO'
        END as status
    FROM vinculos v
    LEFT JOIN usuarios u ON v.usuario_id = u.id
    LEFT JOIN equipamentos e ON v.equipamento_id = e.id
    WHERE v.ativo = true
    AND (v.cautela_url IS NULL OR NOT v.cautela_treinamento_realizado)
    ORDER BY v.data_inicio DESC;
END;
$$ LANGUAGE plpgsql;

-- 8️⃣ TRIGGER: Registrar upload de certificado na auditoria
CREATE OR REPLACE FUNCTION registrar_upload_certificado()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.certificado_url IS NOT NULL AND 
       (OLD.certificado_url IS NULL OR NEW.certificado_url != OLD.certificado_url) THEN
        
        INSERT INTO auditoria (
            usuario_id,
            acao,
            tabela,
            registro_id,
            dados_anteriores,
            dados_novos,
            ip,
            user_agent
        ) VALUES (
            current_setting('app.current_user_id', true)::UUID,
            'UPLOAD_CERTIFICADO',
            'equipamentos',
            NEW.id,
            jsonb_build_object('certificado_url', OLD.certificado_url),
            jsonb_build_object(
                'certificado_url', NEW.certificado_url,
                'certificado_laboratorio', NEW.certificado_laboratorio,
                'certificado_numero', NEW.certificado_numero,
                'certificado_validade', NEW.certificado_validade
            ),
            inet_client_addr()::TEXT,
            current_setting('app.user_agent', true)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_upload_certificado ON equipamentos;
CREATE TRIGGER trigger_upload_certificado
    AFTER INSERT OR UPDATE ON equipamentos
    FOR EACH ROW
    EXECUTE FUNCTION registrar_upload_certificado();

-- 9️⃣ TRIGGER: Registrar upload de cautela na auditoria
CREATE OR REPLACE FUNCTION registrar_upload_cautela()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cautela_url IS NOT NULL AND 
       (OLD.cautela_url IS NULL OR NEW.cautela_url != OLD.cautela_url) THEN
        
        INSERT INTO auditoria (
            usuario_id,
            acao,
            tabela,
            registro_id,
            dados_anteriores,
            dados_novos,
            ip,
            user_agent
        ) VALUES (
            current_setting('app.current_user_id', true)::UUID,
            'UPLOAD_CAUTELA',
            'vinculos',
            NEW.id,
            jsonb_build_object('cautela_url', OLD.cautela_url),
            jsonb_build_object(
                'cautela_url', NEW.cautela_url,
                'cautela_data_entrega', NEW.cautela_data_entrega,
                'cautela_tecnico_responsavel', NEW.cautela_tecnico_responsavel,
                'cautela_treinamento_realizado', NEW.cautela_treinamento_realizado
            ),
            inet_client_addr()::TEXT,
            current_setting('app.user_agent', true)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_upload_cautela ON vinculos;
CREATE TRIGGER trigger_upload_cautela
    AFTER INSERT OR UPDATE ON vinculos
    FOR EACH ROW
    EXECUTE FUNCTION registrar_upload_cautela();

-- 🔟 COMENTÁRIOS nas colunas
COMMENT ON COLUMN equipamentos.certificado_url IS 'URL do certificado de calibração em PDF no storage';
COMMENT ON COLUMN equipamentos.certificado_data_upload IS 'Data de upload do certificado';
COMMENT ON COLUMN equipamentos.certificado_laboratorio IS 'Nome do laboratório emissor do certificado';
COMMENT ON COLUMN equipamentos.certificado_numero IS 'Número do certificado de calibração';
COMMENT ON COLUMN equipamentos.certificado_validade IS 'Data de validade do certificado';

COMMENT ON COLUMN vinculos.cautela_url IS 'URL da cautela de recebimento técnico em PDF';
COMMENT ON COLUMN vinculos.cautela_data_upload IS 'Data de upload da cautela';
COMMENT ON COLUMN vinculos.cautela_data_entrega IS 'Data de entrega técnica do equipamento';
COMMENT ON COLUMN vinculos.cautela_tecnico_responsavel IS 'Nome do técnico responsável pela entrega';
COMMENT ON COLUMN vinculos.cautela_treinamento_realizado IS 'Se o treinamento de uso foi realizado';

-- ✅ LOG DE CONCLUSÃO
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Script executado com sucesso!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 Colunas adicionadas:';
    RAISE NOTICE '   - equipamentos: 6 campos de certificado';
    RAISE NOTICE '   - vinculos: 6 campos de cautela';
    RAISE NOTICE '📊 Views criadas:';
    RAISE NOTICE '   - vw_equipamentos_certificados';
    RAISE NOTICE '   - vw_vinculos_cautelas';
    RAISE NOTICE '⚙️ Functions criadas:';
    RAISE NOTICE '   - validar_vencimento_certificados()';
    RAISE NOTICE '   - listar_cautelas_pendentes()';
    RAISE NOTICE '🔔 Triggers criados:';
    RAISE NOTICE '   - trigger_upload_certificado';
    RAISE NOTICE '   - trigger_upload_cautela';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 Sistema pronto para uso!';
    RAISE NOTICE '========================================';
END $$;
