import React, { useState, useEffect, useCallback } from 'react';

const DaoDashboard = ({ daoContract, walletAddress }) => {
  const [proposals, setProposals] = useState([]);
  const [description, setDescription] = useState('');

  const getProposals = useCallback(async () => {
    if (!daoContract) return;
    try {
      const proposalCount = await daoContract.proposalCount();
      const loadedProposals = [];
      for (let i = 0; i < proposalCount; i++) {
        const p = await daoContract.proposals(i);
        loadedProposals.push({ id: i, ...p });
      }
      setProposals(loadedProposals);
    } catch (error) {
      console.error('Error al cargar propuestas:', error);
    }
  }, [daoContract]);

  useEffect(() => {
    getProposals();
  }, [getProposals]);

  const handleCreateProposal = async () => {
    if (!daoContract || !description) return;
    try {
      const tx = await daoContract.createProposal(description);
      await tx.wait();
      alert('Propuesta creada con éxito');
      setDescription('');
      getProposals();
    } catch (error) {
      console.error('Error al crear la propuesta:', error);
    }
  };

  const handleVote = async (proposalId, vote) => {
    if (!daoContract) return;
    try {
      const tx = await daoContract.vote(proposalId, vote);
      await tx.wait();
      alert('Voto emitido con éxito');
      getProposals();
    } catch (error) {
      console.error('Error al emitir el voto:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Panel de Control del DAO</h2>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold mb-2">Crear Nueva Propuesta</h3>
        <textarea
          className="w-full p-2 border rounded mb-2"
          rows="3"
          placeholder="Describe tu propuesta..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
        <button 
          onClick={handleCreateProposal} 
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Crear Propuesta
        </button>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Propuestas Activas</h3>
        {proposals.length > 0 ? (
          <div className="space-y-4">
            {proposals.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-lg shadow-md">
                <p className="text-gray-800">{p.description}</p>
                <p className="text-sm text-gray-500">Votos a favor: {p.votesFor.toString()}</p>
                <p className="text-sm text-gray-500">Votos en contra: {p.votesAgainst.toString()}</p>
                {!p.executed && (
                  <div className="mt-4">
                    <button onClick={() => handleVote(p.id, true)} className="bg-blue-500 text-white py-1 px-3 rounded mr-2">Votar a Favor</button>
                    <button onClick={() => handleVote(p.id, false)} className="bg-red-500 text-white py-1 px-3 rounded">Votar en Contra</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No hay propuestas activas.</p>
        )}
      </div>
    </div>
  );
};

export default DaoDashboard;
