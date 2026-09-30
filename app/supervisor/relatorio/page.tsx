'use client';

import { useEffect, useMemo, useState } from 'react';
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
  tipo_parada?: 'nao_programada' | 'programada' | 'sem_parada';
  falha_em?: string;
  retorno_em?: string;
}

export default function RelatorioPDF() {
  const router = useRouter();
  const [falhas, setFalhas] = useState<Falha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modoImpressao, setModoImpressao] = useState<'todos' | 'graficos'>('todos');
  const [periodo, setPeriodo] = useState('todos');
  const [equipamentoFiltro, setEquipamentoFiltro] = useState('todos');
  const [tipoFiltro, setTipoFiltro] = useState('todos');

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

  const equipamentosDisponiveis = useMemo(() => Array.from(new Set(falhas.map(f => f.equipamento?.trim()).filter(Boolean))).sort(), [falhas]);
  const falhasFiltradas = useMemo(() => falhas.filter(item => {
    if (equipamentoFiltro !== 'todos' && item.equipamento?.trim() !== equipamentoFiltro) return false;
    if (tipoFiltro !== 'todos' && (item.tipo_parada || 'nao_informado') !== tipoFiltro) return false;
    if (periodo !== 'todos') {
      const limite = new Date();
      limite.setDate(limite.getDate() - Number(periodo));
      if (new Date(item.criado_em) < limite) return false;
    }
    return true;
  }), [falhas, periodo, equipamentoFiltro, tipoFiltro]);

  const totalGeral = falhasFiltradas.length || 1;
  const naoProgramadas = falhasFiltradas.filter(item => item.tipo_parada === 'nao_programada');
  const falhasComDowntime = falhasFiltradas.filter(item => item.tipo_parada === 'nao_programada' && item.falha_em && item.retorno_em);
  const downtimeTotalMin = falhasComDowntime.reduce((total, item) => total + Math.max(0, Math.round((new Date(item.retorno_em!).getTime() - new Date(item.falha_em!).getTime()) / 60000)), 0);
  const mttrMin = falhasComDowntime.length ? Math.round(downtimeTotalMin / falhasComDowntime.length) : 0;
  const formatarDuracao = (minutos: number) => { const h = Math.floor(minutos / 60); const m = minutos % 60; return `${h}h ${String(m).padStart(2, '0')}min`; };

  let contSintoma = { vazamento: 0, quebra: 0, vibracao: 0, aquecimento: 0, falha: 0, alarme: 0, outros: 0 };
  let contAcao = { substituicao: 0, reparo: 0, ajuste: 0 };
  let contEquipamento: { [key: string]: { ocorrencias: number; naoProgramadas: number; downtime: number; comTempo: number } } = {};

  falhasFiltradas.forEach(item => {
    const sint = (item.sintoma || '').toLowerCase();
    if (sint.includes('vazamento') || sint.includes('fuga')) contSintoma.vazamento++;
    else if (sint.includes('quebra') || sint.includes('trinca') || sint.includes('ruptura')) contSintoma.quebra++;
    else if (sint.includes('vibra') || sint.includes('ruído') || sint.includes('barulh')) contSintoma.vibracao++;
    else if (sint.includes('aqueciment') || sint.includes('temperatura')) contSintoma.aquecimento++;
    else if (sint.includes('alarme') || sint.includes('aviso') || sint.includes('warning')) contSintoma.alarme++;
    else if (sint.includes('falha') || sint.includes('erro')) contSintoma.falha++;
    else contSintoma.outros++;

    const sol = (item.solucao || '').toLowerCase();
    if (sol.includes('substituição') || sol.includes('substituir') || sol.includes('troca')) contAcao.substituicao++;
    else if (sol.includes('reparo') || sol.includes('conserto') || sol.includes('recupera')) contAcao.reparo++;
    else contAcao.ajuste++;

    const eq = item.equipamento ? item.equipamento.trim() : 'Desconhecido';
    contEquipamento[eq] ??= { ocorrencias: 0, naoProgramadas: 0, downtime: 0, comTempo: 0 };
    contEquipamento[eq].ocorrencias++;
    if (item.tipo_parada === 'nao_programada') contEquipamento[eq].naoProgramadas++;
    if (item.tipo_parada === 'nao_programada' && item.falha_em && item.retorno_em) {
      const min = Math.max(0, Math.round((new Date(item.retorno_em).getTime() - new Date(item.falha_em).getTime()) / 60000));
      contEquipamento[eq].downtime += min;
      contEquipamento[eq].comTempo++;
    }
  });

  const rankingEquipamentos = Object.entries(contEquipamento).map(([nome, v]) => ({
    nome, ...v, mttr: v.comTempo ? Math.round(v.downtime / v.comTempo) : 0
  })).sort((a, b) => b.ocorrencias - a.ocorrencias);
  const topEquipamentos = rankingEquipamentos.slice(0, 5).map(item => [item.nome, item.ocorrencias] as [string, number]);

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
        <div className="print:hidden grid sm:grid-cols-3 gap-2 w-full mt-3">
          <select value={periodo} onChange={e => setPeriodo(e.target.value)} className="border border-gray-300 rounded-lg p-2 text-sm"><option value="todos">Todo o período</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 3 meses</option><option value="180">Últimos 6 meses</option><option value="365">Último ano</option></select>
          <select value={equipamentoFiltro} onChange={e => setEquipamentoFiltro(e.target.value)} className="border border-gray-300 rounded-lg p-2 text-sm"><option value="todos">Todos os equipamentos</option>{equipamentosDisponiveis.map(e => <option key={e} value={e}>{e}</option>)}</select>
          <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)} className="border border-gray-300 rounded-lg p-2 text-sm"><option value="todos">Todos os tipos de parada</option><option value="nao_programada">Não programada</option><option value="programada">Programada</option><option value="sem_parada">Sem parada</option><option value="nao_informado">Não informado</option></select>
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
        ) : falhasFiltradas.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Nenhuma ocorrência encontrada para os filtros selecionados.</p>
        ) : (
          <>
            {/* SECÇÃO COM OS GRÁFICOS EM FORMATO DE BARRA AMPLO */}
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-2">
                📊 Indicadores Gerais de Manutenção
              </h2>

              <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border-2 border-blue-200 p-4 rounded-lg bg-blue-50 break-inside-avoid"><div className="text-xs uppercase text-blue-700 font-semibold">Ocorrências</div><div className="text-2xl font-bold text-blue-900">{falhasFiltradas.length}</div></div>
                <div className="border-2 border-orange-200 p-4 rounded-lg bg-orange-50 break-inside-avoid"><div className="text-xs uppercase text-orange-700 font-semibold">Não programadas</div><div className="text-2xl font-bold text-orange-900">{naoProgramadas.length}</div></div>
                <div className="border-2 border-red-200 p-4 rounded-lg bg-red-50 break-inside-avoid"><div className="text-xs uppercase text-red-700 font-semibold">Downtime total</div><div className="text-2xl font-bold text-red-900">{formatarDuracao(downtimeTotalMin)}</div></div>
                <div className="border-2 border-emerald-200 p-4 rounded-lg bg-emerald-50 break-inside-avoid"><div className="text-xs uppercase text-emerald-700 font-semibold">MTTR</div><div className="text-2xl font-bold text-emerald-900">{falhasComDowntime.length ? formatarDuracao(mttrMin) : 'Sem dados'}</div></div>
              </div>
              <p className="text-[10px] text-gray-500">Downtime e MTTR consideram somente paradas não programadas com início e retorno preenchidos.</p>

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

                <div className="border border-gray-300 p-5 rounded-lg bg-white break-inside-avoid">
                  <h3 className="text-xs font-bold text-gray-800 uppercase mb-3">🏆 Ranking de Equipamentos</h3>
                  <table className="w-full text-xs border-collapse"><thead><tr><th className="text-left p-2 bg-gray-200">Equipamento</th><th className="p-2 bg-blue-100 text-blue-800">Ocorrências</th><th className="p-2 bg-orange-100 text-orange-800">Não programadas</th><th className="p-2 bg-red-100 text-red-800">Downtime</th><th className="p-2 bg-emerald-100 text-emerald-800">MTTR</th></tr></thead><tbody>{rankingEquipamentos.map(r => <tr key={r.nome} className="border-b border-gray-200"><td className="p-2 font-semibold">{r.nome}</td><td className="p-2 text-center text-blue-800">{r.ocorrencias}</td><td className="p-2 text-center text-orange-800">{r.naoProgramadas}</td><td className="p-2 text-center text-red-800">{formatarDuracao(r.downtime)}</td><td className="p-2 text-center text-emerald-800">{formatarDuracao(r.mttr)}</td></tr>)}</tbody></table>
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

                {falhasFiltradas.map((item, index) => (
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
                      {item.tipo_parada && <p><strong>Tipo de parada:</strong> {item.tipo_parada === 'nao_programada' ? 'Não programada' : item.tipo_parada === 'programada' ? 'Programada' : 'Sem parada'}</p>}
                      {item.falha_em && <p><strong>{item.tipo_parada === 'programada' ? 'Início da intervenção' : 'Falha'}:</strong> {new Date(item.falha_em).toLocaleString('pt-BR')}</p>}
                      {item.retorno_em && <p><strong>Retorno:</strong> {new Date(item.retorno_em).toLocaleString('pt-BR')}</p>}
                      {item.tipo_parada === 'nao_programada' && item.falha_em && item.retorno_em && <p><strong>Downtime:</strong> {formatarDuracao(Math.max(0, Math.round((new Date(item.retorno_em).getTime() - new Date(item.falha_em).getTime()) / 60000)))}</p>}
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
