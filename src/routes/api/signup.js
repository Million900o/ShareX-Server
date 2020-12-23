const { Router, json, urlencoded } = require('express');
const router = Router();

const random = require('../../utils/random.js');
const bcrypt = require('bcrypt');

router.use(json());
router.use(urlencoded({ extended: true }));

router.post('/api/signup', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const passwordCheck = req.body.confirmPassword;
  const email = req.body.email;
  if (username && password && passwordCheck && email) {
    if (password === passwordCheck) {
      let userCheck;
      try {
        userCheck = await req.app.server.models.UserModel.findOne({ 'authentication.username': username });
      } catch (err) {
        req.app.server.logger.error('Error occured when checking a user with the name:', username, 'exists');
        req.app.server.logger.error(err);
        res.redirect('/signup?error=Internal Server Error.');
        return;
      }
      if (!userCheck) {
        bcrypt.hash(password, req.app.server.authentication.passwords.saltRounds).then(async hash => {
          const userID = req.app.server.flake.gen();
          const subdomain = username.toLowerCase();
          try {
            await req.app.server.models.UserModel.create({
              id: userID,
              authentication: {
                token: Buffer.from(userID).toString('base64') + '.' + random.generateRandomString(req.app.server.authentication.tokens.length),
                username: username,
                password: hash,
                email: email,
              },
              stats: {
                uploads: 0,
                redirects: 0,
                upload_size: 0,
              },
              info: {
                created_date: new Date(),
                user_type: req.app.server.defaults.userType,
              },
              domain: subdomain + '.' + req.app.server.defaults.domain
            });
          } catch (err) {
            req.app.server.logger.error('Error occured when creating new user');
            req.app.server.logger.error(err);
            res.redirect('/signup?error=Internal Server Error.');
            return;
          }
          let userData;
          try {
            userData = await req.app.server.models.UserModel.findOne({ id: userID });
          } catch (err) {
            req.app.server.logger.error('Error occured when getting', userID, 'from DB');
            req.app.server.logger.error(err);
            res.redirect('/home');
            return;
          }
          req.session.userData = userData;
          req.server.logger.log('Created new user', req.session.userData.id);
          res.redirect('/dashboard');
          return;
        });
      } else res.redirect('/signup?error=User already exists.');
    } else res.redirect('/signup?error=Passwords don\'t match.');
  } else res.redirect('/signup?error=All fields are required.');
  return;
});

module.exports = router;
