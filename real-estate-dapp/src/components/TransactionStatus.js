import React from 'react';

const TransactionStatus = ({ transaction, onUpdateStatus }) => {
  const { property, offerAmount, status } = transaction;

  const getStatusClass = (stepStatus) => {
    if (status === stepStatus) return 'bg-yellow-400 text-yellow-800'; // Current
    if (['Oferta Realizada', 'Fondos en Escrow', 'Propiedad Transferida'].indexOf(status) > ['Oferta Realizada', 'Fondos en Escrow', 'Propiedad Transferida'].indexOf(stepStatus)) return 'bg-green-500 text-white'; // Completed
    return 'bg-gray-300 text-gray-600'; // Pending
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Estado de la Transacción</h2>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <p className="text-lg">Propiedad: <span className="font-semibold">{property.type} en {property.city}</span></p>
        <p className="text-lg">Token ID: <span className="font-semibold font-mono">{property.tokenId}</span></p>
        <p className="text-lg">Monto de la Oferta: <span className="font-semibold text-green-600">${offerAmount}</span></p>
      </div>

      <div className="space-y-4 mb-8">
        <div className={`p-4 rounded-lg font-semibold ${getStatusClass('Oferta Realizada')}`}>1. Oferta Realizada</div>
        <div className={`p-4 rounded-lg font-semibold ${getStatusClass('Fondos en Escrow')}`}>2. Fondos en Escrow</div>
        <div className={`p-4 rounded-lg font-semibold ${getStatusClass('Propiedad Transferida')}`}>3. Propiedad Transferida</div>
      </div>

      <div className="flex gap-4">
        {status === 'Oferta Realizada' && (
          <button onClick={() => onUpdateStatus('Fondos en Escrow')} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
            Simular: Aceptar Oferta y Depositar Fondos
          </button>
        )}
        {status === 'Fondos en Escrow' && (
          <button onClick={() => onUpdateStatus('Propiedad Transferida')} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
            Simular: Confirmar Recepción y Transferir Propiedad
          </button>
        )}
        {status === 'Propiedad Transferida' && (
          <p className="text-green-600 font-bold">¡Transacción Completada!</p>
        )}
      </div>
    </div>
  );
};

export default TransactionStatus;
