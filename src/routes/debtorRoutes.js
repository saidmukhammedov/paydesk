const express = require('express');
const DebtorService = require('../services/debtorService');

function createDebtorRouter(debtorService = new DebtorService()) {
  const router = express.Router();

  router.get('/', async (req, res, next) => {
    try {
      const debtors = await debtorService.getMonthlyDebtors(req.query.month);
      res.json(debtors);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createDebtorRouter;
