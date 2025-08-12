import React from 'react';

const History = ({ history, properties }) => {

  const getPropertyName = (tokenId) => {
    if (!properties || properties.length === 0) {
        return `Propiedad #${tokenId}`;
    }
    const property = properties.find(p => p.tokenId.toString() === tokenId.toString());
    return property ? property.name : `Propiedad #${tokenId}`;
  };

  if (!history || history.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Historial de Transacciones</h2>
        <p className="text-gray-500">No hay transacciones en el historial.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Historial de Transacciones</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase">Tipo</th>
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase">Propiedad</th>
              <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  {item.type === 'mint' ? 
                    <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">Minteo</span> : 
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">Compra</span>
                  }
                </td>
                <td className="py-3 px-4">{getPropertyName(item.tokenId)}</td>
                <td className="py-3 px-4 text-sm">
                  {item.type === 'mint' ? 
                    `Token ID: ${item.tokenId}` : 
                    `Compraste ${item.fractions} fracciones por ${item.cost} ETH`
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
