const express = require('express');
const path = require('node:path');
const createStudentRouter = require('./routes/studentRoutes');
const createPaymentRouter = require('./routes/paymentRoutes');
const createDebtorRouter = require('./routes/debtorRoutes');
const errorHandler = require('./middleware/errorHandler');
const { closeDatabase } = require('./db/database');

function createApp(dependencies = {}) {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const studentRouter = createStudentRouter(
    dependencies.studentService,
    dependencies.paymentService
  );
  const paymentRouter = createPaymentRouter(dependencies.paymentService);
  const debtorRouter = createDebtorRouter(dependencies.debtorService);

  app.use('/students', studentRouter);
  app.use('/api/students', studentRouter);

  app.use('/payments', paymentRouter);
  app.use('/api/payments', paymentRouter);

  app.use('/debtors', debtorRouter);
  app.use('/api/debtors', debtorRouter);

  app.use((req, res, next) => {
    if (req.accepts('json') || req.path.startsWith('/api') || req.path.startsWith('/students') || req.path.startsWith('/payments') || req.path.startsWith('/debtors')) {
      return res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
  closeDatabase
};
