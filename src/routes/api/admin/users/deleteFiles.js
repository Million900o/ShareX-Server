const { Router, json, urlencoded } = require('express');
const router = Router();

const passwordAuthentication = require('../../../../middleware/passwordAuthentication.js');

router.use(json());
router.use(urlencoded({ extended: true }));

router.get('/api/admin/deletefiles/:id', passwordAuthentication, async (req, res) => {
  if(['owner', 'admin'].includes(req.session.userData.info.user_type)) {
    const id = req.params.id;
    if (id) {
      const userData = await req.app.server.models.UserModel.findOne({ id: id });
      if (userData) {
        // TODO: change it so its like not shit (spamming api)
        const files = await req.app.server.models.FileModel.find({ 'info.uploader': userData.id });
        await req.app.server.models.UserModel.updateOne({ id: id }, { 'stats.uploads': 0 });
        res.redirect('/admin?success=Files successfully deleted');
        files.forEach(async file => {
          await req.app.server.models.FileModel.deleteOne(file);
          await process.f.redis.del('files.' + file.id);
          await req.app.server.storage.delFile(file.node.file_id, file.node.node_id);
          return;
        });
      } else res.redirect('/login?error=No user found with the id: ' + id + '.');
    } else res.redirect('/admin?error=No ID was given for login.');
  } else res.render('pages/error.ejs', { user: req.session.userData, error: 404, message: 'Page not found' });
  return;
});

module.exports = router;
