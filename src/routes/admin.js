const { Router } = require('express');
const router = Router();

const passwordAuthentication = require('../middleware/passwordAuthentication.js');

router.get('/admin', passwordAuthentication, async (req, res, next) => {
  if(['owner', 'admin'].includes(req.session.userData.info.user_type)) {
    let users;
    try {
      users = await req.app.server.models.UserModel.find();
      req.app.server.logger.debug('Retrieved all users from the DB');
    } catch (err) {
      req.app.server.logger.error('Error occured when retreiving all users from DB');
      req.app.server.logger.error(err);
      res.render('pages/error.ejs', { message: 'Internal Server Error', error: 500, user: req.session.userData});
      return;
    }
    res.render('pages/admin.ejs', { user: req.session.userData, page: req.query.page, error: req.query.error, success: req.query.success, users: users } );
  } else next();
  return;
});

module.exports = router;
