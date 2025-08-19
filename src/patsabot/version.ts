// Copyright (c) 2021 Patsagorn Y.
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { readFileSync } from "node:fs";

const readJson = (path: string) => {
	return JSON.parse(readFileSync(path, "utf8"));
};
const path = (path: string) => new URL(path, import.meta.url).pathname;

/** @type {string} */
export const version = readJson(path("../../package.json")).version;
/** @type {string} */
export const mwnVersion = readJson(path("../../package.json")).dependencies.mwn;
