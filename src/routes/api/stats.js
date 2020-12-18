/*
    The router for showing stats about memory and caching
*/
const { Router, json, urlencoded } = require('express');
const router = Router();

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
});
router.use(limiter);

router.get('/', async (req, res) => {
  let cachedFiles = Object.keys(req.app.cache.files).length
  let cachedUrls = Object.keys(req.app.cache.urls).length

  let mem = {};
  Object.entries(process.memoryUsage()).map(e => mem[e[0]] = Math.round(e[1] / 1024 / 1024 * 10) / 10 + "MB");

  return res.status(200).json({
    cached_files: cachedFiles,
    cached_urls: cachedUrls,
    mem: mem
  });
});

module.exports = router;
