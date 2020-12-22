const { Router, json, urlencoded } = require('express');
const router = Router();

const bcrypt = require('bcrypt');

router.use(json());
router.use(urlencoded({ extended: true }));

router.post('/api/user/username', async (req, res) => {
  const password = req.body.password;
  const username = req.body.username;
  if (password && username) {
    bcrypt.compare(password, req.session.userData.authentication.password).then(async e => {
      if (e) {
        req.session.userData.authentication.username = username;
        await req.app.server.models.UserModel.updateOne({ id: req.session.userData.id }, req.session.userData);
        res.redirect('/dashboard?page=username&success=Username successfully updated to: ' + username);
      } else res.redirect('/dashboard?page=username&error=Incorrect password.');
      return;
    });
  } else res.redirect('/dashboard?page=username&error=Password and username are required.');
  return;
});

module.exports = router;
