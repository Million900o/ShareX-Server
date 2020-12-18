/*
    The router for user sign up
*/
const { passwordSaltRounds, domain, flakeMID } = require('../../../config.json');

const { Router, json, urlencoded } = require('express');

const { saveUser, getUserFromName } = require('../../../mongo');
const { userAPIPOST } = require('../../../util/logger');
const { hash } = require('bcrypt');
const { createKey } = require('../../../util');
const flake = new (require('flakeid'))({
  mid: flakeMID,
});

const router = Router();

router.use(json());
router.use(urlencoded({ extended: false }));

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 25,
});
router.use(limiter);

router.post('/', async (req, res) => {
  let username = req.body.username.toLowerCase();
  let password = req.body.password;
  let passwordCheck = req.body.confirmPassword;
  if (password !== passwordCheck)
    return res.redirect('/signup?error=Passwords did not match');

  if (!username || !password)
    return res.redirect('/signup?error=Please include a username and password');

  let userCheck = await getUserFromName(username);
  if (userCheck) return res.redirect('/signup?error=User with that username already exists');

  password = await hash(password, passwordSaltRounds);

  let userObject = {
    key: await createKey(),
    name: username,
    password: password,
    userType: 'default',
    uploads: 0,
    redirects: 0,
    discord: 'none',
    id: flake.gen(),
    uploadSize: 0,
    createdAt: new Date(),
    subdomain: username,
    domain: domain,
  };

  let userData = await saveUser(userObject);

  userAPIPOST(userData.name, userData.key, req.ip);

  res.cookie('authentication', userData.key, { expire: 360000 + Date.now() });
  return res.redirect('/dashboard');
});

module.exports = router;
