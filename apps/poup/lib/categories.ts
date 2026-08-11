// ── Fonte única de verdade para categorias ───────────────────────────────────
// Todos os lugares que usam categorias devem importar daqui.

/** Lista canônica de todas as categorias válidas (ordenada alfabeticamente). */
export const CATEGORY_NAMES = [
  'Alimentação',
  'Compras online',
  'Educação',
  'Financeiro',
  'Investimentos',
  'Lazer',
  'Mercado',
  'Moradia',
  'Outros',
  'Pets',
  'Receita',
  'Saúde',
  'Streaming',
  'Transporte',
] as const

export type CategoryName = (typeof CATEGORY_NAMES)[number]

/** Set para validação rápida (O(1) lookup). */
export const VALID_CATEGORIES = new Set<string>(CATEGORY_NAMES)

/**
 * Categorias exibidas como zonas de drop na UI de reclassificação.
 * Exclui Receita e Investimentos — o usuário não arrasta débitos para essas.
 */
export const DROP_CATEGORIES = CATEGORY_NAMES.filter(
  c => c !== 'Receita' && c !== 'Investimentos'
) as string[]
