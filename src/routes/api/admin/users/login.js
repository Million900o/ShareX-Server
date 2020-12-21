const { Router, json, urlencoded } = require('express');
const router = Router();

const passwordAuthentication = require('../../../../middleware/passwordAuthentication.js');

router.use(json());
router.use(urlencoded({ extended: true }));

router.get('/api/admin/login/:id', passwordAuthentication, async (req, res) => {
  if(['owner', 'admin'].includes(req.session.userData.info.user_type)) {
    const id = req.params.id;
    if (id) {
      const userData = await req.app.server.models.UserModel.findOne({ id: id });
      if (userData) {
        req.session.userData = userData;
        res.redirect('/dashboard');
      } else res.redirect('/login?error=No user found with the id: ' + id + '.');
    } else res.redirect('/admin?error=No ID was given for login.');
  } else res.render('pages/error.ejs', { user: req.session.userData, error: 404, message: 'Page not found' });
  return;
});

module.exports = router;
