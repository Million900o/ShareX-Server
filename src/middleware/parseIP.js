const { Router } = require('express');
const router = Router();

const ipUtil = require('../utils/ip.js')

router.use(async (req, res, next) => {
  req.ip = ipUtil.parseIP(req.ip);
  next();
});

module.exports = router;
