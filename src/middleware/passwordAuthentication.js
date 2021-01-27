const { Router } = require('express');
const router = Router();

router.use(async (req, res, next) => {
  if (req.session.userData) {
    next();
    return;
  } else res.redirect('/login?r=' + req.url);
});

module.exports = router;
