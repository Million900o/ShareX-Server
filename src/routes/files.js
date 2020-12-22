const { Router } = require('express');
const router = Router();

const fs = require('fs');
const path = require('path');

const passwordAuthentication = require('../middleware/passwordAuthentication.js');

router.get('/files/all', passwordAuthentication, async (req, res) => {
  const page = req.query.p ? req.query.p : 0;
  const files = (await req.app.server.models.FileModel.find({ 'info.uploader': req.session.userData.id })).sort(
    (a, b) => new Date(a.UploadedAt) - new Date(b.UploadedAt),
  ).reverse().slice(page * 100, 100 + (page * 100));
  res.render('pages/files.ejs', { user: req.session.userData, files: files, page: page, secure: req.app.server.defaults.secure });
  return;
});

router.get('/files/:id', async (req, res) => {
  const fileID = req.params.id;
  if (fileID) {
    const testPath = path.resolve('files/' + req.params.id);
    if(fs.existsSync(testPath)) return res.sendFile(testPath)
    const domain = req.domain;
    const databaseID = (await req.app.server.models.UserModel.findOne({ domain: domain })).id + ':' + fileID;
    const fileData = await req.app.server.models.FileModel.findOne({ id: databaseID });
    if (fileData) {
      await req.app.server.models.FileModel.updateOne(fileData, { 'stats.views': fileData.stats.views + 1 });
      const redisFile = await process.f.redis.get('files.' + databaseID);
      if (redisFile) {
        res.end(Buffer.from(JSON.parse(redisFile)), 'binary');
      } else {
        const file = await req.app.server.storage.getFile(fileData.node.file_id, fileData.node.node_id);
        if (fileData.info.size < 4 * 1024 * 1024)
          await process.f.redis.set('files.' + databaseID, JSON.stringify(file), 'EX', 60 * 60);
        res.end(file, 'binary');
      }
      return;
    } else res.render('pages/error.ejs', { message: 'File Not Found', error: 404, user: req.session.userData });
  } else res.render('pages/error.ejs', { message: 'File Not Found', error: 404, user: req.session.userData });
  return;
});

module.exports = router;
