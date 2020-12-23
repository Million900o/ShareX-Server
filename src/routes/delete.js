const { Router } = require('express');
const router = Router();

const passwordAuthentication = require('../middleware/passwordAuthentication.js');

router.get('/delete/:key', passwordAuthentication, async (req, res) => {
  const deletionKey = req.params.key;
  if (deletionKey) {
    const databaseID =  req.session.userData.id + ':' + deletionKey;
    let fileData;
    try {
      fileData = await req.app.server.models.FileModel.findOne({ deletion_key: databaseID });
    } catch (err) {
      req.app.server.logger.error('Error occured when getting', deletionKey, 'DB document');
      req.app.server.logger.error(err);
      res.render('pages/error.ejs', { message: 'Internal Server Error', error: 500, user: req.session.userData});
      return;
    }
    if (fileData) {
      try {
        await req.app.server.models.FileModel.deleteOne(fileData);
      } catch(err) {
        req.app.logger.error('Error occured when deleting', fileData.id, 'from the DB');
        req.app.logger.error(err);
        res.render('pages/error.ejs', { message: 'Internal Server Error', error: 500, user: req.session.userData});
        return;
      }
      try {
        await process.f.redis.del('files.' + fileData.id);
      } catch (err) {
        req.app.logger.error('Error occured when removing', fileData.id, 'from cache');
        req.app.logger.error(err);
      }
      try {
        await req.app.server.storage.delFile(fileData.node.file_id, fileData.node.node_id);
      } catch (err) {
        req.app.logger.error('Error occured when deleting', fileData.id, 'from storage node', fileData.node.node_id);
        req.app.logger.error(err);
      }
      req.session.userData.stats.uploads--;
      try {
        await req.app.server.models.UserModel.updateOne({ id: req.session.id }, { 'stats.uploads': req.session.userData.stats.uploads });
      } catch (err) {
        req.app.logger.error('Error occured when lowering', req.session.userData.id, 'uploads');
        req.app.logger.error(err);
      }
      res.render('pages/error.ejs', { message: 'File Successfully deleted', error: 200, user: req.session.userData });
      return;
    } else res.render('pages/error.ejs', { message: 'File Not Found', error: 404, user: req.session.userData });
  } else res.render('pages/error.ejs', { message: 'File Not Found', error: 404, user: req.session.userData });
  return;
});

module.exports = router;
