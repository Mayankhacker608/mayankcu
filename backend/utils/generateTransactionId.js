const generateTransactionId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `TXN-${random}`;
};

module.exports = generateTransactionId;
