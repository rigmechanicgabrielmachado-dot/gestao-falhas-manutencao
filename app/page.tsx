'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { APP_VERSION } from '@/lib/version';

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

  const [verificando, setVerificando] = useState(true);
  const [falhas, setFalhas] = useState<Falha[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroEquipamento, setFiltroEquipamento] = useState(''); 
  const [equipamentoAberto, setEquipamentoAberto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [listaEquipamentos, setListaEquipamentos] = useState<string[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    async function verificarSessao() {
      // Verifica se há falhas guardadas localmente para exibir imediatamente se estiver sem rede
      const falhasSalvas = localStorage.getItem('cache_falhas_aprovadas');
      const equipamentosSalvos = localStorage.getItem('cache_equipamentos');

      if (falhasSalvas) {
        try {
          setFalhas(JSON.parse(falhasSalvas));
          setCarregando(false);
        } catch (e) {
          console.error('Erro ao ler cache local', e);
        }
      }

      if (equipamentosSalvos) {
        try {
          setListaEquipamentos(JSON.parse(equipamentosSalvos));
        } catch (e) {
          console.error('Erro ao ler cache de equipamentos', e);
        }
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Se estiver offline mas tiver sessão guardada ou falhas em cache, permite navegar offline
      if (!session && sessionError) {
        if (!falhasSalvas) {
          router.push('/login');
          return;
        } else {
          setOfflineMode(true);
        }
      }

      setVerificando(false);
      
      // Tenta atualizar com os dados mais recentes da nuvem
      carregarFalhas();
      carregarEquipamentosDoBanco();
    }

    verificarSessao();
  }, [router]);

  async function carregarFalhas() {
    const { data, error } = await supabase
      .from('falhas')
      .select('*')
      .eq('aprovado', true)
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar falhas:', error);
      setOfflineMode(true);
    } else if (data) {
      setFalhas(data);
      // Guarda em cache local para acesso offline
      localStorage.setItem('cache_falhas_aprovadas', JSON.stringify(data));
      setOfflineMode(false);
    }
    setCarregando(false);
  }

  async function carregarEquipamentosDoBanco() {
    const { data, error } = await supabase
      .from('equipamentos')
      .select('nome')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar equipamentos:', error);
    } else if (data) {
      const nomes = data.map((eq: any) => eq.nome);
      setListaEquipamentos(nomes);
      localStorage.setItem('cache_equipamentos', JSON.stringify(nomes));
    }
  }

  const termo = busca.toLowerCase().trim();

  const falhasFiltradas = falhas.filter((item) => {
    if (filtroEquipamento && item.equipamento !== filtroEquipamento) {
      return false;
    }
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

  if (verificando) {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center text-blue-400">A verificar autenticação...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* AVISO DE MODO OFFLINE */}
        {offlineMode && (
          <div className="bg-yellow-600/20 border border-yellow-500/50 text-yellow-300 px-4 py-2 rounded-lg text-xs flex justify-between items-center">
            <span>⚠️ Sem ligação à internet. A consultar dados guardados localmente (Modo Offline).</span>
          </div>
        )}

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

        {/* BARRA DE PESQUISA E FILTROS */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            
            {/* PESQUISA POR PALAVRA-CHAVE */}
            <div className="flex-1 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Pesquisar sintoma, causa, solução ou part number..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white pl-10 pr-10 py-3 rounded-lg text-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* SELETOR DE EQUIPAMENTO DINÂMICO */}
            <div className="w-full md:w-72">
              <select
                value={filtroEquipamento}
                onChange={(e) => setFiltroEquipamento(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-lg text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Todos os Equipamentos</option>
                {listaEquipamentos.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="flex justify-between items-center text-xs text-gray-400 px-1 pt-1">
            <span>💡 Dica: Consulte aqui antes de registrar para verificar se o problema já foi solucionado.</span>
            <span>{falhasFiltradas.length} ocorrência(s) encontrada(s)</span>
          </div>
        </div>

        {/* CARREGANDO */}
        {carregando && falhas.length === 0 && (
          <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
            Carregando ocorrências...
          </div>
        )}

        {/* SEM RESULTADOS */}
        {!carregando && equipamentos.length === 0 && (
          <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400 border border-gray-700">
            {busca || filtroEquipamento
              ? 'Nenhuma ocorrência aprovada encontrada com estes filtros de pesquisa.'
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
        {equipamentos.length > 0 && (
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

        {/* RODAPÉ DISCRETO COM A VERSÃO E ACESSO AO SUPERVISOR */}
        <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-xs text-gray-500 space-y-2">
          <p>Equipamentos de Drilling - Manutenção Industrial</p>
          <div>
            Versão: <span className="font-mono font-semibold text-gray-400">{APP_VERSION}</span>
          </div>
          <div className="pt-1">
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
