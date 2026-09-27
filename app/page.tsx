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
  foto_url?: string;
  aprovado: boolean;
}

export default function Home() {
  const router = useRouter();

  const [falhas, setFalhas] = useState<Falha[]>([]);
  const [busca, setBusca] = useState('');
  const [equipamentoAberto, setEquipamentoAberto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarFalhas() {
      setCarregando(true);

      const { data, error } = await supabase
        .from('falhas')
        .select('*')
        .eq('aprovado', true)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar falhas:', error);
      } else {
        setFalhas(data || []);
      }

      setCarregando(false);
    }

    carregarFalhas();
  }, []);

  const termo = busca.toLowerCase().trim();

  const falhasFiltradas = falhas.filter((item) => {
    if (!termo) return true;

    return (
      item.equipamento?.toLowerCase().includes(termo) ||
      item.sintoma?.toLowerCase().includes(termo) ||
      item.causa_raiz?.toLowerCase().includes(termo) ||
      item.solucao?.toLowerCase().includes(termo) ||
      item.part_number?.toLowerCase().includes(termo)
    );
  });

  const falhasPorEquipamento = falhasFiltradas.reduce(
    (acc, falha) => {
      const equipamento = falha.equipamento?.trim() || 'Outros';

      if (!acc[equipamento]) {
        acc[equipamento] = [];
      }

      acc[equipamento].push(falha);

      return acc;
    },
    {} as Record<string, Falha[]>
  );

  const equipamentos = Object.entries(falhasPorEquipamento).sort(
    ([a], [b]) => a.localeCompare(b, 'pt-BR')
  );

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* CABEÇALHO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-400">
              Gestão de Falhas e Soluções
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Equipamentos de Drilling - Manutenção Industrial (Aprovadas)
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/nova-falha')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-xl">+</span>
            Registrar Ocorrência
          </button>
        </div>

        {/* PESQUISA */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
          <input
            type="text"
            placeholder="Pesquisar equipamento, falha, sintoma, causa, solução ou part number..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 placeholder-gray-400"
          />
        </div>

        {/* CARREGANDO */}
        {carregando && (
          <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
            Carregando ocorrências...
          </div>
        )}

        {/* SEM RESULTADOS */}
        {!carregando && equipamentos.length === 0 && (
          <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400 border border-gray-700">
            {busca
              ? 'Nenhuma ocorrência aprovada encontrada para essa pesquisa.'
              : 'Nenhuma ocorrência aprovada registrada no momento.'}

            <div className="mt-4">
              <button
                type="button"
                onClick={() => router.push('/nova-falha')}
                className="inline-flex bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg text-white font-semibold cursor-pointer"
              >
                Registrar nova ocorrência
              </button>
            </div>
          </div>
        )}

        {/* EQUIPAMENTOS */}
        {!carregando && equipamentos.length > 0 && (
          <div className="space-y-4">
            {equipamentos.map(([equipamento, lista]) => {
              const estaAberto = equipamentoAberto === equipamento;

              return (
                <div
                  key={equipamento}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setEquipamentoAberto(estaAberto ? null : equipamento)
                    }
                    className="w-full flex justify-between items-center p-4 hover:bg-gray-700 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {lista[0]?.foto_url ? (
                        <img 
                          src={lista[0].foto_url} 
                          alt={equipamento} 
                          className="w-12 h-12 rounded-lg object-cover border border-gray-600"
                        />
                      ) : (
                        <span className="text-2xl">⚙️</span>
                      )}

                      <div>
                        <div className="font-semibold text-lg text-blue-300">
                          {equipamento}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {lista.length}{' '}
                          {lista.length === 1
                            ? 'ocorrência aprovada'
                            : 'ocorrências aprovadas'}
                        </div>
                      </div>
                    </div>

                    <span className="text-gray-400 text-2xl font-bold">
                      {estaAberto ? '−' : '+'}
                    </span>
                  </button>

                  {estaAberto && (
                    <div className="p-4 bg-gray-900 border-t border-gray-700 space-y-4">
                      {lista.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-800 p-4 rounded-lg border border-gray-700"
                        >
                          <div className="grid gap-4">
                            <div>
                              <strong className="text-red-400 block text-xs uppercase mb-1">
                                Sintoma
                              </strong>
                              <p className="text-gray-200 text-sm">
                                {item.sintoma || 'Não informado'}
                              </p>
                            </div>

                            <div>
                              <strong className="text-yellow-400 block text-xs uppercase mb-1">
                                Causa Raiz
                              </strong>
                              <p className="text-gray-200 text-sm">
                                {item.causa_raiz || 'Não informado'}
                              </p>
                            </div>

                            <div>
                              <strong className="text-green-400 block text-xs uppercase mb-1">
                                Solução Aplicada
                              </strong>
                              <p className="text-gray-200 text-sm">
                                {item.solucao || 'Não informado'}
                              </p>
                            </div>

                            {item.part_number && (
                              <div className="bg-gray-900 p-3 rounded border border-gray-700/50">
                                <strong className="text-purple-400 block text-xs uppercase mb-1">
                                  Part Number / Material Utilizado:
                                </strong>
                                <p className="text-gray-200 text-sm font-mono">
                                  {item.part_number}
                                </p>
                              </div>
                            )}

                            <div className="text-right text-xs text-gray-500 pt-2 border-t border-gray-700">
                              Registrado em:{' '}
                              {new Date(item.criado_em).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* RODAPÉ DISCRETO COM ACESSO AO SUPERVISOR */}
        <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
          <p>Equipamentos de Drilling - Manutenção Industrial</p>
          <div className="mt-2">
            <Link 
              href="/supervisor" 
              className="hover:text-gray-300 transition underline decoration-gray-700 cursor-pointer"
            >
              Área do Supervisor
            </Link>
          </div>
        </footer>

      </div>
    </main>
  );
}
