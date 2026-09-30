'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';


interface Falha {
  id: string | number;
  equipamento: string;
  sintoma: string;
  causa_raiz: string;
  solucao: string;
  part_number?: string;
  criado_em: string;
  aprovado: boolean;
  falha_em?: string;
  retorno_em?: string;
}

export default function RelatorioPDF() {
  const router = useRouter();
  const [falhas, setFalhas] = useState<Falha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modoImpressao, setModoImpressao] = useState<'todos' | 'graficos'>('todos');

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: isSupervisor, error: roleError } = await supabase.rpc('is_supervisor');
      if (roleError || !isSupervisor) {
        router.push('/');
        return;
      }

      const { data, error } = await supabase
        .from('falhas')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao carregar relatório:', error);
      } else {
        setFalhas(data || []);
      }
      setCarregando(false);
    }
    carregarDados();
  }, [router]);

  const imprimirRelatorio = (tipo: 'todos' | 'graficos') => {
    setModoImpressao(tipo);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const totalGeral = falhas.length || 1;
  const falhasComDowntime = falhas.filter(item => item.falha_em && item.retorno_em);
  const downtimeTotalMin = falhasComDowntime.reduce((total, item) => total + Math.max(0, Math.round((new Date(item.retorno_em!).getTime() - new Date(item.falha_em!).getTime()) / 60000)), 0);
  const mttrMin = falhasComDowntime.length ? Math.round(downtimeTotalMin / falhasComDowntime.length) : 0;
  const formatarDuracao = (minutos: number) => { const h = Math.floor(minutos / 60); const m = minutos % 60; return h > 0 ? `${h}h ${m}min` : `${m}min`; };

  let contSintoma = { vazamento: 0, quebra: 0, vibracao: 0, aquecimento: 0, falha: 0, alarme: 0, outros: 0 };
  let contAcao = { substituicao: 0, reparo: 0, ajuste: 0 };
  let contEquipamento: { [key: string]: number } = {};

  falhas.forEach(item => {
    const sint = (item.sintoma || "").toLowerCase();
    
    // CORREÇÃO APLICADA AQUI: Adicionada a verificação da palavra 'alarme'
    if (sint.includes('vazamento') || sint.includes('fuga')) {
      contSintoma.vazamento++;
    } else if (sint.includes('quebra') || sint.includes('trinca') || sint.includes('ruptura')) {
      contSintoma.quebra++;
    } else if (sint.includes('vibra') || sint.includes('ruído') || sint.includes('barulh')) {
      contSintoma.vibracao++;
    } else if (sint.includes('aqueciment') || sint.includes('temperatura')) {
      contSintoma.aquecimento++;
    } else if (sint.includes('alarme')) {
      contSintoma.alarme++;
    } else if (sint.includes('falha') || sint.includes('erro')) {
      contSintoma.falha++;
    } else {
      contSintoma.outros++;
    }

    const sol = (item.solucao || "").toLowerCase();
    if (sol.includes('substituição') || sol.includes('substituir') || sol.includes('troca')) contAcao.substituicao++;
    else if (sol.includes('reparo') || sol.includes('conserto') || sol.includes('recupera')) contAcao.reparo++;
    else contAcao.ajuste++;

    const eq = item.equipamento ? item.equipamento.trim() : 'Desconhecido';
    contEquipamento[eq] = (contEquipamento[eq] || 0) + 1;
  });

  const topEquipamentos = Object.entries(contEquipamento)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-white text-black p-8">
      {/* BOTÕES DE CONTROLO (NÃO SAEM NO PDF) */}
      <div className="print:hidden flex flex-wrap justify-between items-center mb-8 pb-4 border-b border-gray-300 max-w-4xl mx-auto gap-4">
        <Link
          href="/supervisor"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          ← Voltar ao Painel
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => imprimirRelatorio('todos')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition cursor-pointer text-sm"
          >
            📋 Imprimir Relatório Completo
          </button>

          <button
            onClick={() => imprimirRelatorio('graficos')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition cursor-pointer text-sm"
          >
            📊 Imprimir Relatório de Gráficos
          </button>
        </div>
      </div>

      {/* CONTEÚDO DO RELATÓRIO FORMATADO PARA IMPRESSÃO */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            {modoImpressao === 'graficos' ? 'Relatório Executivo - Estatísticas de Manutenção' : 'Relatório de Ocorrências e Soluções'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">Chão de Fábrica - Manutenção Industrial</p>
          <p className="text-xs text-gray-500 mt-1">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {carregando ? (
          <p className="text-center text-gray-500 py-8">A carregar dados do relatório...</p>
        ) : falhas.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhuma ocorrência registada na base de dados.</p>
        ) : (
          <>
            {/* SECÇÃO COM OS GRÁFICOS EM FORMATO DE BARRA AMPLO */}
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-2">
                📊 Indicadores Gerais de Manutenção
              </h2>

              <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="border border-gray-300 p-4 rounded-lg bg-gray-50 break-inside-avoid">
                  <div className="text-xs uppercase text-gray-500 font-semibold">Ocorrências com downtime</div>
                  <div className="text-2xl font-bold">{falhasComDowntime.length}</div>
                </div>
                <div className="border border-gray-300 p-4 rounded-lg bg-gray-50 break-inside-avoid">
                  <div className="text-xs uppercase text-gray-500 font-semibold">Downtime acumulado</div>
                  <div className="text-2xl font-bold">{formatarDuracao(downtimeTotalMin)}</div>
                </div>
                <div className="border border-gray-300 p-4 rounded-lg bg-gray-50 break-inside-avoid">
                  <div className="text-xs uppercase text-gray-500 font-semibold">MTTR médio</div>
                  <div className="text-2xl font-bold">{falhasComDowntime.length ? formatarDuracao(mttrMin) : 'Sem dados'}</div>
                </div>
              </div>

                {/* 1. TOP EQUIPAMENTOS */}
                <div className="border border-gray-300 p-5 rounded-lg space-y-3 bg-gray-50/50 break-inside-avoid">
                  <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    🔧 Equipamentos com Mais Intervenções
                  </h3>
                  <div className="space-y-3">
                    {topEquipamentos.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">Sem dados suficientes.</p>
                    ) : (
                      topEquipamentos.map(([nome, qtd], idx) => {
                        const percentual = Math.round((qtd / totalGeral) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-gray-900">{nome}</span>
                              <span className="text-blue-700 font-bold">{qtd} ocorrência(s) ({percentual}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.max(percentual, 5)}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. OCORRÊNCIAS POR SINTOMA */}
                <div className="border border-gray-300 p-5 rounded-lg space-y-3 bg-gray-50/50 break-inside-avoid">
                  <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">
                    ⚠️ Falhas com Maior Ocorrência (Sintomas)
                  </h3>
                  <div className="space-y-3 text-xs">
                    {[
                      { label: 'Vazamentos / Fugas', qtd: contSintoma.vazamento, cor: 'bg-red-600' },
                      { label: 'Quebras / Trincas', qtd: contSintoma.quebra, cor: 'bg-orange-600' },
                      { label: 'Vibração / Ruído', qtd: contSintoma.vibracao, cor: 'bg-yellow-600' },
                      { label: 'Aquecimento', qtd: contSintoma.aquecimento, cor: 'bg-amber-700' },
                      { label: 'Alarmes', qtd: contSintoma.alarme, cor: 'bg-purple-600' }, // Categoria de Alarme adicionada aqui
                      { label: 'Falha Geral / Erro', qtd: contSintoma.falha, cor: 'bg-indigo-600' },
                      { label: 'Outros', qtd: contSintoma.outros, cor: 'bg-gray-500' },
                    ].map((item, idx) => {
                      const percentual = Math.round((item.qtd / totalGeral) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between font-medium">
                            <span className="text-gray-900">{item.label}</span>
                            <span className="font-bold text-black">{item.qtd} ocorrência(s) ({percentual}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                            <div className={`${item.cor} h-full rounded-full transition-all`} style={{ width: `${Math.max(percentual, 3)}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. AÇÕES DE MANUTENÇÃO */}
                <div className="border border-gray-300 p-5 rounded-lg space-y-3 bg-gray-50/50 break-inside-avoid">
                  <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider">
                    🛠️ Tipos de Manutenção de Maior Frequência (Ações)
                  </h3>
                  <div className="space-y-3 text-xs">
                    {[
                      { label: 'Substituição de Peças', qtd: contAcao.substituicao, cor: 'bg-green-600' },
                      { label: 'Reparo / Recuperação', qtd: contAcao.reparo, cor: 'bg-emerald-700' },
                      { label: 'Ajuste / Calibragem', qtd: contAcao.ajuste, cor: 'bg-teal-700' },
                    ].map((item, idx) => {
                      const percentual = Math.round((item.qtd / totalGeral) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between font-medium">
                            <span className="text-gray-900">{item.label}</span>
                            <span className="font-bold text-green-800">{item.qtd} ocorrência(s) ({percentual}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                            <div className={`${item.cor} h-full rounded-full transition-all`} style={{ width: `${Math.max(percentual, 3)}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* LISTAGEM DETALHADA DAS OCORRÊNCIAS (APARECE APENAS NO RELATÓRIO COMPLETO) */}
            {modoImpressao === 'todos' && (
              <div className="space-y-6 pt-6">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-2">
                  Detalhe de Todas as Ocorrências Registadas
                </h2>

                {falhas.map((item, index) => (
                  <div key={item.id} className="border border-gray-400 p-4 rounded-lg space-y-2 break-inside-avoid bg-white">
                    <div className="flex justify-between items-center font-bold border-b border-gray-300 pb-1 text-sm">
                      <span>#{index + 1} - Equipamento: {item.equipamento}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${item.aprovado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {item.aprovado ? 'Aprovado' : 'Pendente'}
                        </span>
                        <span className="text-xs text-gray-600">{new Date(item.criado_em).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <p><strong>Sintoma:</strong> {item.sintoma}</p>
                      <p><strong>Causa Raiz:</strong> {item.causa_raiz || 'Não informada'}</p>
                      <p><strong>Solução Aplicada:</strong> {item.solucao}</p>
                      {item.falha_em && <p><strong>Falha:</strong> {new Date(item.falha_em).toLocaleString('pt-BR')}</p>}
                      {item.retorno_em && <p><strong>Retorno:</strong> {new Date(item.retorno_em).toLocaleString('pt-BR')}</p>}
                      {item.falha_em && item.retorno_em && <p><strong>Downtime:</strong> {formatarDuracao(Math.max(0, Math.round((new Date(item.retorno_em).getTime() - new Date(item.falha_em).getTime()) / 60000)))}</p>}
                      {item.part_number && (
                        <p><strong>Part Number / Material:</strong> <span className="font-mono">{item.part_number}</span></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
