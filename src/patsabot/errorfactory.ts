// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import log from './logger.js'

class ErrGen extends Error {
  constructor(message) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    log.log('error', '%s: %s', this.name, message)
  }
}

export class ScriptNotFound extends ErrGen {
  constructor (message) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
  }
}
