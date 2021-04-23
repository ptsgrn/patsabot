import Debug from 'debug'
import config, { PackageJsonFile } from './config'
import jsonfile from 'jsonfile'
let pkg: PackageJsonFile = jsonfile.readFileSync('package.json')
const debug = Debug(pkg.name)
export default debug
