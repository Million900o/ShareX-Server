const { Router, json, urlencoded } = require('express');
const router = Router();

const bcrypt = require('bcrypt');

router.use(json());
router.use(urlencoded({ extended: true }));

router.post('/api/user/domain', async (req, res) => {
  const password = req.body.password;
  const domain = encodeURIComponent(req.body.domain);
  if (password && domain) {
    bcrypt.compare(password, req.session.userData.authentication.password).then(async e => {
      if (e) {
        let userCheck;
        try {
          userCheck = await req.app.server.models.UserModel.findOne({ domain: domain });
        } catch (err) {
          req.app.server.logger.error('Error occured when checking DB for', domain)
          req.app.server.logger.error(err);
          res.redirect('/dashboard?page=domain&error=Internal Server Error');
          return;
        }
        if (!userCheck) {
          try {
            await req.app.server.models.UserModel.updateOne(req.session.userData, { domain: req.session.userData.domain });
            req.session.userData.domain = domain;
          } catch(err) {
            req.app.server.logger.error('Error occured when updating', req.session.userData.id, 'domain')
            req.app.server.logger.error(err);
            res.redirect('/dashboard?page=domain&error=Internal Server Error');
            return;
          } 
          req.server.logger.log(`Changed ${req.session.userData.id}\'s domain to:`, domain)
          res.redirect('/dashboard?page=domain&success=Domain successfully updated to: ' + domain + '.');
          return;
        } else res.redirect('/dashboard?page=domain&error=Domain is already taken.');
      } else res.redirect('/dashboard?page=domain&error=Incorrect Password.');
      return;
    });
  } else res.redirect('/dashboard?page=domain&error=Password and domain are required.');
  return;
});

module.exports = router;
