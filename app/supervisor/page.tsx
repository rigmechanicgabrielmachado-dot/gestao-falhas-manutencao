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

criado_por?: string;

foto_url?: string;

aprovado: boolean;

}


interface Equipamento {

id: string;

nome: string;

foto_url?: string;

}


export default function PainelSupervisor() {

const router = useRouter();


const [verificando, setVerificando] = useState(true);

const [autenticadoSupervisor, setAutenticadoSupervisor] = useState(false);

const [pinInput, setPinInput] = useState('');

const [erroPin, setErroPin] = useState('');

const [pendentes, setPendentes] = useState<Falha[]>([]);

const [falhasGerais, setFalhasGerais] = useState<Falha[]>([]); // Novo estado para todos os dados dos gráficos

const [carregando, setCarregando] = useState(true);


// Estados para a Gestão de Equipamentos

const [listaEquipamentosSupervisor, setListaEquipamentosSupervisor] = useState<Equipamento[]>([]);

const [novoEquipamentoNome, setNovoEquipamentoNome] = useState('');

const [tipoOrigemFoto, setTipoOrigemFoto] = useState<'arquivo' | 'link'>('arquivo');

const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);

const [novoEquipamentoFotoUrl, setNovoEquipamentoFotoUrl] = useState('');

const [carregandoEquipamentos, setCarregandoEquipamentos] = useState(false);


// Estados de Edição

const [editandoId, setEditandoId] = useState<string | number | null>(null);

const [editEquipamento, setEditEquipamento] = useState('');

const [editSintoma, setEditSintoma] = useState('');

const [editCausaRaiz, setEditCausaRaiz] = useState('');

const [editSolucao, setEditSolucao] = useState('');

const [editPartNumber, setEditPartNumber] = useState('');


const [feedback, setFeedback] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);


const mostrarFeedback = (texto: string, tipo: 'sucesso' | 'erro') => {

setFeedback({ texto, tipo });

setTimeout(() => {

setFeedback(null);

}, 3500);

};


useEffect(() => {

async function verificarSessaoESupervisor() {

const { data: { session } } = await supabase.auth.getSession();

if (!session) {

router.push('/login');

return;

}

const { data: isSupervisor, error } = await supabase.rpc('is_supervisor');

if (error || !isSupervisor) {

router.push('/');

return;

}

setAutenticadoSupervisor(true);

setVerificando(false);

carregarDadosPainel();

}

verificarSessaoESupervisor();

}, [router]);


const carregarDadosPainel = async () => {

setCarregando(true);

// 1. Carregar pendentes para moderação

const { data: dataPendentes, error: errorPendentes } = await supabase

.from('falhas')

.select('*')

.eq('aprovado', false)

.order('criado_em', { ascending: false });


if (errorPendentes) console.error('Erro ao buscar pendentes:', errorPendentes);

else setPendentes(dataPendentes || []);


// 2. Carregar todas as falhas para os gráficos gerais (incluindo aprovadas)

const { data: dataGeral, error: errorGeral } = await supabase

.from('falhas')

.select('*');


if (errorGeral) console.error('Erro ao buscar dados gerais:', errorGeral);

else setFalhasGerais(dataGeral || []);


// 3. Carregar equipamentos oficiais

carregarEquipamentosSupervisor();


setCarregando(false);

};


const carregarEquipamentosSupervisor = async () => {

const { data, error } = await supabase

.from('equipamentos')

.select('*')

.order('nome', { ascending: true });


if (error) {

console.error('Erro ao buscar equipamentos:', error);

} else {

setListaEquipamentosSupervisor(data || []);

}

};


