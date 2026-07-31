import { Transform } from 'node:stream'

export default new Transform({
  writableObjectMode: true,
  transform(event, encoding, callback) {
    if (event.type === 'test:pass') return callback(null, '.')
    if (event.type === 'test:fail') return callback(null, 'X')
    callback()
  }
})
