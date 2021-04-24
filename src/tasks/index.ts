interface JobsOptiobs {
  name: string
  path?: string
  timeout?: Number | Object | string | boolean
  interval?: Number | Object | string
  date?: Date
  cron?: string
  hasSeconds?: boolean
  cronValidate?: Object
  closeWorkerAfterMs?: Number
  worker?: Object
  outputWorkerMetadata?: boolean
}

type Jobs = JobsOptiobs[] | string[]

const jobs: Jobs = [
  'task1',
]

export default jobs
