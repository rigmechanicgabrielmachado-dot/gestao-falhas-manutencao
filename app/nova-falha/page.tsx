'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NovaFalha() {
  const router = useRouter()
  
  const [equipamento, setEquipamento] = useState('')
  const [sintoma, setSintoma] = useState('')
  const [causaRaiz, setCausaRaiz] = useState('')
  const [solucao, setSolucao] = useState('')
  const [partNumber, setPartNumber] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [salvando, setSalvando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)

    try {
      const { error } = await supabase.from('falhas').insert([
        {
          equipamento: equipamento.trim(),
          sintoma: sintoma.trim(),
          causa_raiz: causaRaiz.trim(),
          solucao: solucao.trim(),
          part_number: partNumber.trim() || null,
          foto_url: fotoUrl.trim() || null,
          aprovado: false, // <--- Registo enviado como pendente de revisão
        },
      ])

      if (error) throw error

      alert('Ocorrência enviada para revisão do supervisor com sucesso!')
      router.push('/')
      router.refresh()
    } catch (err: any) {
      console.error('Erro ao salvar falha:', err)
      alert('Erro ao salvar: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Registrar Nova Ocorrência</h1>
            <p className="text-gray-400 text-sm mt-1">Sujeito a aprovação prévia do supervisor</p>
          </div>
          <Link 
            href="/" 
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold px-4 py-2 rounded-lg text-sm transition"
          >
            Voltar
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Nome do Equipamento *
            </label>
            <input 
              type="text" 
              required
              value={equipamento}
              onChange={(e) => setEquipamento(e.target.value)}
              placeholder="Ex: ARN 270, Bomba de Lama..." 
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Sintoma / Alarme *
            </label>
            <textarea 
              required
              rows={3}
              value={sintoma}
              onChange={(e) => setSintoma(e.target.value)}
              placeholder="Descreva o sintoma..." 
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Causa Raiz (Opcional)
            </label>
            <textarea 
              rows={2}
              value={causaRaiz}
              onChange={(e) => setCausaRaiz(e.target.value)}
              placeholder="Qual foi a causa..." 
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Solução Aplicada *
            </label>
            <textarea 
              required
              rows={3}
              value={solucao}
              onChange={(e) => setSolucao(e.target.value)}
              placeholder="Descreva a solução..." 
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Part Number / Material Utilizado (Opcional)
            </label>
            <input 
              type="text" 
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="Ex: PN-12345" 
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              URL da Foto (Opcional)
            </label>
            <input 
              type="url" 
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="https://exemplo.com/foto.jpg" 
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button 
            type="submit" 
            disabled={salvando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition shadow mt-4 disabled:opacity-50"
          >
            {salvando ? 'A enviar...' : 'Enviar para Revisão'}
          </button>
        </form>

      </div>
    </main>
  )
}
