const { Router } = require('express');
const router = Router();

router.use(async (req, res, next) => {
  const domain = (req.subdomains.length ? req.subdomains.join('.') + '.' : '') + req.get('host');
  req.domain = domain;
  next();
});

module.exports = router;
