import { execSync } from 'child_process'
import { createHmac, timingSafeEqual } from 'crypto'
const PORT = 3000
import express from 'express'
import bodyParser from 'body-parser'

function isSigOk(request, secret) {
  const signature = request.headers['X-Hub-Signature-256']
  if (!signature) {
    return false
  }
  const expectedSignature = 'sha256=' +
        createHmac('sha256', secret)
          .update(JSON.stringify(request.body))
          .digest('hex')
  console.log(expectedSignature)
  const a = Buffer.from(signature)
  const b = Buffer.from(expectedSignature)
  return timingSafeEqual(a, b)
}

let server = express()
server.use(bodyParser.raw())
console.assert(process.env.HOOK_SECRET, 'HOOK_SECRET is not set: '+ process.env.HOOK_SECRET)
server.post('/hook', (req, res) => {
  console.log(req.body)
  if (isSigOk(req, process.env.HOOK_SECRET)) {
    console.log('ok')
    execSync('git pull')
    res.send('ok')
    return
  }
  res.status(401).send('forbidden')
})

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})
