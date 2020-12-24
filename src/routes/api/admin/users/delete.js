const { Router, json, urlencoded } = require('express');
const router = Router();

const passwordAuthentication = require('../../../../middleware/passwordAuthentication.js');

router.use(json());
router.use(urlencoded({ extended: true }));

router.get('/api/admin/delete/:id', passwordAuthentication, async (req, res) => {
  if(['owner', 'admin'].includes(req.session.userData.info.user_type)) {
    const id = req.params.id;
    if (id) {
      const userData = await req.app.server.models.UserModel.findOne({ id: id });
      if (userData) {
        // TODO: change it so its like not shit (spamming api)
        let files;
        try {
          files = await req.app.server.models.FileModel.find({ 'info.uploader': userData.id });
          req.app.server.logger.debug('Retrived user', userData.id, 'file');
        } catch (err) {
          req.app.server.logger.error('Error occured when getting all files from', userData.id);
          req.app.server.logger.error(err);
          res.redirect('/admin?error=Internal Server Error');
          return;
        }
        try {
          await req.app.server.models.UserModel.deleteOne({ id: id });
          req.app.server.logger.log('Deleted user', userData.id);
          res.redirect('/admin?success=Deleted ' + userData.authentication.username);
        } catch (err) {
          req.app.server.logger.error('Error occured when deleting', userData.authentication.username);
          req.app.server.logger.error(err);
          res.redirect('/admin?error=Internal Server Error');
          return;
        }
        files.forEach(async file => {
          try {
            await req.app.server.models.FileModel.deleteOne(file);
            req.app.server.logger.debug('Deleted file', file.id, 'from the DB');
          } catch(err) {
            req.app.server.logger.error('Error occured when deleting', file.id, 'from the DB');
            req.app.server.logger.error(err);
            return;
          }
          try {
            await process.f.redis.del('files.' + file.id);
            req.app.server.logger.debug('Deleted file', file.id, 'from the cache');
          } catch (err) {
            req.app.server.logger.error('Error occured when removing', file.id, 'from cache');
            req.app.server.logger.error(err);
            return;
          }
          try {
            await req.app.server.storage.delFile(file.node.file_id, file.node.node_id);
            req.app.server.logger.debug('Deleted file', file.id, 'from storage node', file.node.node_id);
          } catch (err) {
            req.app.server.logger.error('Error occured when deleting', file.id, 'from storage node', file.node.node_id);
            req.app.server.logger.error(err);
            return;
          }
        });
      } else res.redirect('/login?error=No user found with the id: ' + id + '.');
    } else res.redirect('/admin?error=No ID was given for login.');
  } else res.render('pages/error.ejs', { user: req.session.userData, error: 404, message: 'Page not found' });
  return;
});

module.exports = router;
