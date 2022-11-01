import { loggerDir, schedule } from './config.js';
import baselogger from './logger.js';
import { JobsManager } from './jobsmanager.js';
import express from 'express';
import ExpressStatusMonitor from 'express-status-monitor';
import bodyParser from 'body-parser';
import selfUpdate from './selfupdater.js';
import { join } from 'path';
const logger = baselogger.child({
    script: 'jobrunner'
});
if (!Array.isArray(schedule)) {
    logger.log('error', '\'tasks\' is not define in schedule.json or not an array');
}
try {
    const app = express();
    const jobs = new JobsManager({
        timezone: 'Asia/Bangkok',
        ignoreError: true,
        autostart: true,
    });
    jobs.addJobs(schedule);
    app.use(ExpressStatusMonitor());
    app.use(bodyParser.json());
    app.use('/logs', express.static(join(loggerDir)));
    app.post('/hook', selfUpdate);
    app.get('/job/:jobname/:get', (req, res) => {
        const { jobname, get } = req.params;
        const job = jobs.job(jobname);
        if (!job || !['next', 'last'].includes(get))
            return res.status(200).send({
                "schemaVersion": 1,
                "label": jobname,
                "message": "not found",
                "color": 'gray'
            });
        res.status(200).send({
            "schemaVersion": 1,
            "label": `${get} run`,
            "message": get === 'next'
                ? `${job.next.toRelative()} at ${job.next.toISO()}`
                : `${job.last?.toISOString() ?? '<no data>'}`,
            "color": job.running ? 'green' : 'gray'
        });
    });
    app.get('/job/:jobname', (req, res) => {
        const { jobname } = req.params;
        const job = jobs.job(jobname);
        if (!job)
            return res.status(200).send({
                "schemaVersion": 1,
                "label": jobname,
                "message": "not found",
                "color": 'gray'
            });
        res.status(200).send({
            "schemaVersion": 1,
            "label": jobname,
            "message": job.running ? 'active' : 'inactive',
            "color": job.running ? 'green' : 'gray'
        });
    });
    app.listen(process.env.PORT ?? 3000, () => {
        console.log(`app listening on port ${process.env.PORT ?? 3000}`);
    });
}
catch (err) {
    logger.log('error', err);
}