const adicionarEquipamento = async (e: React.FormEvent) => {

e.preventDefault();

if (!novoEquipamentoNome.trim()) return;


setCarregandoEquipamentos(true);

let fotoUrlFinal = '';


try {

if (tipoOrigemFoto === 'arquivo' && arquivoFoto) {

const nomeFicheiro = `${Date.now()}-${arquivoFoto.name}`;

const { error: uploadError } = await supabase.storage

.from('equipamentos')

.upload(nomeFicheiro, arquivoFoto);


if (uploadError) throw new Error('Erro ao enviar imagem: ' + uploadError.message);


const { data: publicUrlData } = supabase.storage

.from('equipamentos')

.getPublicUrl(nomeFicheiro);


fotoUrlFinal = publicUrlData.publicUrl;

} else if (tipoOrigemFoto === 'link' && novoEquipamentoFotoUrl.trim()) {

fotoUrlFinal = novoEquipamentoFotoUrl.trim();

}


const { error } = await supabase

.from('equipamentos')

.insert([{ 

nome: novoEquipamentoNome.trim(),

foto_url: fotoUrlFinal || null 

}]);


if (error) throw new Error('Erro ao guardar equipamento: ' + error.message);


mostrarFeedback('Equipamento adicionado com sucesso!', 'sucesso');

setNovoEquipamentoNome('');

setArquivoFoto(null);

setNovoEquipamentoFotoUrl('');

carregarEquipamentosSupervisor();


} catch (error: any) {

mostrarFeedback(error.message, 'erro');

} finally {

setCarregandoEquipamentos(false);

}

};


const iniciarEdicao = (item: Falha) => {

setEditandoId(item.id);

setEditEquipamento(item.equipamento);

setEditSintoma(item.sintoma);

setEditCausaRaiz(item.causa_raiz || '');

setEditSolucao(item.solucao);

setEditPartNumber(item.part_number || '');

};


const cancelarEdicao = () => {

setEditandoId(null);

};


const salvarEAprovar = async (id: string | number) => {

const { error } = await supabase

.from('falhas')

.update({

equipamento: editEquipamento.trim(),

sintoma: editSintoma.trim(),

causa_raiz: editCausaRaiz.trim(),

solucao: editSolucao.trim(),

part_number: editPartNumber.trim() || null,

aprovado: true,

})

.eq('id', id);


if (error) {

mostrarFeedback('Erro ao atualizar e aprovar: ' + error.message, 'erro');

} else {

mostrarFeedback('Ocorrência corrigida, aprovada e publicada com sucesso!', 'sucesso');

setEditandoId(null);

carregarDadosPainel();

}

};


const aprovarFalha = async (id: string | number) => {

const { error } = await supabase

.from('falhas')

.update({ aprovado: true })

.eq('id', id);


if (error) {

mostrarFeedback('Erro ao aprovar: ' + error.message, 'erro');

} else {

mostrarFeedback('Ocorrência aprovada e publicada com sucesso!', 'sucesso');

carregarDadosPainel();

}

};


const rejeitarFalha = async (id: string | number) => {

const { error } = await supabase

.from('falhas')

.delete()

.eq('id', id);


if (error) {

mostrarFeedback('Erro ao rejeitar: ' + error.message, 'erro');

} else {

mostrarFeedback('Ocorrência rejeitada e removida.', 'sucesso');

carregarDadosPainel();

}

};


const handleLogout = async () => {

await supabase.auth.signOut();

router.push('/login');

};


if (verificando) {

return (

<main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">

<div className="text-center text-yellow-400">A verificar credenciais de acesso...</div>

</main>

);

}


