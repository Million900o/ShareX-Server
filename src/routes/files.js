const { Router } = require('express');
const router = Router();

const passwordAuthentication = require('../middleware/passwordAuthentication.js');

router.get('/files/all', passwordAuthentication, async (req, res) => {
  const page = req.query.p ? req.query.p : 0;
  const files = (await req.app.server.models.FileModel.find({ 'info.uploader': req.session.userData.id })).sort(
    (a, b) => new Date(a.UploadedAt) - new Date(b.UploadedAt),
  ).reverse().slice(page * 100, 100 + (page * 100));
  res.render('pages/files.ejs', { user: req.session.userData, files: files, page: page, secure: (await req.app.server.models.DomainModel.findOne({ domain: req.session.userData.domain.domain }))?.secure });
  return;
});

router.get('/files/:id', async (req, res) => {
  const fileID = req.params.id;
  if (fileID) {
    const domain = req.domain;
    let subdomain = req.subdomains.join(' ');
    subdomain = subdomain ? subdomain : '@';
    const databaseID = domain.subdomains[subdomain] + ':' + fileID;
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
