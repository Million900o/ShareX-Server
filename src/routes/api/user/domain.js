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
        const userCheck = await req.app.server.models.UserModel.findOne({ domain: domain })
        if(!userCheck) {
          req.session.userData.domain = domain;
          await req.app.server.models.UserModel.updateOne(req.session.userData, { domain: req.session.userData.domain });
          res.redirect('/dashboard?page=domain&success=Domain successfully updated to: ' + domain + '.');
        } else res.redirect('/dashboard?page=domain&error=Domain is already taken.')
      } else res.redirect('/dashboard?page=domain&error=Incorrect Password.');
      return;
    });
  } else res.redirect('/dashboard?page=domain&error=Password and domain are required.');
  return;
});

module.exports = router;
