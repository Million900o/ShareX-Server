/*
    The router for redirecting
*/
const { Router } = require('express');
const { resolve } = require('path');

const { addURLView, getURL, delURL } = require('../mongo');
const { urlGET, urlDELETE } = require('../util/logger');
const { browserAuth } = require('../middleware/authentication.js');

const router = Router();

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 15,
});
router.use(limiter);

router.get('/:id', async (req, res) => {
  let URLID = req.params.id;
  if (!URLID) return res.status(404).json({
    error: 'No URL ID included.',
  });

  let URLData;
  if (req.app.cache.urls[URLID]) {
    URLData = req.app.cache.urls[URLID]
  } else {
    URLData = await getURL(URLID);
    if (!URLData) return res.status(404).json({
      error: 'URL not found.',
    });
    req.app.cache.urls[URLID] = urlData
  }

  await addURLView(URLID);

  urlGET(req.ip, URLData.redirect);

  return res.status(302).redirect(URLData.redirect);
});

router.get('/delete/:id', browserAuth, async (req, res) => {
  let urlID = req.params.id;
  if (!urlID) return res.status(404).sendFile(resolve('src/server/public/404/index.html'));

  let urlData = await getURL(urlID);
  if (urlData === null) return res.status(404).sendFile(resolve('src/server/public/404/index.html'));

  if (urlData.uploader !== req.userData.name && !req.userData.owner)
    return res.status(401).redirect('/?error=You_do_not_have_permissions_to_do_this.');

  if (req.app.cache.urls[urlID]) {
    delete req.app.cache.urls[urlID]
  }

  await delURL(urlID);

  urlDELETE(urlID, req.userData.key, req.ip);

  return res.status(200).redirect('/?success=Successfully_deleted_the_url_redirect.');
});

module.exports = router;
