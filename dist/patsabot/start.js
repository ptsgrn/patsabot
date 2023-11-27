import { loggerDir, schedule } from './config.js';
import ExpressStatusMonitor from 'express-status-monitor';
import { JobsManager } from './jobsmanager.js';
import baselogger from './logger.js';
import bodyParser from 'body-parser';
import express from 'express';
import { join } from 'path';
import { credentials } from './config.js';
import { resolveRelativePath } from './utils.js';
import { timingSafeEqual } from 'crypto';
import cors from 'cors';
const logger = baselogger.child({
  script: 'jobrunner',
});
if (!Array.isArray(schedule)) {
  logger.log('error', "'tasks' is not define in schedule.json or not an array");
}
const app = express();
const jobs = new JobsManager({
  timezone: 'Asia/Bangkok',
  ignoreError: true,
  autostart: true,
});
const apiGuard = (req, res, next) => {
  const key = req.get('x-api-key');
  if (!key) return res.status(400).send('bad request');
  if (
    !timingSafeEqual(
      Buffer.from(key),
      Buffer.from(credentials.botAPIAccessToken)
    )
  )
    return res.status(401).send('unauthorized');
  next();
};
jobs.addJobs(schedule);
const apiRoute = express.Router();
apiRoute.get('/job', (req, res) => {
  const jobList = jobs.listJobsSerialized();
  res.status(200).send(jobList);
});
apiRoute.options('/job', (req, res) => {
  res.status(200).send('OK');
});
apiRoute.post('/testapikey', (req, res) => {
  const key = req.get('x-api-key');
  if (!key) return res.status(400).send('bad request');
  timingSafeEqual(Buffer.from(key), Buffer.from(credentials.botAPIAccessToken))
    ? res.status(200).send('OK')
    : res.status(401).send('unauthorized');
});
// stream realtime logs
apiRoute.get('/logs', (req, res) => {
  res.writeContinue();
  const stream = baselogger.stream({ start: -1 });
  stream.on('data', (chunk) => {
    res.write(chunk);
  });
});
apiRoute.use(apiGuard);
apiRoute.get('/job/:jobname', (req, res) => {
  const { jobname } = req.params;
  const job = jobs.job(jobname);
  if (!job) return res.status(404).send('not found');
  res.status(200).send({
    name: jobname,
    status: job.running ? 'active' : 'inactive',
    last: job.last?.toISOString() ?? 'none',
    next: job.next.toISO(),
  });
});
apiRoute.post('/job/:jobname/:action', (req, res) => {
  const { jobname, action } = req.params;
  const job = jobs.job(jobname);
  if (!job) return res.status(404).send('not found');
  if (!['start', 'stop'].includes(action))
    return res.status(400).send('bad request');
  if (action === 'start') job.cron.start();
  else job.cron.stop();
  res.status(200).send('OK');
});
apiRoute.get('/job/:jobname/log', (req, res) => {
  const { jobname } = req.params;
  const job = jobs.job(jobname);
  if (!job) return res.status(404).send('not found');
  res.status(200).sendFile(join(loggerDir, `${jobname}.log`));
});
app.use(cors());
app.use(ExpressStatusMonitor());
app.use(bodyParser.json());
app.use('/logs', express.static(join(loggerDir)));
app.use('/api', apiRoute);
app.get('/job/:jobname/:get', (req, res) => {
  const { jobname, get } = req.params;
  const job = jobs.job(jobname);
  if (!job || !['next', 'last'].includes(get))
    return res.status(200).send({
      schemaVersion: 1,
      label: jobname,
      message: 'not found',
      color: 'gray',
    });
  res.status(200).send({
    schemaVersion: 1,
    label: `${get} run`,
    message:
      get === 'next'
        ? `${job.next.toRelative()} at ${job.next.toISO()}`
        : `${job.last?.toISOString() ?? '<no data>'}`,
    color: job.running ? 'green' : 'gray',
  });
});
app.get('/job/:jobname', (req, res) => {
  const { jobname } = req.params;
  const job = jobs.job(jobname);
  if (!job)
    return res.status(200).send({
      schemaVersion: 1,
      label: jobname,
      message: 'not found',
      color: 'gray',
    });
  res.status(200).send({
    schemaVersion: 1,
    label: jobname,
    message: job.running ? 'active' : 'inactive',
    color: job.running ? 'green' : 'gray',
  });
});
app.all('/ping', (req, res) => {
  res.status(200).send('OK');
});
app.get(
  '*',
  express.static(resolveRelativePath(import.meta.url, '../../web/dist'))
);
app.use((req, res) => {
  res.status(404).send('not found');
});
app.listen(process.env.PORT ?? 3000, () => {
  console.log(`app listening on port ${process.env.PORT ?? 3000}`);
});
