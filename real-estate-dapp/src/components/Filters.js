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
      
      <div className="flex flex-col gap-2 flex-grow">
        <label htmlFor="location-filter" className="text-sm font-semibold text-gray-600">
          Ubicación
        </label>
        <select 
          id="location-filter"
          value={location} 
          onChange={(e) => setLocation(e.target.value)} 
          className="p-3 border-0 bg-gray-100 rounded-lg w-full focus:ring-2 focus:ring-brand-blue"
        >
          <option value="">Todas</option>
          <option value="La Fortuna">La Fortuna</option>
          <option value="Tamarindo">Tamarindo</option>
          <option value="San José">San José</option>
          <option value="Manuel Antonio">Manuel Antonio</option>
        </select>
      </div>

      <div className="flex flex-col gap-2 flex-grow">
        <label htmlFor="type-filter" className="text-sm font-semibold text-gray-600">
          Tipo de Propiedad
        </label>
        <select 
          id="type-filter"
          value={propertyType} 
          onChange={(e) => setPropertyType(e.target.value)} 
          className="p-3 border-0 bg-gray-100 rounded-lg w-full focus:ring-2 focus:ring-brand-blue"
        >
          <option value="">Todos</option>
          <option value="Casa de Montaña">Casa de Montaña</option>
          <option value="Villa de Lujo">Villa de Lujo</option>
          <option value="Apartamento">Apartamento</option>
          <option value="Renta Vacacional">Renta Vacacional</option>
        </select>
      </div>

      <div className="flex flex-col gap-2 flex-grow">
        <label htmlFor="price-filter" className="text-sm font-semibold text-gray-600">
          Precio Máximo
        </label>
        <select 
          id="price-filter"
          value={price} 
          onChange={(e) => setPrice(e.target.value)} 
          className="p-3 border-0 bg-gray-100 rounded-lg w-full focus:ring-2 focus:ring-brand-blue"
        >
          <option value="">Cualquiera</option>
          <option value="500000">Hasta $500,000</option>
          <option value="1000000">Hasta $1,000,000</option>
          <option value="2000000">Hasta $2,000,000</option>
        </select>
      </div>

      <button 
        onClick={handleSearchClick} 
        className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg whitespace-nowrap self-stretch"
      >
        Buscar
      </button>
    </div>
  );
};

export default Filters;
