import React from 'react';

const Portfolio = ({ properties, purchaseHistory }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-4xl font-bold text-gray-800 mb-6">Mi Portafolio</h2>
      {properties.length === 0 ? (
        <p className="text-gray-600">Aún no tienes propiedades en tu portafolio. ¡Compra algunas fracciones para empezar!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
              <img src={property.image} alt={property.type} className="w-full h-56 object-cover" />
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800">{property.type}</h3>
                <p className="text-gray-600 mt-2">{property.city}</p>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-md font-semibold text-gray-700">Token ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{property.tokenId}</span></p>
                  <p className="text-sm text-gray-600 mt-1">Posees <span className="font-bold">{property.fractionsOwned}</span> de 1,000 fracciones</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12">
        <h3 className="text-3xl font-bold text-gray-800 mb-4">Historial de Compras</h3>
        {purchaseHistory && purchaseHistory.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fracciones Compradas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Total (ETH)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hash de Transacción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseHistory.map((tx, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.tokenId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.fractions}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.cost}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono" title={tx.txHash}>
                      {`${tx.txHash.substring(0, 10)}...${tx.txHash.substring(tx.txHash.length - 8)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No tienes compras registradas.</p>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