return (

<main className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">

<div className="max-w-4xl mx-auto space-y-6">


{/* CABEÇALHO */}

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


{feedback && (

<div className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition-all duration-300 ${

feedback.tipo === 'sucesso'

? 'bg-green-500/10 border-green-500/30 text-green-400'

: 'bg-red-500/10 border-red-500/30 text-red-400'

}`}>

<span className="text-sm font-medium flex items-center gap-2">

{feedback.tipo === 'sucesso' ? '✅' : '⚠️'} {feedback.texto}

</span>

</div>

)}


{/* ========================================== */}

{/* SECÇÃO DE GRÁFICOS E INDICADORES (TODOS OS DADOS) */}

{/* ========================================== */}

<div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6 shadow-md">

<div>

<h2 className="text-lg font-bold text-yellow-400">📊 Indicadores e Estatísticas Gerais</h2>

<p className="text-xs text-gray-400">Análise automática com base em todas as ocorrências registadas (aprovadas e pendentes).</p>

</div>


{(() => {

const totalGeral = falhasGerais.length || 1;


let contSintoma = { vazamento: 0, quebra: 0, vibracao: 0, aquecimento: 0, alarme: 0, falha: 0, outros: 0 };

let contAcao = { substituicao: 0, reparo: 0, ajuste: 0 };

let contEquipamento: { [key: string]: number } = {};


falhasGerais.forEach(item => {

// Sintomas

const sint = (item.sintoma || "").toLowerCase();

if (sint.includes('vazamento') || sint.includes('fuga')) contSintoma.vazamento++;

else if (sint.includes('quebra') || sint.includes('trinca') || sint.includes('ruptura')) contSintoma.quebra++;

else if (sint.includes('vibra') || sint.includes('ruído') || sint.includes('barulh')) contSintoma.vibracao++;

else if (sint.includes('aqueciment') || sint.includes('temperatura')) contSintoma.aquecimento++;

else if (sint.includes('alarme') || sint.includes('aviso') || sint.includes('warning')) contSintoma.alarme++;

else if (sint.includes('falha') || sint.includes('erro')) contSintoma.falha++;

else contSintoma.outros++;


// Ações (Soluções)

const sol = (item.solucao || "").toLowerCase();

if (sol.includes('substituição') || sol.includes('substituir') || sol.includes('troca')) contAcao.substituicao++;

else if (sol.includes('reparo') || sol.includes('conserto') || sol.includes('recupera')) contAcao.reparo++;

else contAcao.ajuste++;


// Equipamentos (com trim para evitar duplicações por espaços extras)

const eq = item.equipamento ? item.equipamento.trim() : 'Desconhecido';

contEquipamento[eq] = (contEquipamento[eq] || 0) + 1;

});


const topEquipamentos = Object.entries(contEquipamento)

.sort((a, b) => b[1] - a[1])

.slice(0, 5);


return (

<div className="grid md:grid-cols-3 gap-6 pt-2 border-t border-gray-700/60">

{/* GRÁFICO 1: TOP EQUIPAMENTOS */}

<div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3">

<h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">

🔧 Equipamentos com mais intervenções

</h3>

<div className="space-y-2">

{topEquipamentos.length === 0 ? (

<p className="text-xs text-gray-500 italic">Sem dados suficientes.</p>

) : (

topEquipamentos.map(([nome, qtd], idx) => {

const percentual = Math.round((qtd / totalGeral) * 100);

return (

<div key={idx} className="space-y-1">

<div className="flex justify-between text-xs">

<span className="text-gray-300 font-medium truncate max-w-[140px]">{nome}</span>

<span className="text-blue-400 font-bold">{qtd} ocorrência(s)</span>

</div>

<div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">

<div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.max(percentual, 10)}%` }}></div>

</div>

</div>

);

})

)}

</div>

</div>


{/* GRÁFICO 2: OCORRÊNCIAS POR SINTOMA */}

<div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3">

<h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">

⚠️ Ocorrências por Sintoma

</h3>

<div className="space-y-2.5 text-xs">

{[

{ label: 'Vazamentos / Fugas', qtd: contSintoma.vazamento, cor: 'bg-red-500' },

{ label: 'Quebras / Trincas', qtd: contSintoma.quebra, cor: 'bg-orange-500' },

{ label: 'Vibração / Ruído', qtd: contSintoma.vibracao, cor: 'bg-yellow-500' },

{ label: 'Aquecimento', qtd: contSintoma.aquecimento, cor: 'bg-amber-600' },

{ label: 'Alarmes', qtd: contSintoma.alarme, cor: 'bg-pink-500' },

{ label: 'Falha Geral / Erro', qtd: contSintoma.falha, cor: 'bg-purple-500' },

{ label: 'Outros', qtd: contSintoma.outros, cor: 'bg-gray-600' },

].map((item, idx) => (

<div key={idx} className="space-y-1">

<div className="flex justify-between">

<span className="text-gray-300">{item.label}</span>

<span className="font-bold text-white">{item.qtd}</span>

</div>

<div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">

<div className={`${item.cor} h-full rounded-full`} style={{ width: `${Math.min(Math.round((item.qtd / totalGeral) * 100), 100)}%` }}></div>

</div>

</div>

))}

