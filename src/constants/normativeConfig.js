export const EQUIPMENT_PREFIX = {
  RH: 'RH',
  RV: 'RV',
  RT: 'RT'
}

export const HORIZONTAL_SIGNAL_TYPES = [
  'Marca longitudinal',
  'Linha de bordo',
  'Eixo',
  'Faixa de pedestre',
  'Legenda',
  'Pictograma',
  'Símbolo',
  'Outro'
]

export const HORIZONTAL_MATERIAL_OPTIONS = [
  'Tinta acrílica solvente',
  'Tinta acrílica base água',
  'Plástico frio - Tipo I',
  'Plástico frio - Tipo II',
  'Plástico frio - Tipo III',
  'Plástico frio - Tipo IV',
  'Termoplástico - Extrudado',
  'Termoplástico - Hot-spray',
  'Termoplástico - Alto relevo',
  'Termoplástico - Pré-formado',
  'Outro'
]

export const VERTICAL_CLASSES = Array.from({ length: 13 }, (_, idx) => ({
  title: `Classe ${String.fromCharCode(76 + idx)}`,
  value: `Classe ${String.fromCharCode(76 + idx)}`
}))

export const VERTICAL_TYPES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].map((roman) => ({
  title: `Tipo ${roman}`,
  value: `Tipo ${roman}`
}))

export const GEOMETRY_BY_PREFIX = {
  RH: [
    { title: '15m', value: '15m' },
    { title: '30m', value: '30m' }
  ],
  RV_SINGLE: [{ title: '0,2° / -4°', value: '0,2°/-4°' }],
  RV_MULTI: [
    { title: '0,2° / -4°', value: '0,2°/-4°' },
    { title: '0,2° / +30°', value: '0,2°/+30°' },
    { title: '0,5° / -4°', value: '0,5°/-4°' },
    { title: '0,5° / +30°', value: '0,5°/+30°' }
  ],
  RT: [{ title: '0,2° / 0°', value: '0,2°/0°' }]
}

// Estrutura preparada para futura fonte dinâmica (JSON/DB)
export const NORMATIVE_REFERENCE = {
  RH: {
    default: 100,
    byMaterial: {
      'Tinta acrílica solvente': 120,
      'Tinta acrílica base água': 110,
      'Termoplástico - Extrudado': 150,
      'Termoplástico - Hot-spray': 150,
      'Termoplástico - Alto relevo': 180,
      'Termoplástico - Pré-formado': 160
    }
  },
  RV: {
    default: 80,
    byClass: {
      'Classe L': 70,
      'Classe M': 75,
      'Classe N': 80,
      'Classe O': 90,
      'Classe P': 100,
      'Classe Q': 110,
      'Classe R': 120,
      'Classe S': 130,
      'Classe T': 140,
      'Classe U': 150,
      'Classe V': 160,
      'Classe W': 170,
      'Classe X': 180
    }
  },
  RT: {
    default: 150
  }
}

export function detectEquipmentPrefix(codigo = '') {
  const prefix = (codigo || '').toUpperCase().slice(0, 2)
  if (Object.values(EQUIPMENT_PREFIX).includes(prefix)) return prefix
  return null
}
