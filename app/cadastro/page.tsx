'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';


export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');
    setMensagem('');

    // Função correta do Supabase para criar novos utilizadores de forma autónoma
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErro('Erro ao criar conta: ' + error.message);
      setCarregando(false);
    } else {
      setMensagem('Conta criada com sucesso! A redirecionar...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Criar Nova Conta</h1>
          <p className="text-sm text-gray-500 mt-1">Registe-se para aceder ao sistema</p>
        </div>

        {erro && <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{erro}</div>}
        {mensagem && <div className="bg-green-100 text-green-700 p-3 rounded text-sm">{mensagem}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-black bg-white"
              placeholder="seu.email@empresa.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Palavra-passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-black bg-white"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition text-sm cursor-pointer"
          >
            {carregando ? 'A criar conta...' : 'Registar'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100 text-sm">
          <span className="text-gray-500">Já tem uma conta? </span>
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Faça login aqui
          </Link>
        </div>
      </div>
    </main>
  );
}
