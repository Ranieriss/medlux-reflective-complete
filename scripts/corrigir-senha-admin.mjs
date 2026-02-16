// Script para corrigir senha do usuário admin no Supabase
// Execute: node scripts/corrigir-senha-admin.mjs

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://earrnuuvdzawclxsyoxk.supabase.co'
const supabaseKey = '<SUPABASE_ANON_KEY>'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔧 Corrigindo senhas dos usuários...\n')

async function corrigirSenhas() {
  try {
    // Atualizar senha do admin
    const { data: admin, error: errorAdmin } = await supabase
      .from('usuarios')
      .update({ senha_hash: '2308' })
      .eq('email', 'admin@medlux.com')
      .select()

    if (errorAdmin) {
      console.error('❌ Erro ao atualizar admin:', errorAdmin)
    } else {
      console.log('✅ Senha do admin atualizada: admin@medlux.com / 2308')
    }

    // Atualizar senha do técnico João Silva (se existir)
    const { data: joao, error: errorJoao } = await supabase
      .from('usuarios')
      .update({ senha_hash: '1234' })
      .eq('email', 'joao.silva@medlux.com')
      .select()

    if (errorJoao && errorJoao.code !== 'PGRST116') {
      console.error('❌ Erro ao atualizar João Silva:', errorJoao)
    } else if (joao && joao.length > 0) {
      console.log('✅ Senha do João Silva atualizada: joao.silva@medlux.com / 1234')
    } else {
      console.log('ℹ️ Usuário João Silva não existe ainda')
    }

    // Verificar usuários existentes
    const { data: usuarios, error: errorListar } = await supabase
      .from('usuarios')
      .select('id, email, nome, perfil, ativo')

    if (errorListar) {
      console.error('❌ Erro ao listar usuários:', errorListar)
    } else {
      console.log('\n📋 Usuários no banco:')
      usuarios.forEach(u => {
        console.log(`  - ${u.nome} (${u.email}) - Perfil: ${u.perfil} - Ativo: ${u.ativo}`)
      })
    }

    console.log('\n✅ Correção concluída!')
    console.log('\n🔐 Credenciais atualizadas:')
    console.log('   Admin: admin@medlux.com / 2308')
    console.log('   Técnico: joao.silva@medlux.com / 1234')

  } catch (error) {
    console.error('❌ Erro fatal:', error)
  }
}

corrigirSenhas().then(() => process.exit(0))
