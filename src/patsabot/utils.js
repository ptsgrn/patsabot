/* eslint-disable no-undef */
// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import 'cejs'
import 'cejs/application/net/wiki/parser.js'
import moment from 'moment'
import 'moment/locale/th.js'
import {
  resolve,
  dirname
} from 'path'
import {
  fileURLToPath
} from 'url'
import {
  readFileSync
} from 'node:fs'

// Only god know why this is necessary.
/** @type {Promise<?>} */
export const parse = CeL.wiki.parser
export const parser = CeL.wiki.parse
moment.locale('th')
export const DateTime = moment()
export const mm = moment

/**
 * Get relative path and return absolute path of file from current file
 * @param {ImportMeta} importMeta - import.meta.url
 * @param {string | string[]} path relative path to destination
 * @returns {string} absolute path to destination
 */
export function resolveRelativePath(importMeta, path) {
  return resolve(dirname(fileURLToPath(importMeta ??
    import.meta.url)), path)
}

/**
 * Parse json content in file.
 * @param {string} absolutePath absolute path to file
 * @returns {JSON} JSON object of file
 */
export function parseJsonFile(absolutePath) {
  try {
    return JSON.parse(readFileSync(absolutePath))
  } catch (error) {
    return {}
  }
}

/**
 * 
 * @param {*} array array to flatten
 * @returns flattened array
 */
export function flatten(array) {
  return array.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])
}

/**
 * Clone object
 * @param {Object} obj object to clone
 * @returns {Object} cloned object
 */
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}