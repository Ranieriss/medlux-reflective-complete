-- MEDLUX Reflective - Schema Simplificado para Teste
-- Execute este primeiro para testar a conexão

-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) NOT NULL DEFAULT 'tecnico',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de equipamentos
CREATE TABLE IF NOT EXISTS public.equipamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ativo',
    fabricante VARCHAR(255),
    modelo VARCHAR(255),
    numero_serie VARCHAR(255),
    localizacao VARCHAR(255),
    data_aquisicao DATE,
    data_ultima_calibracao DATE,
    proxima_calibracao DATE,
    certificado_calibracao VARCHAR(255),
    observacoes TEXT,
    foto_url TEXT,
    qr_code TEXT,
    usuario_atual_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    geometria VARCHAR(50),
    funcao VARCHAR(100),
    status_operacional VARCHAR(50),
    localidade_cidade_uf VARCHAR(255),
    data_entrega_usuario DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (acesso total por enquanto)
CREATE POLICY "Acesso total usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total equipamentos" ON public.equipamentos FOR ALL USING (true) WITH CHECK (true);

-- Usuário admin
INSERT INTO public.usuarios (email, nome, senha_hash, perfil, ativo)
VALUES ('admin@medlux.com', 'Administrador', 'admin123', 'administrador', true)
ON CONFLICT (email) DO NOTHING;

-- Mensagem de sucesso
SELECT 'Schema básico criado com sucesso!' AS resultado;