</div>

</div>


{/* GRÁFICO 3: AÇÕES DE MANUTENÇÃO */}

<div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3">

<h3 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1.5">

🛠️ Ações de Manutenção

</h3>

<div className="space-y-3 text-xs pt-1">

{[

{ label: 'Substituição de Peças', qtd: contAcao.substituicao, cor: 'bg-green-500', desc: 'Troca por componente novo' },

{ label: 'Reparo / Recuperação', qtd: contAcao.reparo, cor: 'bg-emerald-600', desc: 'Conserto local / solda' },

{ label: 'Ajuste / Calibragem', qtd: contAcao.ajuste, cor: 'bg-teal-600', desc: 'Regulação / aperto / limpeza' },

].map((item, idx) => (

<div key={idx} className="space-y-1 bg-gray-800/50 p-2 rounded border border-gray-700/50">

<div className="flex justify-between font-semibold">

<span className="text-gray-200">{item.label}</span>

<span className="text-green-400">{item.qtd}</span>

</div>

<p className="text-[10px] text-gray-400">{item.desc}</p>

<div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">

<div className={`${item.cor} h-full rounded-full`} style={{ width: `${Math.min(Math.round((item.qtd / totalGeral) * 100), 100)}%` }}></div>

</div>

</div>

))}

</div>

</div>


</div>

);

})()}

</div>


{/* SECÇÃO DE GESTÃO DE EQUIPAMENTOS */}

<div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4 shadow-md">

<div>

<h2 className="text-lg font-bold text-blue-400">Adicionar Novo Equipamento Oficial</h2>

<p className="text-xs text-gray-400">Cadastre um equipamento escolhendo enviar um ficheiro/tirar foto ou colar um link web.</p>

</div>


<form onSubmit={adicionarEquipamento} className="space-y-4">

<input

type="text"

placeholder="Nome do novo equipamento (ex: Hydratong)..."

value={novoEquipamentoNome}

onChange={(e) => setNovoEquipamentoNome(e.target.value)}

className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-lg text-sm focus:outline-none focus:border-blue-500"

required

/>


<div className="space-y-2">

<label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">

Origem da Foto de Capa

</label>

<div className="flex gap-2">

<button

type="button"

onClick={() => setTipoOrigemFoto('arquivo')}

className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition ${

tipoOrigemFoto === 'arquivo'

? 'bg-blue-600 border-blue-500 text-white'

: 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-700'

}`}

>

📁 Ficheiro / Câmara

</button>

<button

type="button"

onClick={() => setTipoOrigemFoto('link')}

className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition ${

tipoOrigemFoto === 'link'

? 'bg-blue-600 border-blue-500 text-white'

: 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-700'

}`}

>

🔗 Colar Link (URL)

</button>

</div>

</div>


{tipoOrigemFoto === 'arquivo' ? (

<div>

<input

type="file"

accept="image/png, image/jpeg, image/webp"

onChange={(e) => {

if (e.target.files && e.target.files[0]) {

setArquivoFoto(e.target.files[0]);

}

}}

className="w-full bg-gray-900 border border-gray-700 text-gray-300 p-2 rounded-lg text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"

/>

</div>

) : (

<div>

<input

type="url"

placeholder="https://exemplo.com/imagem.jpg"

value={novoEquipamentoFotoUrl}

onChange={(e) => setNovoEquipamentoFotoUrl(e.target.value)}

className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"

/>

</div>

)}


<button

type="submit"

disabled={carregandoEquipamentos}

className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg text-sm transition cursor-pointer disabled:bg-blue-900"

>

{carregandoEquipamentos ? 'A processar e a guardar...' : '+ Adicionar Equipamento'}

</button>

</form>


<div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-2 pt-2 border-t border-gray-700/60">

