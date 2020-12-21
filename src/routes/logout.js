const { Router } = require('express');
const router = Router();

const passwordAuthentication = require('../middleware/passwordAuthentication.js');

router.get('/logout', passwordAuthentication, async (req, res) => {
  req.app.server.logger.log('Un-authenticated', req.session.userData.authentication.username);
  req.session.destroy();
  res.redirect('/');
  return;
});

module.exports = router;
