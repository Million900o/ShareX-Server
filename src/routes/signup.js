const { Router } = require('express');
const router = Router();

router.get('/signup', async (req, res) => {
  res.render('pages/signup.ejs', { user: {}, error: req.query.error, success: req.query.success } );
  return;
});

module.exports = router;
