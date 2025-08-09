import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const DaoCard = ({ daoContract, realEstateContract, walletAddress }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProposalDesc, setNewProposalDesc] = useState('');
  const [isInvestor, setIsInvestor] = useState(false);
  const [activeProposalId, setActiveProposalId] = useState(null);

  // Carga las propuestas desde el contrato
  const loadProposals = useCallback(async () => {
    if (!daoContract) return;
    setLoading(true);
    try {
      const proposalCount = await daoContract.proposalCount();
      const proposalsData = [];
      for (let i = 0; i < proposalCount; i++) {
        const p = await daoContract.proposals(i);
        // Comprueba si el usuario actual ya ha votado en esta propuesta
        const hasVoted = await daoContract.hasVoted(p.id, walletAddress);

        proposalsData.push({
          id: p.id,
          description: p.description,
          yesVotes: p.yesVotes,
          noVotes: p.noVotes,
          executed: p.executed,
          proposer: p.proposer,
          hasVoted: hasVoted
        });
      }
      setProposals(proposalsData.reverse()); // Mostrar las más nuevas primero
    } catch (error) {
      console.error("Error al cargar propuestas:", error);
    } finally {
      setLoading(false);
    }
  }, [daoContract, walletAddress]);

  // Verifica si el usuario es un inversor (poseedor de NFT)
  const checkInvestorStatus = useCallback(async () => {
    if (!realEstateContract || !walletAddress) return;
    try {
      const balance = await realEstateContract.balanceOf(walletAddress);
      setIsInvestor(balance > 0);
    } catch (error) {
      console.error("Error al verificar el estado del inversor:", error);
    }
  }, [realEstateContract, walletAddress]);

  useEffect(() => {
    loadProposals();
    checkInvestorStatus();
  }, [loadProposals, checkInvestorStatus]);

  // Maneja la creación de una nueva propuesta
  const handleCreateProposal = async (e) => {
    e.preventDefault();
    if (!daoContract || !newProposalDesc.trim()) return;
    try {
      const tx = await daoContract.createProposal(newProposalDesc);
      await tx.wait();
      setNewProposalDesc('');
      loadProposals(); // Recargar propuestas
    } catch (error) {
      console.error("Error al crear la propuesta:", error);
      alert(`Error: ${error?.reason || error.message}`);
    }
  };

  // Maneja la votación en una propuesta
  const handleVote = async (proposalId, vote) => {
    if (!daoContract) return;
    try {
      const tx = await daoContract.vote(proposalId, vote);
      await tx.wait();
      loadProposals(); // Recargar para mostrar el nuevo estado
    } catch (error) {
      console.error("Error al votar:", error);
      alert(`Error: ${error?.reason || error.message}`);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg text-white">
      <h3 className="text-xl font-bold mb-4">Inversionistas DAO</h3>

      {/* Formulario para crear propuesta (solo para inversores) */}
      {isInvestor && (
        <form onSubmit={handleCreateProposal} className="mb-6">
          <textarea
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Describe tu propuesta..."
            value={newProposalDesc}
            onChange={(e) => setNewProposalDesc(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newProposalDesc.trim()}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Crear Propuesta
          </button>
        </form>
      )}

      {/* Lista de propuestas */}
      <div className="space-y-4">
        {loading ? (
          <p>Cargando propuestas...</p>
        ) : proposals.length === 0 ? (
          <p className="text-gray-400">No hay propuestas activas.</p>
        ) : (
          proposals.map((p) => (
            <div key={p.id} className="bg-slate-700 p-4 rounded-md">
              <p className="font-semibold break-words">{p.description}</p>
              <p className="text-xs text-gray-400 mt-1">Propuesto por: {p.proposer.substring(0, 6)}...{p.proposer.substring(p.proposer.length - 4)}</p>
              
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-green-400">Sí: {ethers.formatUnits(p.yesVotes, 0)}</span>
                <span className="text-red-400">No: {ethers.formatUnits(p.noVotes, 0)}</span>
                <span className={`font-bold ${p.executed ? 'text-green-500' : 'text-yellow-500'}`}>
                  {p.executed ? 'Ejecutada' : 'Pendiente'}
                </span>
              </div>

              {/* Botones de Votación */}
              {!p.executed && (
                <div className="mt-4">
                  {p.hasVoted ? (
                    <p className='text-center text-sm text-gray-300'>Ya has votado en esta propuesta.</p>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleVote(p.id, true)} 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                        Votar Sí
                      </button>
                      <button 
                        onClick={() => handleVote(p.id, false)} 
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                        Votar No
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DaoCard;
