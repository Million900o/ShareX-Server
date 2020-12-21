const { Router } = require('express');
const router = Router();

router.get('/login', async (req, res) => {
  res.render('pages/login.ejs', { user: {}, error: req.query.error, success: req.query.success, redirect: req.query.r } );
  return;
});

module.exports = router;
