const { Router, json, urlencoded } = require('express');
const router = Router();

const bcrypt = require('bcrypt');

router.use(json());
router.use(urlencoded({ extended: true }));

router.post('/api/user/domain', async (req, res) => {
  const password = req.body.password;
  const domain = req.body.domain;
  if (password && domain) {
    bcrypt.compare(password, req.session.userData.authentication.password).then(async e => {
      if (e) {
        const domainCheck = await req.app.server.models.DomainModel.findOne({ domain: domain });
        if (!domainCheck) {
          await req.app.server.models.DomainModel.create({
            info: {
              created_date: new Date(),
              users: [req.session.userData.id],
            },
            domain: domain,
            subdomains: {
              '@': req.session.userData.id
            },
            owner: req.session.userData.id,
            secure: req.app.server.defaults.secure
          });
          await req.app.server.models.UserModel.updateOne(req.session.userData, { domain: { domain: domain, subdomain: '' } });
          req.session.userData.domain = { domain: domain, subdomain: '' };
          res.redirect('/dashboard?page=domain&success=Domain successfully updated to: ' + domain + '.');
        } else res.redirect('/dashboard?page=domain&error=Domain already exists.');
      } else res.redirect('/dashboard?page=domain&error=Incorrect Password.');
      return;
    });
  } else res.redirect('/dashboard?page=domain&error=Password and domain are required.');
  return;
});

module.exports = router;
