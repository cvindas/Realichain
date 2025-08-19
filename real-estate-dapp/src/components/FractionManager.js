import React, { useState } from 'react';
import { ethers } from 'ethers';

const FractionManager = ({ property, walletAddress, onPurchaseFractions, pricePerFraction, fractionsAvailable }) => {
    const [amount, setAmount] = useState(1);

    if (!property.fractionContractAddress) {
        return null; // No mostrar si la propiedad no está fraccionada
    }

    const handleBuy = (e) => {
        e.preventDefault();
        if (amount > 0) {
            onPurchaseFractions(property.fractionContractAddress, amount);
        }
    };

    // El balance es un BigInt con 18 decimales, hay que formatearlo
    const formattedBalance = property.userFractionBalance 
        ? ethers.formatUnits(property.userFractionBalance, 18) 
        : '0';

    return (
        <div className="bg-gray-50 p-4 rounded-lg mt-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Gestionar Fracciones</h3>
            <p className="mb-4"><strong>Precio por Fracción:</strong> {pricePerFraction ? `${pricePerFraction.toFixed(8)} ETH` : 'N/A'}</p>
            <p className="mb-4"><strong>Fracciones Disponibles:</strong> {fractionsAvailable !== undefined ? fractionsAvailable : 'N/A'}</p>
            <p className="mb-4"><strong>Tu Saldo:</strong> {formattedBalance} Fracciones</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Formulario de Compra */}
                <form onSubmit={handleBuy} className="space-y-4">
                    <h4 className="font-bold">Comprar Fracciones</h4>
                    <div>
                        <label htmlFor="buy-amount" className="block text-sm font-medium text-gray-700">Cantidad</label>
                        <input 
                            type="number"
                            id="buy-amount"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            min="1"
                            className="w-full p-2 mt-1 border rounded-md"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600">
                        Comprar
                    </button>
                </form>

                {/* Formulario de Venta (funcionalidad pendiente) */}
                <form className="space-y-4">
                    <h4 className="font-bold">Vender Fracciones</h4>
                     <p className="text-sm text-gray-500">La funcionalidad de venta se implementará en una futura actualización.</p>
                    <button type="button" disabled className="w-full bg-red-300 text-white font-bold py-2 px-4 rounded cursor-not-allowed">
                        Vender
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FractionManager;
