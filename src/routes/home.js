const { Router } = require('express');
const router = Router();

router.get('/', async (req, res) => {
  res.render('pages/home.ejs', { user: req.session.userData, error: req.query.error, success: req.query.success } );
  return;
});

router.get('/home', async (req, res) => {
  res.render('pages/home.ejs', { user: req.session.userData, error: req.query.error, success: req.query.success } );
  return;
});

module.exports = router;
