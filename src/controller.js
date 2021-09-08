const fs = require('fs')
const jwt = require('jsonwebtoken')
const {createHash} = require('crypto')

const {
  LICENSE, // this is your license
  PRIVATE_KEY_PATH, // path to your private key that will be used for signing
  SECRET_PASSPHRASE, // secret that was used when created key pair
  COMMON_CHECK_ENDPOINT // https://common-check-api.prod.affinity-project.org/api/v1
} = process.env

const sha256 = (data) => {
  return createHash('sha256').update(data).digest('hex')
}

const hashFromFile = (file) => {
  const data = fs.readFileSync(file.path, 'binary')
  const fileBinary = Buffer.from(data, 'binary')

  return sha256(fileBinary)
}

const signJwt = async (objectToSign) => {
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH)
  const token = jwt.sign(objectToSign, { key: privateKey, passphrase: SECRET_PASSPHRASE }, { algorithm: 'RS512' })

  return token
}

// NOTE: Expose this method as endpoint for the widget
//       requestId - from Header
module.exports.verify = async (req, res) => {
  const {encryptedFile} = req.body
  const {requestId} = req.headers
  const objectToSign = hashFromFile(encryptedFile)
  const jwt = await signJwt(objectToSign)

  const formData = new FormData()
  formData.append('file', encryptedFile)
console.log(formData)
  const options = {
    method: 'POST',
    body: formData,
    headers: {
      'Api-Key': LICENSE,
      'Authorization': jwt,
      'Request-ID': requestId
    },
    timeout: 15000
  }

  const response = await fetch(`${COMMON_CHECK_ENDPOINT}/verify`, options)

  return res.status.json(response)
}

