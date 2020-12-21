const { Router } = require('express');
const router = Router();

router.get('/*', async (req, res) => {
  res.render('pages/error.ejs', { user: req.session.userData, error: 404, message: 'Page not found' });
  return;
});

module.exports = router;
