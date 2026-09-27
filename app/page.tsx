export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-400 mb-2">
          Gestão de Falhas e Soluções
        </h1>
        <p className="text-gray-400 mb-6">
          Chão de Fábrica - Manutenção Industrial
        </p>

        {/* Barra de Pesquisa Rápida */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
          <input 
            type="text" 
            placeholder="Pesquisar falha, sintoma ou equipamento (ex: Compressor, Motor 690V)..." 
            className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Botão para cadastrar nova falha */}
        <div className="flex justify-end">
          <a 
            href="/nova-falha" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition"
          >
            + Registrar Nova Falha
          </a>
        </div>
      </div>
    </main>
  );
}
