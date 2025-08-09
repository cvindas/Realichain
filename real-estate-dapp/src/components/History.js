import React from 'react';

const History = ({ history, properties }) => {

  const getPropertyName = (tokenId) => {
    const property = properties.find(p => p.tokenId === tokenId);
    return property ? property.name : `Propiedad #${tokenId}`;
  };

  if (!history || history.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Historial de Compras</h2>
        <p className="text-gray-500">No hay transacciones en el historial.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Historial de Compras</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase">Propiedad</th>
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase">Comprador</th>
              <th className="text-right py-3 px-4 font-semibold text-sm text-gray-600 uppercase">Fracciones</th>
              <th className="text-right py-3 px-4 font-semibold text-sm text-gray-600 uppercase">Costo (ETH)</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{getPropertyName(item.tokenId)}</td>
                <td className="py-3 px-4 font-mono text-sm truncate">{item.buyer}</td>
                <td className="py-3 px-4 text-right">{item.count}</td>
                <td className="py-3 px-4 text-right font-semibold">{item.totalCost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
