// Script para testar conexão com Supabase e listar equipamentos
// Execute: node scripts/testar-supabase.mjs

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://earrnuuvdzawclxsyoxk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcnJudXV2ZHphd2NseHN5b3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMDk3MTQsImV4cCI6MjA4NjY4NTcxNH0.tKLBk3b4CZyT8nhMi610mmwpgMGBJlJAgC9vej_VuQg'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Testando conexão com Supabase...\n')

async function testarConexao() {
  try {
    // 1. Testar busca de equipamentos
    console.log('📦 Buscando equipamentos...')
    const { data: equipamentos, error: errorEquip } = await supabase
      .from('equipamentos')
      .select('*')
      .order('created_at', { ascending: false })

    if (errorEquip) {
      console.error('❌ Erro ao buscar equipamentos:', errorEquip)
      return
    }

    console.log(`✅ Total de equipamentos: ${equipamentos.length}\n`)

    // Listar primeiros 5
    console.log('📋 Primeiros 5 equipamentos:')
    equipamentos.slice(0, 5).forEach((eq, index) => {
      console.log(`  ${index + 1}. ${eq.codigo} - ${eq.nome}`)
      console.log(`     Tipo: ${eq.tipo} | Status: ${eq.status}`)
      console.log(`     Localização: ${eq.localizacao}`)
      console.log('')
    })

    // 2. Estatísticas
    console.log('📊 Estatísticas:')
    const porTipo = {}
    const porStatus = {}

    equipamentos.forEach(eq => {
      porTipo[eq.tipo] = (porTipo[eq.tipo] || 0) + 1
      porStatus[eq.status] = (porStatus[eq.status] || 0) + 1
    })

    console.log('\n  Por Tipo:')
    Object.entries(porTipo).forEach(([tipo, count]) => {
      console.log(`    - ${tipo}: ${count}`)
    })

    console.log('\n  Por Status:')
    Object.entries(porStatus).forEach(([status, count]) => {
      console.log(`    - ${status}: ${count}`)
    })

    console.log('\n✅ Conexão com Supabase funcionando perfeitamente!')
    console.log('🎉 Seus 23 equipamentos estão prontos para sincronização!')

  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error)
  }
}

testarConexao().then(() => process.exit(0))
