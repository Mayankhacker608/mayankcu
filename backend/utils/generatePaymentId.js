const generatePaymentId = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `PAY-${random}`;
};

module.exports = generatePaymentId;
