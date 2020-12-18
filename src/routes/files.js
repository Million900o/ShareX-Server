/*
    The router for getting a file
*/
const { Router } = require('express');
const { resolve } = require('path');
const { existsSync, readFileSync, unlinkSync, statSync } = require('fs');

const { delFile, getFile, addFileView, getAllFiles, addUserUploadSize, addUserUpload } = require('../mongo');
const { fileGET, fileDELETE, filesALLGET } = require('../util/logger');
const { browserAuth } = require('../middleware/authentication.js');
const fileExtArray = require('../util/highlightjs.json')

require('express-zip');

const router = Router();

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 4 * 60 * 1000,
  max: 200,
});
router.use(limiter);

function addToArray(obj, arr) {
  if (!arr.some(e => e.name === obj.name)) return arr.push(obj);
  else {
    let objNameArray = obj.name.split('.');
    let fileName = objNameArray.slice(0, objNameArray.length - 1).join(' ');
    if (fileName.includes('_')) {
      let num = parseInt(fileName.split('_')[fileName.split('_').length - 1]);
      fileName = `${fileName.split('_').slice(0, fileName.split('_').length - 1)}_${num + 1}`;
    } else fileName = `${fileName}_1`;
    let fileExt = objNameArray[objNameArray.length - 1];
    obj.name = `${fileName}.${fileExt}`;
    return addToArray(obj, arr);
  }
}

router.get('/download', browserAuth, async (req, res) => {
  let files = await getAllFiles(req.userData.id);
  let fileArray = [];
  files.forEach(e => {
    let obj = { path: resolve(`${__dirname}/../../${e.path}`), name: e.originalName };
    addToArray(obj, fileArray);
  });
  filesALLGET(req.userData.key, req.ip);
  return res.zip(fileArray, `files-${new Date().toLocaleDateString().replace(/\//g, '-')}.zip`);
});

router.get('/:name', async (req, res) => {
  let fileName = req.params.name;
  if (!fileName) return res.status(200).render('pages/404.ejs', { user: null, error: 'File Not Found', success: null });

  let fileData;
  if (req.app.cache.files[fileName]) {
    fileData = req.app.cache.files[fileName];
  } else {
    fileData = await getFile(fileName);
    if (!fileData) return res.status(200).render('pages/404.ejs', { user: null, error: 'File Not Found', success: null });
    req.app.cache.files[fileName] = fileData;
  }

  await addFileView(fileName);

  let filePath = resolve(`${__dirname}/../../${fileData.path}`);
  if (!existsSync(filePath)) return res.status(200).render('pages/404.ejs', { user: null, error: 'File Not Found', success: null });

  fileGET(fileName, req.ip);

  if (!fileExtArray.includes(fileName.split('.')[fileName.split('.').length - 1])) return res.sendFile(filePath);

  let data = readFileSync(filePath, 'utf8');

  return res.render('pages/md.ejs', {
    data: data, file: fileData, user: null,
  });
});

router.get('/delete/:name', browserAuth, async (req, res) => {
  let fileName = req.params.name;
  if (!fileName) return res.status(404).redirect('/?error=File does not exist.');

  let fileData = await getFile(fileName);
  if (fileData === null) return res.status(404).redirect('/?error=File does not exist.');

  if (fileData.uploader !== req.userData.id && !req.userData.owner)
    return res.status(401).redirect('/?error=You do not have permissions to do this.');

  if (req.app.cache.files[e.name]) {
    delete req.app.cache.files[e.name]
  }

  let filePath = resolve(`${__dirname}/../../${fileData.path}`);
  if (!existsSync(filePath))
    return res.status(401).redirect('/?error=File does not exist.');

  await addUserUploadSize(req.userData.key, -(statSync(filePath).size / 1024));
  await addUserUpload(req.userData.key, -1);
  await delFile(fileName);
  unlinkSync(filePath);

  fileDELETE(fileName, req.userData.key, req.ip);

  return res.status(200).redirect('/?success=Successfully deleted the file.');
});

module.exports = router;
