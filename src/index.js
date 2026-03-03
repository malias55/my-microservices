const express = require('express');
const { auth } = require('./middleware/auth');

const app = express();

app.use(express.json({ limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Auth for all service routes
app.use(auth);

// --- Services ---
app.use('/pdf', require('./services/pdf-compress'));
// app.use('/image', require('./services/image-resize'));
// app.use('/doc', require('./services/doc-convert'));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`microservices listening on port ${PORT}`);
});
