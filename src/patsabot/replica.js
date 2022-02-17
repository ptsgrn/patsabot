
import {
  replicaConfig
} from './config.js'
import {
  Sequelize
} from 'sequelize'

const sequelize = new Sequelize(replicaConfig.dbURL)

export default replica
