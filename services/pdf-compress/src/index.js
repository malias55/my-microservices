const express = require('express');
const { auth } = require('./middleware/auth');
const compressRouter = require('./routes/compress');

const app = express();

app.use(express.json({ limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/pdf', auth, compressRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`pdf-compress listening on port ${PORT}`);
});
