import CronJobsManager from 'cron-job-manager';
const jobs = new CronJobsManager('heartbeat', '0,15,30,45 * * * *', () => {
    console.log('I\'m still alive!');
}, {
    start: true
});
jobs.add('afccat', '* * * * *', () => {
    console.log('running!');
}, {
    start: true
});
console.log(`${jobs}`);
