app.post('/api/multicaixa/callback', (req, res) => {
  const { paymentId, status } = req.body;

  if (status === 'paid') {
    // Update order status in the database
    console.log(`Payment ${paymentId} completed successfully`);
    return res.status(200).send('OK');
  }

  res.status(400).send('Payment failed');
});
