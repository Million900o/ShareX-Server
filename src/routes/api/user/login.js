/*
    The router for user login
*/
const { Router, json, urlencoded } = require('express');

const { getUserFromName } = require('../../../mongo');
const { compare } = require('bcrypt');
const { warn, parseIP, log } = require('../../../util/logger');

const router = Router();

router.use(json());
router.use(urlencoded({ extended: false }));

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
});
router.use(limiter);

router.post('/', async (req, res) => {
  let username = req.body.username.toLowerCase();
  let password = req.body.password;
  if (!username || !password) {
    warn(`Failed Login From`, await parseIP(req.ip));
    return res.redirect('/login?error=Please use a valid username and password');
  }

  let userData = await getUserFromName(username);
  if (!userData) {
    warn(`Failed Login From`, await parseIP(req.ip));
    return res.redirect('/login?error=Please use a valid username and password');
  }
  let passwordsMath = await compare(password, userData.password);
  if (!passwordsMath) {
    warn(`Failed Login From`, await parseIP(req.ip));
    return res.redirect('/login?error=Please use a valid username and password');
  }

  log(`Logged in`, userData.name, 'From', await parseIP(req.ip));

  res.cookie('authentication', userData.key, { expire: 360000 + Date.now() });
  return res.redirect(req.query.r || '/dashboard');
});

module.exports = router;
