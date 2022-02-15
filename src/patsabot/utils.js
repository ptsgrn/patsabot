/* eslint-disable no-undef */
// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import 'cejs'
import 'cejs/application/net/wiki/parser.js'
import moment from 'moment'
import 'moment/locale/th.js'
import { resolve, dirname, isAbsolute } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'node:fs'

// Only god know why it alternately named
export const parse = CeL.wiki.parser
export const parser = CeL.wiki.parse
moment.locale('th')
export const DateTime = moment()
export const mm = moment

/**
 * Get relative path and return absolute path of file from current file
 * @param {ImportMeta.url} importMeta - import.meta.url
 * @param {string | string[]} path relative path to file
 * @returns {string} absolute path to file
 */
export function resolveRelativePath(importMeta, path) {
  return resolve(dirname(fileURLToPath(importMeta ?? import.meta.url)), path)
}

/**
 * Parse json content in file.
 * @param {string} absolutePath absolute path to file
 * @returns {} JSON object of file
 */
export function parseJsonFile(absolutePath) {
  try {
    return JSON.parse(readFileSync(absolutePath))
  } catch (error) {
    return {}
  }
}