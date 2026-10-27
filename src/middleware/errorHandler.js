const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {})
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON payload in request body.'
    });
  }

  if (err.code && err.code.startsWith('SQLITE_CONSTRAINT')) {
    return res.status(400).json({
      error: 'Database constraint violation.',
      details: err.message
    });
  }

  console.error('Unhandled server error:', err);
  return res.status(500).json({
    error: 'Internal server error. Please try again later.'
  });
}

module.exports = errorHandler;
