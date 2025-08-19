import React, { useState } from 'react';
import { ethers } from 'ethers';

const OfferManager = ({ tokenId, walletAddress, owner, highestOffer, onMakeOffer, onAcceptOffer, setTransactionStatus }) => {
    const [offerAmount, setOfferAmount] = useState('');

    const handleAcceptOffer = () => {
        if (onAcceptOffer) {
            onAcceptOffer(tokenId);
        }
    };

    // La función de retirar oferta necesitaría su propia implementación en App.js si se decide mantenerla.
    // Por ahora, se omite para simplificar.


    const handleMakeOffer = async (e) => {
        e.preventDefault();
        if (onMakeOffer && offerAmount) {
            onMakeOffer(tokenId, offerAmount);
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6 mt-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Sistema de Ofertas</h3>
            <div className="mb-4">
                {highestOffer && highestOffer.isActive ? (
                    <div>
                        <p className="text-lg"><strong>Oferta más alta:</strong> {ethers.formatEther(highestOffer.amount)} ETH</p>
                        <p className="text-sm text-gray-500">De: {highestOffer.offerer.substring(0, 6)}...{highestOffer.offerer.substring(38)}</p>
                        {walletAddress && walletAddress.toLowerCase() === highestOffer.offerer.toLowerCase() && (
                            <span className="text-xs text-blue-500 font-semibold ml-2">(Esta es tu oferta)</span>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-600">Aún no hay ofertas para esta propiedad. ¡Sé el primero!</p>
                )}
                {walletAddress && highestOffer && highestOffer.isActive && walletAddress.toLowerCase() === owner?.toLowerCase() && (
                    <button onClick={handleAcceptOffer} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
                        Aceptar Oferta
                    </button>
                )}
                {/* El botón para retirar oferta se puede añadir aquí si se implementa la lógica en App.js */}
            </div>
            <form onSubmit={handleMakeOffer} className="space-y-4">
                <div>
                    <label htmlFor="offerAmount" className="block text-sm font-medium text-gray-700">Tu Oferta (ETH)</label>
                    <input
                        type="text"
                        id="offerAmount"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.05"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                    disabled={!walletAddress}
                >
                    {walletAddress ? 'Hacer una Oferta' : 'Conecta tu Wallet para Ofertar'}
                </button>
            </form>
        </div>
    );
};

export default OfferManager;
