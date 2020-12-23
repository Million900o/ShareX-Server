// Make IPs look nice
module.exports.parseIP = async ip => {
  ip = ip.replace('::1', '127.0.0.1').replace('::ffff:', '').replace('localhost', '127.0.0.1')
  return ip;
}