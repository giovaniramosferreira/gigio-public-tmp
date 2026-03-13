import { ParsedTransaction } from '@/types'

type NubankFormat = 'credit_card' | 'account'

function detectFormat(headers: string[]): NubankFormat {
  const h = headers.map(s => s.trim().toLowerCase())
  // Conta: tem "identificador"
  if (h.includes('identificador')) return 'account'
  return 'credit_card'
}

function parseDate(raw: string): string {
  // Nubank usa YYYY-MM-DD ou DD/MM/YYYY
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) return raw

  const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`

  return raw
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export function parseNubankCSV(csvContent: string): ParsedTransaction[] {
  const lines = csvContent.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) throw new Error('CSV vazio ou inválido')

  const headers = parseCsvLine(lines[0])
  const format = detectFormat(headers)
  const transactions: ParsedTransaction[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    if (cols.length < 3) continue

    try {
      if (format === 'credit_card') {
        // Data, Descrição, Valor (PT) ou date, title/description, amount (EN)
        const dateIdx = headers.findIndex(h => h.toLowerCase().includes('data') || h.toLowerCase() === 'date')
        const descIdx = headers.findIndex(h => h.toLowerCase().includes('descrição') || h.toLowerCase().includes('descricao') || h.toLowerCase() === 'title' || h.toLowerCase() === 'description')
        const valIdx  = headers.findIndex(h => h.toLowerCase().includes('valor') || h.toLowerCase() === 'amount')

        const rawAmount = parseFloat(cols[valIdx].replace(',', '.'))
        if (isNaN(rawAmount)) continue

        transactions.push({
          date: parseDate(cols[dateIdx] || cols[0]),
          description: cols[descIdx] || cols[1] || 'Sem descrição',
          amount: Math.abs(rawAmount),
          type: rawAmount > 0 ? 'credit' : 'debit',
          raw_data: { format, raw: cols },
        })
      } else {
        // Data, Valor, Identificador, Descrição
        const dateIdx = headers.findIndex(h => h.toLowerCase().includes('data') || h.toLowerCase() === 'date')
        const valIdx  = headers.findIndex(h => h.toLowerCase().includes('valor') || h.toLowerCase() === 'amount')
        const descIdx = headers.findIndex(h => h.toLowerCase().includes('descrição') || h.toLowerCase().includes('descricao') || h.toLowerCase() === 'title' || h.toLowerCase() === 'description')

        const rawAmount = parseFloat(cols[valIdx].replace(',', '.'))
        if (isNaN(rawAmount)) continue

        transactions.push({
          date: parseDate(cols[dateIdx] || cols[0]),
          description: cols[descIdx] || cols[3] || cols[2] || 'Sem descrição',
          amount: Math.abs(rawAmount),
          type: rawAmount > 0 ? 'credit' : 'debit',
          raw_data: { format, raw: cols },
        })
      }
    } catch {
      // linha inválida — pular
    }
  }

  if (transactions.length === 0) {
    throw new Error('Nenhuma transação válida encontrada. Verifique se é um extrato Nubank.')
  }

  return transactions
}

// Categorização por regras de palavras-chave (plano Free)
const CATEGORY_RULES: { keywords: string[]; category: string }[] = [
  { keywords: ['ifood', 'rappi', 'uber eats', 'delivery', 'pizz', 'burguer', 'burger', 'lanche', 'restaurante', 'sushi', 'japonês', 'japonesa'], category: 'Alimentação' },
  { keywords: ['uber', '99app', 'cabify', 'táxi', 'taxi', 'ônibus', 'metrô', 'metro', 'passagem', 'combustivel', 'combustível', 'posto', 'shell', 'ipiranga', 'petrobras'], category: 'Transporte' },
  { keywords: ['spotify', 'netflix', 'amazon prime', 'disney', 'youtube premium', 'hbo', 'globoplay', 'deezer', 'apple tv', 'paramount'], category: 'Streaming' },
  { keywords: ['farmácia', 'drogasil', 'drogaria', 'pacheco', 'ultrafarma', 'panvel', 'droga', 'remédio', 'medicamento', 'hospital', 'clínica', 'clinica', 'médico', 'dentista', 'plano de saude', 'unimed', 'amil', 'bradesco saude'], category: 'Saúde' },
  { keywords: ['supermercado', 'mercado', 'carrefour', 'extra', 'pão de açúcar', 'pao de acucar', 'assai', 'atacadão', 'atacadao', 'hortifrutti', 'hortifruti', 'coop', 'bistek', 'zaffari'], category: 'Mercado' },
  { keywords: ['salário', 'salario', 'pagamento', 'transferência recebida', 'pix recebido', 'ted recebido', 'doc recebido', 'deposito', 'depósito', 'crédito em conta', 'credito em conta', 'vencimento'], category: 'Receita' },
  { keywords: ['aluguel', 'condomínio', 'condominio', 'iptu', 'água', 'agua', 'luz', 'energia', 'gás', 'gas', 'internet', 'telefone', 'celular', 'claro', 'vivo', 'tim', 'oi'], category: 'Moradia' },
  { keywords: ['academia', 'smart fit', 'crossfit', 'bluefit', 'bodytech', 'gym', 'treino'], category: 'Saúde' },
  { keywords: ['escola', 'faculdade', 'universidade', 'curso', 'udemy', 'coursera', 'alura', 'dio', 'rocketseat', 'material escolar', 'mensalidade'], category: 'Educação' },
  { keywords: ['cinema', 'teatro', 'show', 'evento', 'ingresso', 'ticketmaster', 'sympla', 'eventbrite', 'bar ', 'boate', 'balada', 'viajem', 'viagem', 'hotel', 'airbnb', 'booking'], category: 'Lazer' },
  { keywords: ['nubank', 'fatura', 'pagamento fatura', 'cartão', 'cartao'], category: 'Financeiro' },
  { keywords: ['investimento', 'cdb', 'tesouro', 'ações', 'acoes', 'fundo', 'renda fixa', 'poupança', 'poupanca', 'xp ', 'rico ', 'btg', 'nuconta rende'], category: 'Investimentos' },
]

export function categorizeByRules(description: string): string {
  const lower = description.toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return rule.category
    }
  }
  return 'Outros'
}
