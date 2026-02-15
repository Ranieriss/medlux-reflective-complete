// Script de teste rápido para verificar Auth Store
// Executar no console do navegador

console.log('🔍 Verificando Auth Store...');

// 1. Verificar localStorage
const authData = localStorage.getItem('medlux_auth');
console.log('1️⃣ localStorage:', authData ? JSON.parse(authData) : '❌ Vazio');

// 2. Verificar se há dados
if (authData) {
    const parsed = JSON.parse(authData);
    console.log('👤 Usuário:', parsed.nome);
    console.log('📧 Email:', parsed.email);
    console.log('🔐 Perfil:', parsed.perfil);
    console.log('✅ Ativo:', parsed.ativo);
}

// 3. Instruções para verificar Auth Store
console.log(`
📋 Próximos passos:

1. Abra Vue DevTools
2. Vá em "Pinia" ou "Stores"
3. Procure por "auth"
4. Verifique:
   - usuario.value (deve ter dados)
   - isAuthenticated (deve ser true)
   - isAdmin / isOperador (conforme perfil)

Se usuario.value estiver null:
1. Recarregue a página (F5)
2. Faça logout e login novamente
3. Verifique os logs no console
`);
