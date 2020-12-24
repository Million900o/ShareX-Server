const { Router, json, urlencoded } = require('express');
const router = Router();

const bcrypt = require('bcrypt');

router.use(json());
router.use(urlencoded({ extended: true }));

router.post('/api/user/password', async (req, res) => {
  const currentPassword = req.body.pwdNow;
  const newPassword = req.body.newPwd;
  const newPasswordCheck = req.body.newPwdCheck;
  if (currentPassword && newPassword && newPasswordCheck) {
    bcrypt.compare(currentPassword, req.session.userData.authentication.password).then(e => {
      if (e) {
        if (newPassword === newPasswordCheck) {
          bcrypt.hash(newPassword, req.app.server.authentication.passwords.saltRounds).then(async hash => {
            try {
              await req.app.server.models.UserModel.updateOne(req.session.userData, { 'authentication.password': hash });
            } catch (err) {
              req.app.server.logger.error('Error occured when changing', req.session.userData.id, 'password');
              req.app.server.logger.error(err);
              res.redirect('/dashboard?page=password&error=Internal Server Error');
              return;
            }
            req.session.userData.authentication.password = hash;
            req.server.logger.log(`Changed ${req.session.userData.id}'s password`);
            res.redirect('/dashboard?page=password&success=Password successfully updated!');
            return;
          });
        } else res.redirect('/dashboard?page=password&error=New passwords do not match.');
      } else res.redirect('/dashboard?page=password&error=Password is incorrect.');
      return;
    });
  } else res.redirect('/dashboard?page=password&error=Current password, new password, and new password conformation are required.');
  return;
});

module.exports = router;
