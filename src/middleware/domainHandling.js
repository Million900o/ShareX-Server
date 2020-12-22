const { Router } = require('express');
const router = Router();

router.use(async (req, res, next) => {
  req.domain = req.get('host');
  next();
});

module.exports = router;
