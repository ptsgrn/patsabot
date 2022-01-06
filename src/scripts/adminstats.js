// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const pageLayout = `; {{abbr|ข้อมูลเมื่อ|เวลาที่เข้าถึงข้อมูล}}: <<dated>> {{Time ago|<<dated>>|tz_offset=yes}}
{{tocright}}
=== ลบ ===
<<deletetable>>

=== กู้คืน ===
<<undeletetable>>

=== บล็อก ===
<<blocktable>>

=== ปลดบล็อก ===
<<unblocktable>>

=== ล็อกหน้า ===
<<lockpagetable>>

=== ปลดล็อกหน้า ===
<<unlockpagetable>>

=== การแก้ไข ===
<<edittable>>

=== แก้ไขสิทธิ์ผู้ใช้ ===
<<userightedittable>>

=== รวมประวัติหน้า ===
<<historymergetable>>

=== ตารางรวม ===
<<alltable>>
`
let config = {
  page: 'ผู้ใช้:PatsaBot/สถิติผู้ดูแลระบบ',
  pageLayout
}

async function main({ bot, log}) {
  await 
}

export const id = 'adminstats'
export const name = 'admins statistics'
export const desc = `อัปเดตสถิติของผู้ดูแลระบบที่หน้า ${config.page}`
export const run = main