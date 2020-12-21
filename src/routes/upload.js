const { Router } = require('express');
const router = Router();

const passwordAuthentication = require('../middleware/passwordAuthentication.js');

router.get('/upload', passwordAuthentication, async (req, res) => {
  res.render('pages/upload.ejs', { user: req.session.userData, error: req.query.error, success: req.query.success } );
  return;
});

module.exports = router;
