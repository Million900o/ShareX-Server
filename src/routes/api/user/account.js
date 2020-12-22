const { Router, json, urlencoded } = require('express');
const router = Router();

const bcrypt = require('bcrypt');

router.use(json());
router.use(urlencoded({ extended: true }));

router.post('/api/user/account', async (req, res) => {
  const password = req.body.password;
  const string = req.body.str;
  const stringCheck = req.body.strCheck;
  if (string === stringCheck) {
    bcrypt.compare(password, req.session.userData.authentication.password).then(async e => {
      if (e) {
        await req.app.server.models.UserModel.deleteOne({ id: req.session.userData.id });
        // TODO: change it so its like not shit (spamming api)
        const files = await req.app.server.models.FileModel.find({ 'info.uploader': req.session.userData.id });
        req.session.destroy();
        res.redirect('/home?success=Account successfully deleted');
        files.forEach(async file => {
          await req.app.server.models.FileModel.deleteOne(file);
          await process.f.redis.del('files.' + file.id);
          await req.app.server.storage.delFile(file.node.file_id, file.node.node_id);
          return;
        });
      } else res.redirect('/dashboard?page=files&error=Incorrect password.');
      return;
    });
  } else res.redirect('/dashboard?page=files&error=Strings don\' match.');
});

module.exports = router;
