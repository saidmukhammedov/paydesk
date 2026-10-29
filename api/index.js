const { createApp } = require('../src/app');

let appInstance = null;

function getApp() {
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance;
}

module.exports = (req, res) => {
  const app = getApp();
  return app(req, res);
};

