const { Router, json, urlencoded } = require('express');
const router = Router();

const slowDown = require("express-slow-down");

const bcrypt = require('bcrypt');

router.use(json());
router.use(urlencoded({ extended: true }));
router.use(slowDown({
  windowMs: 10 * 60 * 1000,
  delayAfter: 30,
  delayMs: 700,
}));

router.post('/api/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (username && password) {
    let userData;
    try {
      userData = await req.app.server.models.UserModel.findOne({ 'authentication.username': username });
      req.app.server.logger.debug('Retrieved user', username, 'from the DB');
    } catch (err) {
      req.app.server.logger.error('Error occured when retreiving', username, 'from the DB');
      req.app.server.logger.erro(err);
      req.redirect('/login?error=Internal Server Error');
      return;
    }
    if (userData) {
      bcrypt.compare(password, userData.authentication.password).then(e => {
        if (e) {
          req.app.server.logger.log('Authenticated', userData.authentication.username);
          req.session.userData = userData;
          res.redirect(req.query.r ? req.query.r : '/');
          return;
        } else {
          req.app.server.logger.warn('Failed authentication for', userData.authentication.username);
          res.redirect('/login?error=Incorrect username or password.');
          return;
        }
      });
    } else res.redirect('/login?error=Incorrect username or password.');
  } else res.redirect('/login?error=Username and Password are required.');
  return;
});

module.exports = router;
