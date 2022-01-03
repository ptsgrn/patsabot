/* eslint-disable no-undef */
// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import 'cejs'
import 'cejs/application/net/wiki/parser.js'
import moment from 'moment'
import 'moment/locale/th.js'

// Only god know why it alternately named
export const parse = CeL.wiki.parser
export const parser = CeL.wiki.parse
moment.locale('th')
export const DateTime = moment()