// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const log = require('./logger')

class ErrGen extends Error {
  constructor(message) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    log.log('error', '%s: %s', this.name, message)
  }
}

class ScriptNotFound extends ErrGen {
  constructor (message) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
  }
}

class Skipped extends ErrGen {
  constructor (message) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
  }
}

module.exports = {
  ScriptNotFound,
  Skipped
}