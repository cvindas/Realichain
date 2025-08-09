import React, { useState } from 'react';

const Filters = ({ onSearch }) => {
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [price, setPrice] = useState('');

  const handleSearchClick = () => {
    onSearch({ location, propertyType, price });
  };

  const selectStyles = "w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700";

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
      {/* Location Filter */}
      <select 
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className={selectStyles}
      >
        <option value="" disabled>Ubicación</option>
        <option value="">Todas</option>
        <option value="Los Angeles">Los Angeles</option>
        <option value="Nueva York">Nueva York</option>
        <option value="San Francisco">San Francisco</option>
        <option value="Puntarenas Ojochal">Puntarenas Ojochal</option>
        <option value="DORAL">DORAL</option>
      </select>

      {/* Property Type Filter */}
      <select 
        value={propertyType}
        onChange={(e) => setPropertyType(e.target.value)}
        className={selectStyles}
      >
        <option value="" disabled>Tipo de propiedad</option>
        <option value="">Todos</option>
        <option value="House">House</option>
        <option value="Apartamento">Apartamento</option>
        <option value="Villa">Villa</option>
        <option value="Renta">Renta</option>
      </select>

      {/* Price Filter */}
      <select 
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className={selectStyles}
      >
        <option value="" disabled>Precio</option>
        <option value="">Cualquiera</option>
        <option value="500000">Hasta $500,000</option>
        <option value="1000000">Hasta $1,000,000</option>
        <option value="2000000">Hasta $2,000,000</option>
      </select>

      {/* Search Button */}
      <button 
        onClick={handleSearchClick}
        className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
      >
        Buscar
      </button>
    </div>
  );
};

export default Filters;
