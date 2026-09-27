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

export default function PainelSupervisor() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [pendentes, setPendentes] = useState<Falha[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Verifica se o usuário está autenticado via Supabase ao carregar a página
  useEffect(() => {
    async function verificarSessao() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Se não estiver logado, redireciona para a nova tela de login
        router.push('/login');
      } else {
        setVerificando(false);
        carregarPendentes();
      }
    }
    verificarSessao();
  }, [router]);

  const carregarPendentes = async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from('falhas')
      .select('*')
      .eq('aprovado', false)
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar falhas pendentes:', error);
    } else {
      setPendentes(data || []);
    }
    setCarregando(false);
  };

  const aprovarFalha = async (id: string | number) => {
    // Pede a senha de supervisor de 6 dígitos antes de aprovar
    const senhaSupervisor = prompt("Digite a senha de supervisor (6 dígitos) para autorizar a aprovação:");

    if (senhaSupervisor !== "123456") { // Substitua '123456' pela senha desejada
      alert("Senha de supervisor incorreta. Ação cancelada.");
      return;
    }

    const { error } = await supabase
      .from('falhas')
      .update({ aprovado: true })
      .eq('id', id);

    if (error) {
      alert('Erro ao aprovar: ' + error.message);
    } else {
      alert('Ocorrência aprovada e publicada com sucesso!');
      carregarPendentes();
    }
  };

  const rejeitarFalha = async (id: string | number) => {
    // Pede a senha de supervisor de 6 dígitos antes de rejeitar/apagar
    const senhaSupervisor = prompt("Digite a senha de supervisor (6 dígitos) para autorizar a exclusão:");

    if (senhaSupervisor !== "123456") { // Substitua '123456' pela senha desejada
      alert("Senha de supervisor incorreta. Ação cancelada.");
      return;
    }

    if (!confirm('Tem certeza que deseja rejeitar e apagar esta ocorrência?')) return;

    const { error } = await supabase
      .from('falhas')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erro ao rejeitar: ' + error.message);
    } else {
      alert('Ocorrência rejeitada e removida.');
      carregarPendentes();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Enquanto valida a sessão, mostra um ecrã de carregamento
  if (verificando) {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center text-yellow-400">A verificar credenciais de acesso...</div>
      </main>
    );
  }

  // PAINEL DE MODERAÇÃO (APÓS ESTAR AUTENTICADO VIA SUPABASE)
  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">
              Painel do Supervisor - Moderação
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Ocorrências aguardando aprovação para publicação
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/supervisor/relatorio"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 cursor-pointer"
            >
              📄 Exportar Relatório PDF
            </Link>

            <Link
              href="/"
              className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold px-4 py-2 rounded-lg text-sm transition flex items-center"
            >
              Início
            </Link>

            <button
              onClick={handleLogout}
              className="bg-red-900/60 hover:bg-red-900 text-red-200 px-3 py-2 rounded-lg text-sm transition cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
            Carregando ocorrências pendentes...
          </div>
        ) : pendentes.length === 0 ? (
          <div className="bg-gray-800 p-12 rounded-lg text-center border border-gray-700 text-gray-400">
            ✅ Não há nenhuma ocorrência pendente de moderação no momento.
          </div>
        ) : (
          <div className="space-y-4">
            {pendentes.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 p-5 rounded-lg border border-yellow-600/50 shadow-lg space-y-4"
              >
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                  <span className="bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1 rounded text-sm font-bold">
                    🔧 {item.equipamento}
                  </span>
                  <span className="text-xs text-gray-400">
                    Enviado em: {new Date(item.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-900 p-3 rounded border border-gray-700">
                    <strong className="text-red-400 block text-xs uppercase mb-1">Sintoma:</strong>
                    <p className="text-gray-200">{item.sintoma}</p>
                  </div>

                  {item.causa_raiz && (
                    <div className="bg-gray-900 p-3 rounded border border-gray-700">
                      <strong className="text-yellow-400 block text-xs uppercase mb-1">Causa Raiz:</strong>
                      <p className="text-gray-200">{item.causa_raiz}</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-900 p-3 rounded border border-gray-700">
                  <strong className="text-green-400 block text-xs uppercase mb-1">Solução Aplicada:</strong>
                  <p className="text-gray-200 text-sm">{item.solucao}</p>
                </div>

                {item.part_number && (
                  <div className="bg-gray-900 p-3 rounded border border-gray-700">
                    <strong className="text-purple-400 block text-xs uppercase mb-1">Part Number:</strong>
                    <p className="text-gray-200 text-sm font-mono">{item.part_number}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => rejeitarFalha(item.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
                  >
                    Rejeitar / Apagar
                  </button>

                  <button
                    type="button"
                    onClick={() => aprovarFalha(item.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
                  >
                    Aprovar e Publicar
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
