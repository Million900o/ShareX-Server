const { Router } = require('express');
const router = Router();

const passwordAuthentication = require('../middleware/passwordAuthentication.js');

router.get('/admin', passwordAuthentication, async (req, res, next) => {
  if(['owner', 'admin'].includes(req.session.userData.info.user_type)) {
    const users = await req.app.server.models.UserModel.find();
    res.render('pages/admin.ejs', { user: req.session.userData, page: req.query.page, error: req.query.error, success: req.query.success, users: users } );
  } else next();
  return;
});

module.exports = router;
