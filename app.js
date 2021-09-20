require('dotenv').config();
const fs = require('fs')
const {createHash} = require('crypto')

const Koa = require('koa')
const Cors = require('@koa/cors')
const Router = require('@koa/router')
const Body = require('koa-body')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
const jwt = require('jsonwebtoken')
const FormData = require('form-data')

const {
  PORT = 3000,
  LICENSE,
  PRIVATE_KEY_PATH,
  SECRET_PASSPHRASE,
  COMMON_CHECK_ENDPOINT,
} = process.env

const privateKey = fs.readFileSync(PRIVATE_KEY_PATH)

const hashFile = file => createHash('sha256').update(file).digest('hex')
const signJwt = payload => jwt.sign(payload, {
  key       : privateKey,
  passphrase: SECRET_PASSPHRASE,
}, { algorithm: 'RS512' })

const router = new Router().post('/api/v1/verify', async context => {
  const { request: { files: { file } } } = context
  const requestId = context.get('Request-ID')
  const fileBuffer = fs.readFileSync(file.path)
  const fileHash = await hashFile(fileBuffer)
  const authorization = signJwt(fileHash)
  const formData = new FormData()

  console.log('===>requestId', requestId);
  console.log('===>fileBuffer', fileBuffer);
  console.log('===>fileHash', fileHash);
  console.log('===>authorization', authorization);

  formData.append('file', fileBuffer, {
    name    : 'file',
    filename: 'encryptedFile',
  })

  console.log('===>formData', formData);

  const response = await fetch(COMMON_CHECK_ENDPOINT, {
    method : 'POST',
    body   : formData,
    headers: {
      'Api-Key'      : LICENSE,
      'Authorization': authorization,
      'Request-ID'   : requestId,
      ...formData.getHeaders(),
    },
    timeout: 15000,
  })

  context.body = await response.json()
  console.log('===>  context.body',   context.body);
})

new Koa()
  .use(Cors())
  .use(Body({ multipart: true }))
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(PORT, () => console.log('🥐 App running', PORT ))
