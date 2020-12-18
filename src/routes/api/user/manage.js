/*
    The router for user management
*/
const { passwordSaltRounds } = require('../../../config.json');

const { Router, json, urlencoded } = require('express');

const { delFile, addUserUpload, setUserPassword, setUserUsername,
  setUserSubDomain, getAllFiles, delUser, addUserUploadSize, setUserDomain, getUserFromSubDomain } = require('../../../mongo');
const { browserAuth } = require('../../../middleware/authentication');

const { unlinkSync, existsSync } = require('fs');
const { compare, hash } = require('bcrypt');
const { resolve } = require('path');

const router = Router();

router.use(json());
router.use(urlencoded({ extended: false }));

const rateLimit = require('express-rate-limit');
const { userAPIMANAGEPOST } = require('../../../util/logger');
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 8,
});
router.use(limiter);

router.post('/password', browserAuth, async (req, res) => {
  let currentPass = req.body.pwdNow;
  let newPass = req.body.newPwd;
  let newPassCheck = req.body.newPwdCheck;

  let userCheck = await compare(currentPass, req.userData.password);
  if (!userCheck) return res.redirect('/dashboard?page=password&error=Your password was incorrect');

  if (newPass !== newPassCheck)
    return res.redirect('/dashboard?page=password&error=Passwords did not match');

  await setUserPassword(req.userData.key, await hash(newPass, passwordSaltRounds));

  userAPIMANAGEPOST('USER UPDATED PASSWORD', req.userData.name, req.userData.key, req.ip);
  return res.redirect('/dashboard?page=password&success=Password updated successfully');
});

router.post('/username', browserAuth, async (req, res) => {
  let password = req.body.password;
  let username = req.body.newUsr.toLowerCase();

  let userCheck = await compare(password, req.userData.password);
  if (!userCheck) return res.redirect('/dashboard?page=username&error=Your password was incorrect');

  await setUserUsername(req.userData.key, username);

  userAPIMANAGEPOST('USER CHANGED USERNAME', `${req.userData.name} → ${username}`, req.userData.key, req.ip);
  return res.redirect('/dashboard?page=username&success=Username updated successfully');
});

router.post('/subdomain', browserAuth, async (req, res) => {
  let password = req.body.password;
  let subdomain = req.body.subdomain;

  let userCheck = await compare(password, req.userData.password);
  if (!userCheck) return res.redirect('/dashboard?page=subdomain&error=Your password was incorrect');

  let user2ndCheck = await getUserFromSubDomain(subdomain)
  if(user2ndCheck) return res.redirect('/dashboard?page=subdomain&error=This subdomain is already taken, please choose another one.')

  await setUserSubDomain(req.userData.key, subdomain);

  userAPIMANAGEPOST('USER CHANGED SUBDOMAIN', req.userData.name, req.userData.key, req.ip);

  return res.redirect('/dashboard?page=subdomain&success=Subdomain updated successfully');
});

router.post('/domain', browserAuth, async (req, res) => {
  let password = req.body.password;
  let domain = req.body.domain;

  let userCheck = await compare(password, req.userData.password);
  if (!userCheck) return res.redirect('/dashboard?page=subdomain&error=Your password was incorrect');

  await setUserDomain(req.userData.key, domain);

  userAPIMANAGEPOST('USER CHANGED DOMAIN', req.userData.name, req.userData.key, req.ip);

  return res.redirect('/dashboard?page=domain&success=Domain updated successfully');
});

router.post('/delete/files', browserAuth, async (req, res) => {
  let password = req.body.password;
  let string = req.body.str;
  let stringCheck = req.body.strCheck;

  let userCheck = await compare(password, req.userData.password);
  if (!userCheck) return res.redirect('/dashboard?page=files&error=Your password was incorrect');

  if (string !== stringCheck) return res.redirect('/dashboard?page=files&error=You did not type the correct string');

  let files = await getAllFiles(req.userData.id);
  files.forEach(async e => {
    let filePath = resolve(`${__dirname}/../../../../${e.path}`);
    await delFile(e.name);
    if (req.app.cache.files.find(ef => ef.name == e.name)) {
      req.app.cache.files.splice(req.app.cache.files.findIndex(ef => ef.name == e.name), 1)
    }
    if (existsSync(filePath))
      unlinkSync(filePath);
  });

  await addUserUploadSize(req.userData.key, -req.userData.uploadSize);
  await addUserUpload(req.userData.key, -req.userData.uploads);

  userAPIMANAGEPOST('USER DELETED ALL FILES', req.userData.name, req.userData.key, req.ip);

  res.redirect('/dashboard?page=files&success=Files successfully deleted');
});

router.post('/delete/account', browserAuth, async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let string = req.body.str;
  let stringCheck = req.body.strCheck;

  if (username !== req.userData.name) return res.redirect('/dashboard?page=account&error=Incorrect username given');

  let userCheck = await compare(password, req.userData.password);
  if (!userCheck) return res.redirect('/dashboard?page=account&error=Your password was incorrect');

  if (string !== stringCheck) return res.redirect('/dashboard?page=account&error=You did not type the correct string');

  let files = await getAllFiles(req.userData.id);
  files.forEach(async e => {
    let filePath = resolve(`${__dirname}/../../../../${e.path}`);
    await delFile(e.name);
    if (req.app.cache.files.find(ef => ef.name == e.name)) {
      req.app.cache.files.splice(req.app.cache.files.findIndex(ef => ef.name == e.name), 1)
    }
    if (existsSync(filePath))
      unlinkSync(filePath);
  });

  // Delete a user folder as well soon

  await delUser(req.userData.key);

  userAPIMANAGEPOST('USER DELETED ACCOUNT', req.userData.name, req.userData.key, req.ip);

  res.clearCookie('authentication');
  return res.redirect('/home?success=Account and files successfully deleted');
});

module.exports = router;
