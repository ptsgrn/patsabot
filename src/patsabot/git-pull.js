import { createServer } from 'http'
import { execSync } from 'child_process'
import { createHmac } from 'crypto'
const PORT = 3000

// server create
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  if (req.url !== '/hook') return res.end('Not found')

  const { headers, method, url } = req
  let body = []
  req.on('error', (err) => {
    console.error(err)
  }).on('data', (chunk) => {
    body.push(chunk)
  }).on('end', () => {
    body = Buffer.concat(body).toString()
    // BEGINNING OF NEW STUFF
    res.on('error', (err) => {
      console.error(err)
    })
    res.statusCode = 200
    const hmac = createHmac('sha1', 'secret')
    hmac.update(JSON.stringify(body))
    const digest = hmac.digest('hex')
    if (headers['x-hub-signature'] !== `sha1=${digest}`) {
      res.statusCode = 403
      res.end('forbidden')
      return
    }
    res.end(execSync('git pull ').toString())
  })
})
server.listen(PORT)
console.log(`Server is running on PORT: ${PORT}`)
