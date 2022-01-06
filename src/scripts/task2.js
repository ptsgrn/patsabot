import { getPageTranscluding } from '../patsabot/apis.js'
export const id = 'task2'
export const name = 'test task 2'
export const run = async function _run() {
  console.log(await getPageTranscluding('แม่แบบ:uw-ublock'))
}