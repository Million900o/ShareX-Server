require('colors');

module.exports.urlGET = async (ip, redirect) => {
  ip = await parseIP(ip);
  let msg = `${'[GET]'.green} ${'REDIRECTED'.bgMagenta.black} ${redirect.toString().bgGreen.black} ${ip.toString().bgWhite.black}`;
  console.log(msg);
};

module.exports.urlPOST = async (url, ip, key) => {
  ip = await parseIP(ip);
  let msg = `${'[POST]'.cyan} ${'SAVED URL'.bgRed.black} ${url.toString().bgBlue.black} ${key.toString().bgYellow.black} ${ip.toString().bgWhite.black}`;
  console.log(msg);
};

module.exports.urlAPIGET = async (id, ip) => {
  ip = await parseIP(ip);
  let msg = `${'[GET]'.green} ${'SENT URL DATA'.bgMagenta.black} ${id.toString().bgBlue.black} ${ip.toString().bgWhite.black}`;
  console.log(msg);
};

module.exports.urlDELETE = async (id, key, ip) => {
  ip = await parseIP(ip);
  let msg = `${'[GET]'.green} ${'DELETED URL'.bgRed.black} ${id.toString().bgBlue.black} ${key.toString().bgYellow.black} ${ip.toString().bgWhite.black}`;
  console.log(msg);
};

module.exports.filePOST = async (name, ip, key) => {
  ip = await parseIP(ip);
  let msg = `${'[POST]'.cyan} ${'SAVED FILE'.bgRed.black} ${name.toString().bgBlue.black} ${key.toString().bgYellow.black} ${ip.toString().bgWhite.black}`;
  console.log(msg);
};

module.exports.fileAPIGET = async (name, ip) => {
  ip = await parseIP(ip);
  let msg = `${'[GET]'.green} ${'SENT FILE DATA'.bgMagenta.black} ${name.toString().bgBlue.black} ${ip.toString().bgWhite.black}`;
  console.log(msg);
};

module.exports.filesALLGET = async (key, ip)  => {
  ip = await parseIP(ip);
  let msg = `${'[GET]'.green} ${'SENT ALL FILES'.bgMagenta.black} ${key.toString().bgYellow.black} ${ip.toString().bgWhite.black}`;
  console.log(msg);
}

module.exports.fileGET = async (name, ip) => {
  ip = await parseIP(ip);
  let msg = `${'[GET]'.green} ${'SENT FILE'.bgMagenta.black} ${name.toString().bgGreen.black} ${ip.toString().bgWhite.black}`;
  console.log(msg);
};

module.exports.fileDELETE = async (name, key, ip) => {
  ip = await parseIP(ip);
  let msg = `${'[DELETE]'.cyan} ${'DELETED FILE'.bgRed.black} ${name.toString().bgBlue.black} ${key.toString().bgYellow.black} ${ip.toString().bgWhite.black}`;
  console.log(msg);
};

module.exports.userAPIGET = async (name, key, ip) => {
  ip = await parseIP(ip);
  let msg = `${'[GET]'.cyan} ${'SENT USER DATA'.bgMagenta.black} ${name.toString().bgBlue.black} ${key.toString().bgYellow.black} ${ip.toString().bgWhite.black}`;
  console.log(msg);
};

module.exports.userAPIGETUPLOADS = async (name, key, ip) => {
  ip = await parseIP(ip);
  let msg = `${'[GET]'.cyan} ${'SENT USER UPLOADS'.bgMagenta.black} ${name.toString().bgBlue.black} ${key.toString().bgYellow.black} ${ip.toString().bgWhite.black}`;
  console.log(msg);
};

module.exports.userAPIPOST = async (name, key, ip) => {
  ip = await parseIP(ip);
  let msg = `${'[GET]'.cyan} ${'CREATED NEW USER'.bgMagenta.black} ${name.toString().bgBlue.black} ${key.toString().bgYellow.black} ${ip.toString().bgWhite.black}`;
  console.log(msg);
};

module.exports.userAPIMANAGEPOST = async (type, name, key, ip) => {
  ip = await parseIP(ip);
  let msg = `${'[GET]'.cyan} ${type.toString().toUpperCase().bgMagenta.black} ${name.toString().bgBlue.black} ${key.toString().bgYellow.black} ${ip.toString().bgWhite.black}`;
  console.log(msg);
};

module.exports.log = (message, ...args) => {
  let msg = `${'[LOG]'.green} ${message.toString().white} ${args.length > 0 ? args.join(' ').white : ''}`;
  console.log(msg);
};

module.exports.warn = (message, ...args) => {
  let msg = `${'[WARN]'.yellow} ${message.toString().white} ${args.length > 0 ? args.join(' ').white : ''}`;
  console.log(msg);
};

module.exports.error = (message, ...args) => {
  let msg = `${'[ERROR]'.red} ${message.toString().white} ${args.length > 0 ? args.join(' ').white : ''}`;
  console.log(msg);
};

module.exports.debug = (message, ...args) => {
  let msg = `${'[DEBUG]'.magenta} ${message.toString().white} ${args.length > 0 ? args.join(' ').white : ''}`;
  console.log(msg);
};

let parseIP = async ip => ip.replace('::ffff:', '').replace('::1', '127.0.0.1').replace('localhost', '127.0.0.1');
module.exports.parseIP = parseIP