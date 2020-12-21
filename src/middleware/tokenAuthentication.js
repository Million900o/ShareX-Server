const { Router } = require('express');
const router = Router();

const UserModel = require('../models/user.js');

router.use(async (req, res, next) => {
  if(req.session.userData) {
    next();
    return;
  }
  const token = req.headers.token;
  if(token) {
    const userData = await UserModel.findOne({ 'authentication.token': token });
    if(userData) {
      req.app.server.logger.log('Authenticated', userData.authentication.username);
      req.session.userData = userData;
      next();
      return;
    } else res.status(401).json({ success: false, message: 'Incorrect token provided.' });
  } else res.status(401).json({ success: false, message: 'No token provided.' });
  return;
});

module.exports = router;
