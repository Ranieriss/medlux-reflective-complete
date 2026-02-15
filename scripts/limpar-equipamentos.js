import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://earrnuuvdzawclxsyoxk.supabase.co',
  'sb_publishable_rzwQgvBWTXDKRunAIWQDkA_9_lOtHSl'
)

async function limpar() {
  const { error } = await supabase
    .from('equipamentos')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  
  if (error) {
    console.error('❌ Erro:', error)
  } else {
    console.log('✅ Todos os equipamentos foram removidos')
  }
}

limpar()
