'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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

  // Lógica para calcular os equipamentos que mais têm falhas
  const contagemEquipamentos = falhas.reduce((acc, falha) => {
    const eq = falha.equipamento || 'Outros';
    acc[eq] = (acc[eq] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Transforma em array para o Recharts e pega os top 5 equipamentos com mais ocorrências
  const dadosGrafico = Object.entries(contagemEquipamentos)
    .map(([name, falhas]) => ({ name, falhas }))
    .sort((a, b) => b.falhas - a.falhas)
    .slice(0, 5);

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
        ) : falhas.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhuma ocorrência aprovada registada.</p>
        ) : (
          <>
            {/* GRÁFICO DOS EQUIPAMENTOS MAIS CRÍTICOS (Oculto na impressão em PDF se preferir, ou visível como panorama) */}
            <div className="bg-gray-50 border border-gray-300 p-6 rounded-lg space-y-3 print:border-gray-400">
              <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">
                📊 Top Equipamentos com Mais Falhas (Críticos)
              </h2>
              <div className="w-full h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#374151" fontSize={12} />
                    <YAxis stroke="#374151" fontSize={12} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none' }} 
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Bar dataKey="falhas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* LISTAGEM DETALHADA DAS OCORRÊNCIAS */}
            <div className="space-y-6 pt-2">
              <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-2">
                Detalhe das Ocorrências Aprovadas
              </h2>

              {falhas.map((item, index) => (
                <div key={item.id} className="border border-gray-400 p-4 rounded-lg space-y-2 break-inside-avoid bg-white">
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
          </>
        )}
      </div>
    </main>
  );
}
