exports.inflate = function (data, len) {
  return Module.inflate(data, len)
}

exports.aesEnc = function (data, key) {
  return Module.aesEnc(data, key)
}
