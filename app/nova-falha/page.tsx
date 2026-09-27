'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tkbqnssxdfmdrqiastrj.supabase.co';
const supabaseAnonKey = 'sb_publishable_Z6Bwn2w0rOE_nuGZrjDTKA_Bev3tqCI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function NovaFalha() {
  const router = useRouter();

  const [equipamento, setEquipamento] = useState('');
  const [sintoma, setSintoma] = useState('');
  const [causaRaiz, setCausaRaiz] = useState('');
  const [solucao, setSolucao] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    let fotoUrlFinal = '';

    // 1. SE HOUVER FOTO, FAZ O UPLOAD PARA O SUPABASE STORAGE
    if (arquivoFoto) {
      const nomeArquivo = `${Date.now()}-${arquivoFoto.name.replace(/\s+/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-falhas')
        .upload(nomeArquivo, arquivoFoto);

      if (uploadError) {
        alert('Erro ao carregar a foto: ' + uploadError.message);
        setEnviando(false);
        return;
      }

      // 2. OBTER A URL PÚBLICA DA IMAGEM
      const { data: publicUrlData } = supabase.storage
        .from('fotos-falhas')
        .getPublicUrl(nomeArquivo);

      fotoUrlFinal = publicUrlData.publicUrl;
    }

    // 3. SALVAR A OCORRÊNCIA NO BANCO DE DADOS (APROVADO = FALSE)
    const { error } = await supabase.from('falhas').insert([
      {
        equipamento: equipamento.trim(),
        sintoma: sintoma.trim(),
        causa_raiz: causaRaiz.trim(),
        solucao: solucao.trim(),
        part_number: partNumber.trim() || null,
        foto_url: fotoUrlFinal || null,
        aprovado: false, // Vai para moderação do supervisor
      },
    ]);

    if (error) {
      alert('Erro ao registar ocorrência: ' + error.message);
      setEnviando(false);
    } else {
      alert('Ocorrência registada com sucesso! Aguardando aprovação do supervisor.');
      router.push('/');
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Registar Nova Ocorrência</h1>
            <p className="text-gray-400 text-sm mt-1">Preencha os dados da falha detetada em campo</p>
          </div>
          <Link
            href="/"
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg text-sm transition"
          >
            ← Voltar
          </Link>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
          
          {/* CAMPO DE EQUIPAMENTO ALTERADO PARA SELECT */}
          <div className="space-y-2">
            <label className="block text-xs uppercase text-gray-400 font-semibold mb-1">
              Equipamento *
            </label>
            <select
              required
              value={equipamento}
              onChange={(e) => setEquipamento(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="" disabled>Selecione o equipamento da lista...</option>
              <option value="ARN 270">ARN 270</option>
              <option value="Bomba de Lama">Bomba de Lama</option>
              <option value="BX Elevator">BX Elevator</option>
              <option value="Catline">Catline</option>
              <option value="Cesta de manutenção">Cesta de manutenção</option>
              <option value="Compressor de Alta Pressão">Compressor de Alta Pressão</option>
              <option value="Drawworks">Drawworks</option>
              <option value="Fingerboard">Fingerboard</option>
              <option value="Guindaste 100 ton">Guindaste 100 ton</option>
              <option value="Guindaste AHC">Guindaste AHC</option>
              <option value="HPU">HPU</option>
              <option value="Hydraracker">Hydraracker</option>
              <option value="Manrider">Manrider</option>
              <option value="Mesa Rotativa">Mesa Rotativa</option>
              <option value="MPT270">MPT270</option>
              <option value="Pipe Catwalk">Pipe Catwalk</option>
              <option value="PS30">PS30</option>
              <option value="Riser Catwalk">Riser Catwalk</option>
              <option value="Riser Gantry Crane">Riser Gantry Crane</option>
              <option value="Top Drive">Top Drive</option>
              <option value="X-Mas Tree Skid">X-Mas Tree Skid</option>
              <option value="X-Mas Tree Troley">X-Mas Tree Troley</option>
            </select>
          </div>


          <div>
            <label className="block text-xs uppercase text-red-400 font-semibold mb-1">
              Sintoma (O que aconteceu?) *
            </label>
            <textarea
              required
              rows={3}
              value={sintoma}
              onChange={(e) => setSintoma(e.target.value)}
              placeholder="Descreva o comportamento anómalo observado..."
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-yellow-400 font-semibold mb-1">
              Causa Raiz (Opcional)
            </label>
            <textarea
              rows={2}
              value={causaRaiz}
              onChange={(e) => setCausaRaiz(e.target.value)}
              placeholder="Qual foi a causa identificada após a análise..."
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-green-400 font-semibold mb-1">
              Solução Aplicada *
            </label>
            <textarea
              required
              rows={3}
              value={solucao}
              onChange={(e) => setSolucao(e.target.value)}
              placeholder="Como foi resolvido o problema..."
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-purple-400 font-semibold mb-1">
              Part Number / Material Utilizado (Opcional)
            </label>
            <input
              type="text"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="Ex: PN-9842-AB / Retentor 3 pol"
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* CAMPO DE FOTO COM SUPORTE A CÂMARA DO TELEMÓVEL */}
          <div>
            <label className="block text-xs uppercase text-blue-300 font-semibold mb-1">
              Foto da Falha ou Peça (Opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setArquivoFoto(e.target.files[0]);
                }
              }}
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">
              💡 No telemóvel, pode tirar a foto diretamente com a câmara ou escolher da galeria.
            </p>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-semibold py-3 rounded-lg transition cursor-pointer mt-4"
          >
            {enviando ? 'A enviar ocorrência e foto...' : 'Submeter Ocorrência'}
          </button>

        </form>
      </div>
    </main>
  );
}
