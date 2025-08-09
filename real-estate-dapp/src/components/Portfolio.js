import React from 'react';

import { formatEther } from 'ethers';

const Portfolio = ({ portfolio = [], purchaseHistory = [], allProperties = [], onSelectProperty }) => {

  // Encuentra los detalles de una propiedad por su ID de token
  const getPropertyDetails = (tokenId) => {
    // Si no hay tokenId o no hay propiedades, no hay nada que buscar.
    if (!tokenId || !allProperties) return null;

    return allProperties.find(p => {
      // Asegurarse de que 'p' y 'p.id' existan antes de llamar a .toString()
      return p && p.id && p.id.toString() === tokenId.toString();
    });
  };

  // Crear una lista única de propiedades en las que el usuario tiene fracciones
  const fractionallyOwnedProperties = purchaseHistory.reduce((acc, purchase) => {
    if (purchase && purchase.tokenId) {
      const details = getPropertyDetails(purchase.tokenId);
      if (details && !acc.some(p => p.id.toString() === details.id.toString())) {
        acc.push(details);
      }
    }
    return acc;
  }, []);

  // Combinar propiedades poseídas al 100% y propiedades con fracciones (sin duplicados)
  const allOwnedProperties = [...portfolio];
  fractionallyOwnedProperties.forEach(prop => {
    if (!allOwnedProperties.some(p => p.id.toString() === prop.id.toString())) {
      allOwnedProperties.push(prop);
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-4xl font-bold text-gray-800 mb-6">Mi Portafolio</h2>
      {allOwnedProperties.length === 0 ? (
        <p className="text-gray-600">Aún no tienes propiedades en tu portafolio. ¡Compra algunas fracciones para empezar!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allOwnedProperties.map((property, index) => (
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
                  <th className="p-3 text-left">Propiedad</th>
                  <th className="p-3 text-left">Fracciones</th>
                  <th className="p-3 text-left">Costo Total</th>
                  <th className="p-3 text-left">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseHistory.map((purchase, index) => {
                  const propertyDetails = getPropertyDetails(purchase.tokenId);
                  return (
                    <tr key={index}>
                      <td className="p-4 flex items-center gap-4">
                        <img 
                          src={propertyDetails?.image || 'https://via.placeholder.com/40'} 
                          alt={propertyDetails?.name || 'Propiedad'} 
                          className="w-12 h-12 rounded-lg object-cover shadow-md"
                        />
                        <span className="font-medium text-gray-800">{propertyDetails?.name || 'Propiedad no encontrada'}</span>
                      </td>
                      <td className="p-4 text-center">{purchase.fractions}</td>
                      <td className="p-4">{formatEther(purchase.cost)} ETH</td>
                      <td className="p-4 truncate max-w-xs">
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${purchase.txHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-purple-600 hover:underline"
                        >
                          {purchase.txHash}
                        </a>
                      </td>
                    </tr>
                  );
                })}
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
