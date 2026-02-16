import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://peyupuoxgjzivqvadqgs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBleXVwdW94Z2p6aXZxdmFkcWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2NTE0NTQsImV4cCI6MjA1NTIyNzQ1NH0.y_lWz2MiJXk0YjZ_FFVrjJA61Aq1C1bTXJJQIe7HBj8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarQueryEquipamentos() {
  console.log('🔍 Testando query de equipamentos...')
  
  // Teste 1: Contar todos os equipamentos
  const { count: total, error: errorCount } = await supabase
    .from('equipamentos')
    .select('*', { count: 'exact', head: true })
  
  console.log('📊 Total de equipamentos na tabela:', total, errorCount ? `(Erro: ${errorCount.message})` : '')
  
  // Teste 2: Buscar com status = 'ativo'
  const { data: comStatus, error: errorStatus } = await supabase
    .from('equipamentos')
    .select('*')
    .eq('status', 'ativo')
  
  console.log('✅ Equipamentos com status="ativo":', comStatus?.length || 0, errorStatus ? `(Erro: ${errorStatus.message})` : '')
  
  if (comStatus && comStatus.length > 0) {
    console.log('📋 Primeiros 5 equipamentos:')
    comStatus.slice(0, 5).forEach(eq => {
      console.log(`  - ${eq.codigo}: ${eq.nome} (status: ${eq.status})`)
    })
  }
  
  // Teste 3: Buscar SEM filtro de status
  const { data: semFiltro, error: errorSemFiltro } = await supabase
    .from('equipamentos')
    .select('codigo, nome, status')
    .limit(5)
  
  console.log('\n📋 Primeiros 5 equipamentos SEM filtro de status:')
  if (semFiltro && semFiltro.length > 0) {
    semFiltro.forEach(eq => {
      console.log(`  - ${eq.codigo}: ${eq.nome} (status: ${eq.status})`)
    })
  } else {
    console.log('  ❌ Nenhum equipamento encontrado')
  }
  
  // Teste 4: Ver estrutura da tabela
  const { data: estrutura, error: errorEstrutura } = await supabase
    .from('equipamentos')
    .select('*')
    .limit(1)
  
  if (estrutura && estrutura.length > 0) {
    console.log('\n🔧 Colunas disponíveis na tabela equipamentos:')
    console.log(Object.keys(estrutura[0]).join(', '))
  }
}

testarQueryEquipamentos().then(() => {
  console.log('\n✅ Teste concluído')
  process.exit(0)
}).catch(error => {
  console.error('❌ Erro:', error)
  process.exit(1)
})
