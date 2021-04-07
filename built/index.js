"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// const config = require('./ainalbot/config').userInfo()
let log = require('./ainalbot/logger')('main');
var config = require('./config.json');
const CronJob = require('cron').CronJob;
console.error('Before job instantiation');
const job = new CronJob('* * * * * *', function () {
    const d = new Date();
    log.error('At Ten Minutes:', d);
});
log.info('After job instantiation');
job.start();
