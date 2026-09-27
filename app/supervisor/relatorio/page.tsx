'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tkbqnssxdfmdrqiastrj.supabase.co';
const supabaseAnonKey = 'sb_publishable_Z6Bwn2w0rOE_nuGZrjDTKA_Bev3tqCI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Falha {
  id: string | number;
  equipamento: string;
  sintoma: string;
  causa_raiz: string;
  solucao: string;
  part_number?: string;
  criado_em: string;
  aprovado: boolean;
}

export default function RelatorioPDF() {
  const router = useRouter();
  const [falhas, setFalhas] = useState<Falha[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarAprovadas() {
      setCarregando(true);
      const { data, error } = await supabase
        .from('falhas')
        .select('*')
        .eq('aprovado', true)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao carregar relatório:', error);
      } else {
        setFalhas(data || []);
      }
      setCarregando(false);
    }
    carregarAprovadas();
  }, []);

  const imprimirPDF = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-white text-black p-8">
      {/* BOTÕES DE CONTROLO (NÃO SAEM NO PDF) */}
      <div className="print:hidden flex justify-between items-center mb-8 pb-4 border-b border-gray-300 max-w-4xl mx-auto">
        <Link
          href="/supervisor"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          ← Voltar ao Painel
        </Link>
        <button
          onClick={imprimirPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow transition cursor-pointer"
        >
          🖨️ Descarregar / Imprimir PDF
        </button>
      </div>

      {/* CONTEÚDO DO RELATÓRIO FORMATADO PARA IMPRESSÃO */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Relatório de Ocorrências e Soluções</h1>
          <p className="text-sm text-gray-600 mt-1">Chão de Fábrica - Manutenção Industrial (Equipamentos Aprovados)</p>
          <p className="text-xs text-gray-500 mt-1">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {carregando ? (
          <p className="text-center text-gray-500 py-8">A carregar dados do relatório...</p>
        ​) : falhas.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhuma ocorrência aprovada registada.</p>
        ) : (
          <div className="space-y-6">
            {falhas.map((item, index) => (
              <div key={item.id} className="border border-gray-400 p-4 rounded-lg space-y-2 break-inside-avoid">
                <div className="flex justify-between items-center font-bold border-b border-gray-300 pb-1 text-sm">
                  <span>#{index + 1} - Equipamento: {item.equipamento}</span>
                  <span className="text-xs text-gray-600">Registo: {new Date(item.criado_em).toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="text-xs space-y-1">
                  <p><strong>Sintoma:</strong> {item.sintoma}</p>
                  <p><strong>Causa Raiz:</strong> {item.causa_raiz || 'Não informada'}</p>
                  <p><strong>Solução Aplicada:</strong> {item.solucao}</p>
                  {item.part_number && (
                    <p><strong>Part Number / Material:</strong> <span className="font-mono">{item.part_number}</span></p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
