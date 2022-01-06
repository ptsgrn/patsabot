// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { readFileSync } from 'fs'

const readJson = (path) => {
  return JSON.parse(readFileSync(path, 'utf8'))
}
const path = (path) => new URL(path, import.meta.url).pathname

export const version = readJson(path('../../package.json')).version
export const mwnVersion = readJson(path('../../package.json')).dependencies.mwn