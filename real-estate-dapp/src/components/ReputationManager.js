import React, { useState, useEffect } from 'react';

const ReputationManager = ({ realEstateContract, reputationContract, tokenId, walletAddress, owner }) => {
    const [rating, setRating] = useState(5);
    const [averageRating, setAverageRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);

    useEffect(() => {
        const fetchReputation = async () => {
            if (reputationContract && owner) {
                const userReputation = await reputationContract.reputations(owner);
                const avg = userReputation.ratingCount > 0 ? Number(userReputation.totalRating) / Number(userReputation.ratingCount) : 0;
                setAverageRating(avg);
                setRatingCount(Number(userReputation.ratingCount));
            }
        };
        fetchReputation();
    }, [reputationContract, owner]);

    const handleRate = async () => {
        if (!realEstateContract) return;
        try {
            const tx = await realEstateContract.rateRental(tokenId, rating);
            await tx.wait();
            alert('¡Calificación enviada con éxito!');
            // Refresh reputation
            const userReputation = await reputationContract.reputations(owner);
            const avg = userReputation.ratingCount > 0 ? Number(userReputation.totalRating) / Number(userReputation.ratingCount) : 0;
            setAverageRating(avg);
            setRatingCount(Number(userReputation.ratingCount));
        } catch (error) {
            console.error("Error al enviar la calificación:", error);
            alert(error.reason || 'Hubo un error al enviar la calificación.');
        }
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg mt-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Reputación del Propietario</h3>
            <p><strong>Calificación Promedio:</strong> {averageRating.toFixed(1)} / 5 ({ratingCount} calificaciones)</p>
            
            <div className="mt-4">
                <h4 className="font-bold">Calificar Interacción</h4>
                <p className="text-sm text-gray-600 mb-2">Puedes calificar al propietario una vez finalizado el alquiler.</p>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="p-2 border rounded-md">
                    <option value={5}>5 - Excelente</option>
                    <option value={4}>4 - Bueno</option>
                    <option value={3}>3 - Regular</option>
                    <option value={2}>2 - Malo</option>
                    <option value={1}>1 - Muy Malo</option>
                </select>
                <button onClick={handleRate} className="ml-4 bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600">
                    Enviar Calificación
                </button>
            </div>
        </div>
    );
};

export default ReputationManager;
