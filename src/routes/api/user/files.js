const { Router, json, urlencoded } = require('express');
const router = Router();

const slowDown = require("express-slow-down");

const bcrypt = require('bcrypt');

router.use(json());
router.use(urlencoded({ extended: true }));
router.use(slowDown({
  windowMs: 10 * 60 * 1000,
  delayAfter: 30,
  delayMs: 700,
}));

router.post('/api/user/files', async (req, res) => {
  const password = req.body.password;
  const string = req.body.str;
  const stringCheck = req.body.strCheck;
  if(string === stringCheck) {
    bcrypt.compare(password, req.session.userData.authentication.password).then(async e => {
      if(e) {
        // TODO: change it so its like not shit (spamming api)
        let files;
        try {
          files = await req.app.server.models.FileModel.find({ 'info.uploader': req.session.userData.id });
          req.app.server.logger.debug('Retrieved user', req.session.userData.id, 'files from the DB');
        } catch (err) {
          req.app.server.logger.error('Error occured when getting all files from', req.session.userData.id);
          req.app.server.logger.error(err);
          res.redirect('/dashboard?error=Internal Server Error');
          return;
        }
        try {
          await req.app.server.models.UserModel.updateOne({ id: req.session.userData.id }, { 'stats.uploads': 0 });
          req.session.userData.stats.uploads = 0;
          req.app.server.logger.log(`Deleted ${req.session.userData.id}'s files`);
          res.redirect('/dashboard?success=Files queued for deletion.');
        } catch (err) {
          req.app.server.logger.error('Error occured when setting', req.session.userData.id, 'uploads to 0');
          req.app.server.logger.error(err);
          res.redirect('/dashboard?error=Internal Server Error');
          return;
        }
        files.forEach(async file => {
          try {
            await req.app.server.models.FileModel.deleteOne(file);
            req.app.server.logger.debug('Deleted file', file.id, 'from the DB');
          } catch(err) {
            req.app.server.logger.error('Error occured when deleting', file.id, 'from the DB');
            req.app.server.logger.error(err);
          }
          try {
            await process.f.redis.del('files.' + file.id);
            req.app.server.logger.debug('Deleted file', file.id, 'from the cache');
          } catch (err) {
            req.app.server.logger.error('Error occured when removing', file.id, 'from cache');
            req.app.server.logger.error(err);
          }
          try {
            await req.app.server.storage.delFile(file.node.file_id, file.node.node_id);
            req.app.server.logger.debug('Deleted file', file.id, 'from node', file.node.node_id);
          } catch (err) {
            req.app.server.logger.error('Error occured when deleting', file.id, 'from storage node', file.node.node_id);
            req.app.server.logger.error(err);
          }
        });
      } else res.redirect('/dashboard?page=files&error=Incorrect password.');
      return;
    });
  } else res.redirect('/dashboard?page=files&error=Strings don\' match.');
});

module.exports = router;
