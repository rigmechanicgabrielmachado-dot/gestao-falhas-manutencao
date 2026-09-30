'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  // Assim que a página abre, verifica se existe um e-mail guardado no navegador
  useEffect(() => {
    const emailSalvo = localStorage.getItem('ultimo_email');
    if (emailSalvo) {
      setEmail(emailSalvo);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErro('Erro ao entrar: ' + error.message);
      setCarregando(false);
    } else {
      // Guarda o e-mail no navegador para as próximas vezes
      localStorage.setItem('ultimo_email', email);
      router.push('/'); 
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-6">
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Manutenção Industrial</h1>
          <p className="text-sm text-gray-500 mt-1">Faça login para continuar</p>
        </div>

        {erro && <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{erro}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-black bg-white pr-16"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
              >
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition text-sm cursor-pointer"
          >
            {carregando ? 'A entrar...' : 'Entrar'}
          </button>
        </form>

        {/* Botão / Link para ir para a página de cadastro */}
        <div className="text-center pt-2 border-t border-gray-100 text-sm">
          <span className="text-gray-500">Não tem uma conta? </span>
          <Link href="/cadastro" className="text-blue-600 font-semibold hover:underline">
            Registe-se aqui
          </Link>
        </div>

      </div>
    </main>
  );
}
