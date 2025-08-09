import React, { useState } from 'react';

const Filters = ({ onSearch }) => {
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [price, setPrice] = useState('');

  const handleSearchClick = () => {
    onSearch({ location, propertyType, price });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-10 flex items-end gap-6 text-gray-800">
      {/* Location Filter */}
      <div className="flex-1">
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
        <select 
          id="location" 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Todas</option>
          <option value="Puntarenas Ojochal">Puntarenas Ojochal</option>
          <option value="DORAL">DORAL</option>
          <option value="San Jose">San Jose</option>
          <option value="Fortuna">La Fortuna</option>
        </select>
      </div>

      {/* Property Type Filter */}
      <div className="flex-1">
        <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Propiedad</label>
        <select 
          id="propertyType" 
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Todos</option>
          <option value="Finca">Finca</option>
          <option value="casa">Casa</option>
          <option value="Tucanes">Tucanes</option>
        </select>
      </div>

      {/* Price Filter */}
      <div className="flex-1">
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Precio Máximo</label>
        <select 
          id="price" 
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Cualquiera</option>
          <option value="500000">Hasta $500,000</option>
          <option value="1000000">Hasta $1,000,000</option>
          <option value="2000000">Hasta $2,000,000</option>
        </select>
      </div>

      {/* Search Button */}
      <button 
        onClick={handleSearchClick}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 self-end"
      >
        Buscar
      </button>
    </div>
  );
};

export default Filters;
