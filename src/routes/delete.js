const { Router } = require('express');
const router = Router();

const passwordAuthentication = require('../middleware/passwordAuthentication.js')

router.get('/delete/:key', passwordAuthentication, async (req, res) => {
  const deletionKey = req.params.key;
  if (deletionKey) {
    const databaseID =  req.session.userData.id + ':' + deletionKey;
    const fileData = await req.app.server.models.FileModel.findOne({ deletion_key: databaseID });
    if (fileData) {
      await req.app.server.models.FileModel.deleteOne(fileData);
      await process.f.redis.del('files.' + fileData.id);
      await req.app.server.storage.delFile(fileData.node.file_id, fileData.node.node_id);
      req.session.userData.stats.uploads--;
      await req.app.server.models.UserModel.updateOne({ id: req.session.id }, { 'stats.uploads': req.session.userData.stats.uploads });
      res.render('pages/error.ejs', { message: 'File Successfully deleted', error: 200, user: req.session.userData });
      return;
    } else res.render('pages/error.ejs', { message: 'File Not Found', error: 404, user: req.session.userData });
  } else res.render('pages/error.ejs', { message: 'File Not Found', error: 404, user: req.session.userData });
  return;
});

module.exports = router;