{listaEquipamentosSupervisor.map((eq) => (

<div key={eq.id} className="bg-gray-900 p-3 rounded-lg border border-gray-700 flex items-center gap-3">

{eq.foto_url ? (

<img src={eq.foto_url} alt={eq.nome} className="w-10 h-10 rounded object-cover border border-gray-600 flex-shrink-0" />

) : (

<span className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded border border-gray-700 text-base flex-shrink-0">⚙️</span>

)}

<div className="overflow-hidden">

<div className="text-xs text-white font-medium truncate">{eq.nome}</div>

<div className="text-[10px] text-gray-400 truncate">{eq.foto_url ? 'Com foto' : 'Sem foto'}</div>

</div>

</div>

))}

</div>

</div>


{/* LISTA DE OCORRÊNCIAS PENDENTES */}

<div className="space-y-4">

<h2 className="text-lg font-bold text-yellow-400">Ocorrências Pendentes de Aprovação</h2>


{carregando ? (

<div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">

Carregando ocorrências pendentes...

</div>

) : pendentes.length === 0 ? (

<div className="bg-gray-800 p-8 rounded-lg text-center border border-gray-700 text-gray-400">

✅ Não há nenhuma ocorrência pendente de moderação no momento.

</div>

) : (

<div className="space-y-4">

{pendentes.map((item) => {

const estaEditando = editandoId === item.id;


return (

<div

key={item.id}

className="bg-gray-800 p-5 rounded-lg border border-yellow-600/50 shadow-lg space-y-4"

>

<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-700 pb-3">

{estaEditando ? (

<input

type="text"

value={editEquipamento}

onChange={(e) => setEditEquipamento(e.target.value)}

className="bg-gray-700 text-blue-300 font-bold px-3 py-1 rounded border border-blue-600 text-sm focus:outline-none"

/>

) : (

<span className="bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1 rounded text-sm font-bold">

🔧 {item.equipamento}

</span>

)}

<div className="text-xs text-gray-400 text-right space-y-0.5">

<p>Enviado por: <strong className="text-yellow-400">{item.criado_por || 'Anónimo'}</strong></p>

<p>Em: {new Date(item.criado_em).toLocaleDateString('pt-BR')}</p>

</div>

</div>


{estaEditando ? (

<div className="space-y-3 text-sm">

<div>

<label className="block text-xs uppercase text-red-400 font-semibold mb-1">Sintoma:</label>

<textarea

rows={2}

value={editSintoma}

onChange={(e) => setEditSintoma(e.target.value)}

className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:outline-none focus:border-yellow-500"

/>

</div>


<div>

<label className="block text-xs uppercase text-yellow-400 font-semibold mb-1">Causa Raiz:</label>

<textarea

rows={2}

value={editCausaRaiz}

onChange={(e) => setEditCausaRaiz(e.target.value)}

className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:outline-none focus:border-yellow-500"

/>

</div>


<div>

<label className="block text-xs uppercase text-green-400 font-semibold mb-1">Solução Aplicada:</label>

<textarea

rows={2}

value={editSolucao}

onChange={(e) => setEditSolucao(e.target.value)}

className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:outline-none focus:border-yellow-500"

/>

</div>


<div>

<label className="block text-xs uppercase text-purple-400 font-semibold mb-1">Part Number:</label>

<input

type="text"

value={editPartNumber}

onChange={(e) => setEditPartNumber(e.target.value)}

className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white font-mono focus:outline-none focus:border-yellow-500"

/>

</div>


<div className="flex justify-end gap-2 pt-2 border-t border-gray-700">

<button

type="button"

onClick={cancelarEdicao}

className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"

>

Cancelar

</button>

<button

type="button"

onClick={() => salvarEAprovar(item.id)}

className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"

>

Salvar e Aprovar

</button>

</div>

</div>

) : (

<>

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


<div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-gray-700">

<button

type="button"

onClick={() => rejeitarFalha(item.id)}

className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"

>

Rejeitar / Apagar

</button>


<button

type="button"

onClick={() => iniciarEdicao(item)}

className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"

>

✏️ Editar Termos

</button>


<button

type="button"

onClick={() => aprovarFalha(item.id)}

className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"

>

Aprovar e Publicar

</button>

</div>

</>

)}

</div>

);

})}

</div>

)}

</div>


</div>

</main>

);

}
