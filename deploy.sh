#!/bin/bash
# MEDLUX Reflective - Script de Deploy Rápido para Cloudflare Pages
# Data: 2026-02-15

echo "🚀 MEDLUX Reflective - Deploy para Cloudflare Pages"
echo "=================================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: package.json não encontrado.${NC}"
    echo "Execute este script a partir da raiz do projeto."
    exit 1
fi

echo -e "${YELLOW}📦 Passo 1/3: Instalando dependências...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

echo -e "${YELLOW}🔨 Passo 2/3: Buildando aplicação...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao buildar aplicação.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build concluído com sucesso${NC}"
echo ""

echo -e "${YELLOW}🚀 Passo 3/3: Fazendo deploy...${NC}"
echo "Você será redirecionado para autenticar no Cloudflare..."
echo ""

# Verificar se Wrangler está instalado
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx não encontrado. Instale o Node.js primeiro.${NC}"
    exit 1
fi

# Login no Cloudflare (se necessário)
echo "Verificando autenticação..."
npx wrangler whoami 2>/dev/null || npx wrangler login

# Deploy
echo ""
echo "Iniciando deploy..."
npx wrangler pages deploy dist --project-name=medlux-reflective

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=================================================="
    echo "✅ Deploy concluído com sucesso!"
    echo "=================================================="
    echo ""
    echo "🌐 Sua aplicação está disponível em:"
    echo "   https://medlux-reflective.pages.dev"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Acessar: https://dash.cloudflare.com/"
    echo "   2. Ir em Workers & Pages → medlux-reflective"
    echo "   3. Configurar Environment Variables:"
    echo "      - VITE_SUPABASE_URL"
    echo "      - VITE_SUPABASE_ANON_KEY"
    echo "   4. Fazer um novo deploy após configurar variáveis"
    echo ""
    echo -e "==================================================${NC}"
else
    echo ""
    echo -e "${RED}❌ Erro ao fazer deploy.${NC}"
    echo "Consulte a documentação em DEPLOY_CLOUDFLARE.md"
    exit 1
fi
