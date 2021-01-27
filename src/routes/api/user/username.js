const { Router, json, urlencoded } = require('express');
const router = Router();

const slowDown = require("express-slow-down");

const bcrypt = require('bcrypt');

router.use(json());
router.use(urlencoded({ extended: true }));
router.use(slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 5,
  delayMs: 700,
}));

router.post('/api/user/username', async (req, res) => {
  const password = req.body.password;
  const username = req.body.username;
  if (password && username) {
    bcrypt.compare(password, req.session.userData.authentication.password).then(async e => {
      if (e) {
        try {
          req.session.userData.authentication.username = username;
          await req.app.server.models.UserModel.updateOne({ id: req.session.userData.id }, req.session.userData);
          req.app.server.logger.debug('Updated user', req.session.userData.id, 'username');
        } catch (err) {
          req.app.server.logger.error('Error occured when changing', req.session.userData.id, 'password');
          req.app.server.logger.error(err);
          res.redirect('/dashboard?page=username&error=Internal Server Error');
          return;
        }
        req.app.server.logger.log(`Changed ${req.session.userData.id}'s username`);
        res.redirect('/dashboard?page=username&success=Username successfully updated to: ' + username);
      } else res.redirect('/dashboard?page=username&error=Incorrect password.');
      return;
    });
  } else res.redirect('/dashboard?page=username&error=Password and username are required.');
  return;
});

module.exports = router;
