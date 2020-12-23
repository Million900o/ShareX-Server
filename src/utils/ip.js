// Make IPs look nice
module.exports.parseIP = async ip => ip.replace('::ffff:', '').replace('::1', '127.0.0.1').replace('localhost', '127.0.0.1');
