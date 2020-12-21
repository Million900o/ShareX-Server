const { Router } = require('express');
const router = Router();

const DomainModel = require('../models/domain.js');

router.use(async (req, res, next) => {
  const domain = req.subdomains.length ? req.get('host').replace(req.subdomains.join('.') + '.', '') : req.get('host');
  const DomainData = await DomainModel.findOne({ domain: domain });
  if(DomainData) {
    req.domain = DomainData;
    next();
  } else return res.redirect(req.app.server.defaultURL + req.url);
});

module.exports = router;
