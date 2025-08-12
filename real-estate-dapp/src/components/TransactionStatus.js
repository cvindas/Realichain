import React from 'react';

const TransactionStatus = ({ status, message }) => {
  if (!status || !message) {
    return null;
  }

  const baseClasses = 'p-4 rounded-md my-4 text-white text-center';
  let statusClasses = '';
  let title = '';

  switch (status) {
    case 'success':
      statusClasses = 'bg-green-500';
      title = 'Éxito';
      break;
    case 'error':
      statusClasses = 'bg-red-500';
      title = 'Error';
      break;
    case 'pending':
      statusClasses = 'bg-yellow-500';
      title = 'Pendiente';
      break;
    default:
      return null;
  }

  return (
    <div className={`${baseClasses} ${statusClasses}`}>
      <p className="font-bold">{title}</p>
      <p>{message}</p>
    </div>
  );
};

export default TransactionStatus;