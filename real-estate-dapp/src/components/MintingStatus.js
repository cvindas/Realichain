import React from 'react';

const MintingStatus = ({ status }) => {
  if (!status || !status.status) {
    return null;
  }

  const getStatusColor = () => {
    if (status.status === 'Error') return 'bg-red-100 text-red-700';
    if (status.status === 'Success!') return 'bg-green-100 text-green-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className={`p-4 mt-4 rounded-lg ${getStatusColor()}`}>
      <p className="font-bold">{status.status}</p>
      {status.message && <p className="text-sm">{status.message}</p>}
    </div>
  );
};

export default MintingStatus;
