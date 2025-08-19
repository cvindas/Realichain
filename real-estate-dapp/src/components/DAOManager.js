import React, { useState, useEffect, useCallback } from 'react';

const DAOManager = ({ daoContract, walletAddress, setTransactionStatus, allProperties, realEstateContract }) => {
    const [proposals, setProposals] = useState([]);
    const [description, setDescription] = useState('');
    const [selectedTokenId, setSelectedTokenId] = useState('');
    const [userOwnedFractions, setUserOwnedFractions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProposals = useCallback(async () => {
        if (!daoContract) return;
        setIsLoading(true);
        try {
            const count = await daoContract.proposalCount();
            const fetchedProposals = [];
            for (let i = 0; i < count; i++) {
                const p = await daoContract.getProposal(i);
                const hasVoted = await daoContract.hasVoted(i, walletAddress);
                fetchedProposals.push({ 
                    id: p.id,
                    description: p.description,
                    tokenId: p.tokenId,
                    yesVotes: p.yesVotes,
                    noVotes: p.noVotes,
                    executed: p.executed,
                    proposer: p.proposer,
                    hasVoted: hasVoted
                });
            }
            setProposals(fetchedProposals.reverse()); // Show newest first
        } catch (error) {
            console.error("Error al cargar propuestas:", error);
        } finally {
            setIsLoading(false);
        }
    }, [daoContract, walletAddress]);

    useEffect(() => {
        const loadUserFractions = async () => {
            if (!allProperties || !realEstateContract || !walletAddress) return;

            const owned = [];
            for (const prop of allProperties) {
                if (prop.fractionContractAddress) { // Solo propiedades fraccionadas
                    const fractions = await realEstateContract.getFractionsOwned(prop.tokenId, walletAddress);
                    if (fractions > 0) {
                        owned.push(prop);
                    }
                }
            }
            setUserOwnedFractions(owned);
            if (owned.length > 0) {
                setSelectedTokenId(owned[0].tokenId.toString());
            }
        };

        fetchProposals();
        loadUserFractions();
    }, [fetchProposals, allProperties, realEstateContract, walletAddress]);

    const handleCreateProposal = async (e) => {
        e.preventDefault();
        if (!daoContract || !description || !selectedTokenId) return;
        setTransactionStatus({ status: 'pending', message: 'Creando propuesta...' });
        try {
            const transaction = await daoContract.createProposal(description, selectedTokenId);
            await transaction.wait();
            setTransactionStatus({ status: 'success', message: '¡Propuesta creada con éxito!' });
            setDescription('');
            fetchProposals();
        } catch (error) {
            console.error("Error al crear la propuesta:", error);
            setTransactionStatus({ status: 'error', message: `Error: ${error.reason || error.message}` });
        }
    };

    const handleVote = async (proposalId, voteYes) => {
        if (!daoContract) return;
        setTransactionStatus({ status: 'pending', message: 'Enviando voto...' });
        try {
            const transaction = await daoContract.vote(proposalId, voteYes);
            await transaction.wait();
            setTransactionStatus({ status: 'success', message: '¡Voto registrado con éxito!' });
            fetchProposals();
        } catch (error) {
            console.error("Error al votar:", error);
            setTransactionStatus({ status: 'error', message: `Error: ${error.reason || error.message}` });
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto mt-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Panel de Gobernanza (DAO)</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Crear Nueva Propuesta</h3>
                <form onSubmit={handleCreateProposal} className="space-y-3">
                     <div>
                        <label htmlFor="property" className="block text-sm font-medium text-gray-600">Propiedad Asociada</label>
                        <select
                            id="property"
                            value={selectedTokenId}
                            onChange={(e) => setSelectedTokenId(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            disabled={userOwnedFractions.length === 0}
                        >
                            {userOwnedFractions.length > 0 ? (
                                userOwnedFractions.map(prop => (
                                    <option key={prop.tokenId} value={prop.tokenId.toString()}>
                                        {prop.name} (ID: {prop.tokenId.toString()})
                                    </option>
                                ))
                            ) : (
                                <option>No posees fracciones de ninguna propiedad</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-600">Descripción</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                            placeholder="Ej: Aumentar el precio de las fracciones a 0.02 ETH"
                        ></textarea>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300" disabled={userOwnedFractions.length === 0}>
                        Enviar Propuesta
                    </button>
                </form>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Propuestas Activas</h3>
                {isLoading ? (
                    <p>Cargando propuestas...</p>
                ) : proposals.length === 0 ? (
                    <p className="text-gray-500">No hay propuestas en este momento.</p>
                ) : (
                    <div className="space-y-4">
                        {proposals.map((p) => (
                            <div key={p.id} className="border border-gray-200 p-4 rounded-lg">
                                <p className="text-gray-800 font-semibold">{p.description}</p>
                                <p className="text-xs text-gray-500 mt-1">Propiedad ID: {p.tokenId.toString()} | Propuesto por: {p.proposer.substring(0, 6)}...{p.proposer.substring(38)}</p>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex gap-4">
                                        <span className="text-green-600 font-bold">Sí: {p.yesVotes.toString()}</span>
                                        <span className="text-red-600 font-bold">No: {p.noVotes.toString()}</span>
                                    </div>
                                    {!p.executed && !p.hasVoted && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleVote(p.id, true)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm">Votar Sí</button>
                                            <button onClick={() => handleVote(p.id, false)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm">Votar No</button>
                                        </div>
                                    )}
                                    {p.hasVoted && <span className="text-sm text-gray-500 italic">Ya votaste</span>}
                                    {p.executed && <span className="text-sm text-blue-600 font-bold">Ejecutada</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DAOManager;
