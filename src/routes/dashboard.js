const { Router } = require('express');
const router = Router();

const passwordAuthentication = require('../middleware/passwordAuthentication.js');

router.get('/dashboard', passwordAuthentication, async (req, res) => {
  res.render('pages/dashboard.ejs', { user: req.session.userData, page: req.query.page, error: req.query.error, success: req.query.success } );
  return;
});

module.exports = router;
