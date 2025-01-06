import { DatabaseReportBot } from '@scripts/database-report';

export default class LongStubs extends DatabaseReportBot {
  reportPage = "บทความโครงขนาดยาว"
  reportDescription = 'รายการที่มีแม่แบบโครงแต่มีขนาดยาว (จำกัดจำนวน 1000 อันดับแรก)'
  reportFrequency = '@weekly' // cron schedule
  reportFrequencyText = 'สัปดาห์ละครั้ง'

  
}