import http from 'node:http'

export class HTTPHelper {
  private server
  constructor(server: http.Server) {
    this.server = server
  }
  healthcheck() {
    this.server.on('request', (req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok' }))
      }
    })
  }
  listen(opts: { port: number; hostname: string }, handler: () => void) {
    this.server.listen(opts.port, opts.hostname, () => {
      handler()
    })
  }
}
