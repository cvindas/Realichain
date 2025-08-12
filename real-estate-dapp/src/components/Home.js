import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="text-center p-10">
      <h1 className="text-5xl font-bold mb-4">Bienvenido a Realichain</h1>
      <p className="text-xl text-gray-600 mb-8">La plataforma descentralizada para la inversión inmobiliaria fraccionada.</p>
      <div>
        <Link to="/discover" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300">
          Explorar Propiedades
        </Link>
      </div>
    </div>
  );
};

export default Home;
