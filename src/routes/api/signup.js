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
      const userCheck = await req.app.server.models.UserModel.findOne({ 'authentication.username': username });
      if(!userCheck) {
        bcrypt.hash(password, req.app.server.authentication.passwords.saltRounds).then(async hash => {
          const userID = Date.now();
          await req.app.server.models.UserModel.create({
            id: userID,
            authentication: {
              token: random.generateRandomString(req.app.server.authentication.tokens.length),
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
            domain: {
              subdomain: username,
              domain: req.app.server.defaults.domain,
            },
          });
          const userData = await req.app.server.models.UserModel.findOne({ id: userID });
          req.session.userData = userData;
          const domain = await req.app.server.models.DomainModel.findOne({ domain: req.session.userData.domain.domain });
          domain.subdomains[username] = userID;
          res.redirect('/dashboard');
        });
      } else res.redirect('/signup?error=User already exists.');
    } else res.redirect('/signup?error=Passwords don\'t match.');
  } else res.redirect('/signup?error=All fields are required.');
  return;
});

module.exports = router;
