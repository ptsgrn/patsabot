# PatsaBot
[![Bot flags status](https://img.shields.io/static/v1?style=flat-square&logo=wikipedia&label=Bot%20flags&message=Approved&color=darkgreen)][botuserpage] 

**[ผู้ใช้:PatsaBot][botuserpage]** ([คุย][botusertalk] | [ส่วนร่วม][botcontribs])

A Wikipedia bot operated by [Patsagorn Y.][patsagorn].

## Status

<!-- status table -->
| task  | description                    |                                                             status                                                              | previous/next                                                                                                                                                                                                                                                                      |
| :---: | ------------------------------ | :-----------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  #1   | สร้างหน้าหมวดหมู่สำหรับ AfC แบบรายวัน | ![afccat](https://img.shields.io/endpoint?color=blue&style=flat-square&url=https://patsabot.toolforge.org/badge/afccat/running) | ![afccat last run](https://img.shields.io/endpoint?color=blue&style=flat-square&url=https://patsabot.toolforge.org/badge/afccat/previous)<br>![afccat next run](https://img.shields.io/endpoint?color=blue&style=flat-square&url=https://patsabot.toolforge.org/badge/afccat/next) |
<!-- status table end -->

## Setup

### Prerequisites
- [bun](https://bun.sh/) for running the bot

```bash
mv example.toml config.toml
bun i
```
Edit `config.toml` to add your bot credentials and other configurations.
Then try running the bot with `bun . run login` to see if it works.

## Bot logs
ไฟล์ log ของบอตถูกจัดการโดย สามารถเข้าถึงได้ที่ <https://tools-static.wmflabs.org/patsabot/logs/> ความหมายแต่ละไฟล์คือดังนี้
```
error.log                - ถ้ามี error ที่ไม่ร้ายแรงมากจะถูกบันทึกไว้ที่นี่
exceptions.log           - ถ้ามี error ที่ร้ายแรงจะถูกบันทึกไว้ที่นี่
rejections.log           - Unhandled rejections จะถูกบันทึกไว้ที่นี่
output-20250108.log.gz   - ไฟล์ log ของการทำงานในวันที่ 8 มกราคม 2025 ถูกบีบอัดด้วย gzip (เพราะไม่ใช่ไฟล์ปัจจุบัน)
output-20250109.log      - ไฟล์ log ของการทำงานในวันที่ 9 มกราคม 2025 (ไฟล์ปัจจุบันไม่ถูกบีบอัด)
```
(ให้วันนี้เป็นวันที่ 9 มกราคม 2025)

### อ่านและค้นหา Logs

ไฟล์ log เป็นไฟล์ [jsonlines](https://jsonlines.org/) ซึ่งสามารถใช้คำสั่ง `jq` ในการค้นหาข้อมูลได้ง่าย ๆ โดยแต่ละบรรทัดประกอบด้วยข้อมูลคคร่าว ๆ ดังนี้:

```json
{
  // ระดับของข้อความ (error, warn, info, debug)
  "level":"info",
  // ข้อความ
  "message":"Scheduled afccat (@daily)",
  // รหัสการรัน (อ่านเพิ่มด้านล่าง)
  "rid":"uhpbka4gq77s7gflxmewqtrc",
  // ชื่อของ script ที่ทำงาน
  "script":"afccat",
  // เวลาที่เกิดเหตุการณ์
  "timestamp":"2025-01-08T16:19:50.013Z"
}
```

คำอธิบายเพิ่มเติม:
- `rid` เป็นรหัสการรันเฉพาะแต่ละครั้ง เช่นสคริปต์ afccat รันวันนี้อาจเป็นรหัสนี้ แต่หากรันใหม่อีกครั้งจะเป็นรหัสอื่น แต่การันตีว่ารหัสเดียวกันจะมีที่มาจากสคริปต์เดียวกัน
- `script` คือชื่อของสคริปต์ที่ทำงาน สามารถใช้ `bun . run <script name>` และใช้ค่าจากฟิลด์นี้ได้

ใช้ [jq](https://jqlang.github.io/jq/) และ [gunzip](https://www.geeksforgeeks.org/gunzip-command-in-linux-with-examples/) ในการค้นหาข้อมูลในไฟล์ log ได้ดังนี้

```bash
$ curl https://tools-static.wmflabs.org/patsabot/logs/output-20250109.log | jq '"\\(.timestamp) \\(.rid) \\(.level): \\(.message)"'
# Outputs:
# > "2025-01-08T17:00:00.954Z oud5v38ftzotx5j0tzww4e6e info: done"
# > "2025-01-08T17:01:45.670Z m45s34rgfg890p1id86x75mk info: Scheduled update-status (@daily)"
```

กรณีที่ไฟล์ log ถูกบีบอัดด้วย gzip ให้ใช้ `gunzip` ก่อนจึงจะใช้ `jq` ได้
```bash
$ curl https://tools-static.wmflabs.org/patsabot/logs/output-20250108.log.gz | gunzip | jq '"\\(.timestamp) \\(.rid) \\(.level): \\(.message)"'
# Outputs:
# > "2025-01-08T16:19:50.013Z uhpbka4gq77s7gflxmewqtrc info: Scheduled afccat (@daily)"
# > "2025-01-08T16:19:50.204Z s7d32ito7amy68e35obscljh info: Scheduled linked-user-ns0 (@weekly)"
```

สำหรับดูเฉพาะ log ที่มี `rid` = `oud5v38ftzotx5j0tzww4e6e`
```bash
curl https://tools-static.wmflabs.org/patsabot/logs/output-20250109.log | jq 'select(.rid == "oud5v38ftzotx5j0tzww4e6e") | "\\(.timestamp) \\(.rid) \\(.level): \\(.message)"'
# Outputs:
# > "2025-01-08T17:00:00.265Z oud5v38ftzotx5j0tzww4e6e info: Creating categories for categories [\"หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/09 มกราคม 2025\",\"หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/มกราคม 2025\",\"หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/2025\"]"
# > "2025-01-08T17:00:00.416Z oud5v38ftzotx5j0tzww4e6e error: articleexists: The page you tried to create has been created already. หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/มกราคม 2025"
```
```bash
curl https://tools-static.wmflabs.org/patsabot/logs/output-20250108.log.gz | gunzip | jq 'select(.rid == "oud5v38ftzotx5j0tzww4e6e") | "\\(.timestamp) \\(.rid) \\(.level): \\(.message)"'
# Outputs:
# > "2025-01-08T16:48:32.323Z oud5v38ftzotx5j0tzww4e6e info: Scheduled linked-email-ns0 (@weekly)"
```


## Deploy

```bash
ssh toolforge -t "become patsabot -- git -C www/js/ pull"
ssh toolforge -t "become patsabot -- toolforge webservice node18 restart"
```


[patsagorn]: https://w.wiki/JSB
[botuserpage]: https://w.wiki/4S53
[botusertalk]: https://w.wiki/4S54
[botcontribs]: https://w.wiki/4S55
