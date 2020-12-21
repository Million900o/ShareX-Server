const { Router, json, urlencoded } = require('express');
const router = Router();

const bcrypt = require('bcrypt');

router.use(json());
router.use(urlencoded({ extended: true }));

router.post('/api/user/subdomain', async (req, res) => {
  const password = req.body.password;
  const subdomain = req.body.subdomain;
  if (password && subdomain) {
    bcrypt.compare(password, req.session.userData.authentication.password).then(async e => {
      if (e) {
        const domain = await req.app.server.models.DomainModel.findOne({ domain: req.session.userData.domain.domain });
        domain.subdomains[subdomain] = req.session.userData.id;
        delete domain.subdomains[req.session.userData.domain.subdomain];
        await req.app.server.models.DomainModel.updateOne({ domain: req.session.userData.domain.domain }, domain);
        await req.app.server.models.UserModel.updateOne(req.session.userData, { 'domain.subdomain': subdomain });
        req.session.userData = await req.app.server.models.UserModel.findOne({ id: req.session.userData.id });
        res.redirect('/dashboard?page=subdomain&success=Subdomain successfully updated to: ' + subdomain + '.');
      } else res.redirect('/dashboard?page=subdomain&error=Incorrect password.');
      return;
    });
  } else res.redirect('/dashboard?page=subdomain&error=Password and subdomain are required.');
  return;
});

module.exports = router;
