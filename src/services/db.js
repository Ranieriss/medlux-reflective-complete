import Dexie from 'dexie'
import { format } from 'date-fns'

// Inicializar banco de dados
export const db = new Dexie('medlux_reflective')

// Definir schema
db.version(1).stores({
  equipamentos: '++id, codigo, tipo, status, ultima_calibracao, proxima_calibracao, localizacao',
  usuarios: '++id, email, perfil, ativo',
  vinculos: '++id, equipamento_id, usuario_id, status, data_vinculo',
  historico_calibracoes: '++id, equipamento_id, data_calibracao, validade',
  auditoria: '++id, usuario_id, acao, tabela, registro_id, timestamp',
  logs_erro: '++id, tipo, timestamp, usuario_id'
})

// Função para hash simples de senha (em produção use bcrypt)
const hashPassword = (password) => {
  return btoa(password) // Base64 simples - APENAS PARA DEMO
}

// Função para popular banco com dados demo
export const popularDadosDemo = async () => {
  try {
    // Verificar se já existem dados
    const countEquipamentos = await db.equipamentos.count()
    if (countEquipamentos > 0) {
      console.log('✅ Banco já possui dados')
      return
    }

    console.log('🔄 Populando banco de dados...')

    // Usuários demo
    await db.usuarios.bulkAdd([
      {
        nome: 'Administrador',
        email: 'admin@medlux.com',
        senha: hashPassword('2308'),
        perfil: 'admin',
        ativo: true,
        data_cadastro: new Date().toISOString()
      },
      {
        nome: 'João Silva',
        email: 'joao.silva@medlux.com',
        senha: hashPassword('1234'),
        perfil: 'tecnico',
        ativo: true,
        data_cadastro: new Date().toISOString()
      },
      {
        nome: 'Maria Santos',
        email: 'maria.santos@medlux.com',
        senha: hashPassword('1234'),
        perfil: 'tecnico',
        ativo: true,
        data_cadastro: new Date().toISOString()
      }
    ])

    // Equipamentos demo
    const hoje = new Date()
    const mesPassado = new Date()
    mesPassado.setMonth(mesPassado.getMonth() - 1)
    
    const emTresMeses = new Date()
    emTresMeses.setMonth(emTresMeses.getMonth() + 3)
    
    const emSeisMeses = new Date()
    emSeisMeses.setMonth(emSeisMeses.getMonth() + 6)

    await db.equipamentos.bulkAdd([
      {
        codigo: 'H-2024-001',
        tipo: 'Horizontal',
        fabricante: 'Zehntner',
        modelo: 'ZRM 6014',
        numero_serie: 'ZRM-2024-001',
        data_aquisicao: '2024-01-15',
        ultima_calibracao: mesPassado.toISOString().split('T')[0],
        proxima_calibracao: emSeisMeses.toISOString().split('T')[0],
        status: 'ativo',
        localizacao: 'Laboratório Principal',
        observacoes: 'Equipamento para medição de retrorefletância horizontal',
        foto: null
      },
      {
        codigo: 'V-2023-045',
        tipo: 'Vertical',
        fabricante: 'Delta',
        modelo: 'LTL-X',
        numero_serie: 'DELTA-V-2023-045',
        data_aquisicao: '2023-06-20',
        ultima_calibracao: '2024-10-01',
        proxima_calibracao: '2025-10-01',
        status: 'ativo',
        localizacao: 'Sala de Calibração',
        observacoes: 'Para placas e painéis verticais',
        foto: null
      },
      {
        codigo: 'T-2024-003',
        tipo: 'Tachas',
        fabricante: 'RoadVista',
        modelo: 'RV-300',
        numero_serie: 'RV-T-003-2024',
        data_aquisicao: '2024-02-10',
        ultima_calibracao: '2023-12-15',
        proxima_calibracao: hoje.toISOString().split('T')[0], // Vencida hoje
        status: 'manutencao',
        localizacao: 'Em calibração externa',
        observacoes: 'ATENÇÃO: Calibração vencida - equipamento em manutenção',
        foto: null
      }
    ])

    console.log('✅ Dados demo inseridos com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao popular dados demo:', error)
  }
}

// Função para registrar auditoria
export const registrarAuditoria = async (usuarioId, acao, tabela, registroId, detalhes = {}) => {
  try {
    await db.auditoria.add({
      usuario_id: usuarioId,
      acao,
      tabela,
      registro_id: registroId,
      timestamp: new Date().toISOString(),
      detalhes: JSON.stringify(detalhes)
    })
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error)
  }
}

// Função para registrar erro
export const registrarErro = async (tipo, mensagem, stack, usuarioId = null) => {
  try {
    await db.logs_erro.add({
      tipo,
      mensagem,
      stack,
      timestamp: new Date().toISOString(),
      usuario_id: usuarioId
    })
  } catch (error) {
    console.error('Erro ao registrar log de erro:', error)
  }
}

// Validar credenciais
export const validarLogin = async (email, senha) => {
  try {
    const usuario = await db.usuarios.where('email').equals(email).first()
    
    if (!usuario) {
      return { sucesso: false, mensagem: 'Usuário não encontrado' }
    }

    if (!usuario.ativo) {
      return { sucesso: false, mensagem: 'Usuário inativo' }
    }

    if (usuario.senha !== hashPassword(senha)) {
      return { sucesso: false, mensagem: 'Senha incorreta' }
    }

    // Remover senha antes de retornar
    const { senha: _, ...usuarioSemSenha } = usuario

    return {
      sucesso: true,
      usuario: usuarioSemSenha
    }
  } catch (error) {
    console.error('Erro ao validar login:', error)
    return { sucesso: false, mensagem: 'Erro ao validar credenciais' }
  }
}

export default db
