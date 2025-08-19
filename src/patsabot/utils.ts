/* eslint-disable no-undef */
/* @ts-expect-error */
// Copyright (c) 2021 Patsagorn Y.
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import "moment/locale/th.js";

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { init } from "@paralleldrive/cuid2";
import moment from "moment";

// // Only god know why this is necessary.
// /** @type {Promise<?>} */
// export const parse = CeL.wiki.parser
// export const parser = CeL.wiki.parse
moment.locale("th");
export const DateTime = moment();
export const mm = moment;

/**
 * Get relative path and return absolute path of file from current file
 * @param {ImportMeta} importMeta - import.meta.url
 * @param {string | string[]} path relative path to destination
 * @returns {string} absolute path to destination
 */
export function resolveRelativePath(importMeta, path: string) {
	return resolve(dirname(fileURLToPath(importMeta ?? import.meta.url)), path);
}

/**
 * Parse json content in file.
 * @param {string} absolutePath absolute path to file
 * @returns {JSON} JSON object of file
 */
export function parseJsonFile(absolutePath) {
	try {
		return JSON.parse(readFileSync(absolutePath).toString());
	} catch (_err) {
		return {};
	}
}

/**
 *
 * @param {*} array array to flatten
 * @returns flattened array
 */
export function flatten(array) {
	return array.reduce(
		(a, b) => a.concat(Array.isArray(b) ? flatten(b) : b),
		[],
	);
}

/**
 * Clone object
 * @param {Object} obj object to clone
 * @returns {Object} cloned object
 */
export function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * CUID generator
 */
export const cuid = init({ length: 10 });
