import React, { useState } from 'react';

const DaoPanel = () => {
  const [hasVoted, setHasVoted] = useState(false);

  return (
    <aside className="w-full lg:w-1/4">
      <div className="bg-dark-navy text-white p-6 rounded-xl shadow-lg mt-16">
        <h2 className="text-2xl font-bold mb-4">Inversionistas DAO</h2>
        <div className="bg-gray-700 p-5 rounded-lg">
          <h3 className="font-semibold text-lg">Propuestas</h3>
          <p className="mt-2 text-gray-300">Remodelación de edificio</p>
          <button 
            onClick={() => setHasVoted(true)}
            disabled={hasVoted}
            className={`mt-5 w-full font-bold py-3 px-4 rounded-lg transition-colors duration-300 ${
              hasVoted 
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-brand-blue hover:bg-blue-600'
            }`}
          >
            {hasVoted ? '¡Voto registrado!' : 'Votar'}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DaoPanel;
