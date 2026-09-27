'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [falhas, setFalhas] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [equipamentoAberto, setEquipamentoAberto] = useState<string | null>(null)

  const carregarFalhas = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('falhas')
        .select('*')
        .order('equipamento', { ascending: true })
        .order('criado_em', { ascending: false })

      if (error) throw error
      setFalhas(data || [])
    } catch (err) {
      console.error('Erro ao buscar falhas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarFalhas()
  }, [])

  // Agrupar falhas por nome do equipamento
  const falhasFiltradas = falhas.filter((item) => {
    const termo = busca.toLowerCase()
    return (
      item.equipamento?.toLowerCase().includes(termo) ||
      item.sintoma?.toLowerCase().includes(termo) ||
      item.solucao?.toLowerCase().includes(termo)
    )
  })

  // Agrupamento por equipamento
  const equipamentosAgrupados = falhasFiltradas.reduce((acc: any, item: any) => {
    const eq = item.equipamento || 'Outros'
    if (!acc[eq]) {
      acc[eq] = []
    }
    acc[eq].push(item)
    return acc
  }, {})

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* TOPO: Ação Rápida */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Gestão de Falhas e Soluções</h1>
            <p className="text-gray-400 text-sm mt-1">Chão de Fábrica - Manutenção Industrial</p>
          </div>
          <Link 
            href="/nova-falha" 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg text-center transition shadow"
          >
            + Registrar Nova Falha
          </Link>
        </div>

        {/* BARRA DE PESQUISA */}
        <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Pesquisa Ágil por Equipamento
          </label>
          <input 
            type="text" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite o nome do equipamento (Ex: ARN 270, Motor)..." 
            className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* LISTAGEM AGRUPADA POR EQUIPAMENTO */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-300">Equipamentos Cadastrados</h2>

          {loading ? (
            <p className="text-gray-400 text-center py-8">A carregar equipamentos...</p>
          ) : Object.keys(equipamentosAgrupados).length === 0 ? (
            <p className="text-gray-500 text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
              Nenhum equipamento encontrado.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.keys(equipamentosAgrupados).map((equipamento) => {
                const isOpen = equipamentoAberto === equipamento || busca.length > 0
                const qtd = equipamentosAgrupados[equipamento].length

                return (
                  <div key={equipamento} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow">
                    {/* Cabeçalho do Equipamento (Botão para expandir/recolher) */}
                    <button
                      onClick={() => setEquipamentoAberto(isOpen && !busca ? null : equipamento)}
                      className="w-full flex justify-between items-center p-4 bg-gray-800 hover:bg-gray-750 text-left transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1 rounded text-sm font-bold">
                          🔧 {equipamento}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">
                          {qtd} {qtd === 1 ? 'ocorrência registada' : 'ocorrências registadas'}
                        </span>
                      </div>
                      <span className="text-gray-400 font-bold text-sm">
                        {isOpen ? '▲' : '▼'}
                      </span>
                    </button>

                    {/* Lista de Falhas daquele Equipamento */}
                    {isOpen && (
                      <div className="p-4 bg-gray-900/50 border-t border-gray-700 space-y-4">
                        {equipamentosAgrupados[equipamento].map((item: any) => (
                          <div key={item.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
                            <div className="flex justify-between items-center text-xs text-gray-400 border-b border-gray-700 pb-2">
                              <span>Data: {new Date(item.criado_em).toLocaleDateString('pt-BR')}</span>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                              <div className="bg-gray-900 p-3 rounded border border-gray-700/50">
                                <strong className="text-gray-400 block text-xs uppercase mb-1">Sintoma / Alarme:</strong>
                                <p className="text-gray-100">{item.sintoma}</p>
                              </div>
                              {item.causa_raiz && (
                                <div className="bg-gray-900 p-3 rounded border border-gray-700/50">
                                  <strong className="text-gray-400 block text-xs uppercase mb-1">Causa Raiz:</strong>
                                  <p className="text-gray-200">{item.causa_raiz}</p>
                                </div>
                              )}
                            </div>

                            <div className="bg-gray-900 p-3 rounded border border-gray-700">
                              <strong className="text-green-400 block text-xs uppercase mb-1">Solução Aplicada:</strong>
                              <p className="text-gray-200 text-sm">{item.solucao}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}