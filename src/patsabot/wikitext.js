/**
 * Parse wikitext into a JavaScript object and convert back to wikitext.
 * (Hopefully it work :cry:)
 * @author Patsagorn Y. (https://w.wiki/JSB)
 * @license MIT (https://opensource.org/licenses/MIT)
 * @date 2022-03-27
 */

export class Wikitext {
  #wikitext
  #parsed
  constructor(wikitext) {
    this.#wikitext = wikitext
    // this.#parsed = this.#parse()
  }
  get templates() {
    return this.#wikitext.match(/{}/gmis)
  }
}

let examplepagecontent = `{{:MediaWiki:Proofreadpage_index_template
|ประเภท=วารสาร
|ชื่อ=[[ประกาศ เรื่อง ให้ข้าราชการในพระองค์ฝ่ายทหารพ้นจากตำแหน่งฯ ลงวันที่ 21 ตุลาคม 2562|ประกาศ เรื่อง ให้ข้าราชการในพระองค์ฝ่ายทหารพ้นจากตำแหน่ง ถอดฐานันดรศักดิ์และยศทหาร ตลอดจนเรียกคืนเครื่องราชอิสริยาภรณ์ทุกชั้นตรา ลงวันที่ 21 ตุลาคม 2562]]
|ภาษา=th
|เล่ม=ราชกิจจานุเบกษา, เล่ม 136, ตอน 55 ข, หน้า 1–2
|ผู้สร้างสรรค์={{ลผส|วชิรเกล้าเจ้าอยู่หัว, พระบาทสมเด็จพระ}}
|ผู้แปล=
|บรรณาธิการ=
|ผู้วาดภาพประกอบ=
|สถานศึกษา=
|ผู้เผยแพร่=[[สำนักเลขาธิการคณะรัฐมนตรี]]{{ดัชนีที่ผสานแล้ว|yes}}
|สถานที่=กรุงเทพฯ
|ปี=2562
|รหัส=
|ISBN=
|OCLC=
|LCCN=
|BNF_ARK=
|ARC=
|ที่มา=pdf
|ภาพ=1
|ความคืบหน้า=V
|หน้า=<pagelist
1 = ๑
2 = ๒
/>
|จำนวน=
|หมายเหตุ=
|Width=
|Css=
|Header={{หัวราชกิจจานุเบกษา|{{{pagenum}}}|๑๓๖|๕๕ ข|๒๑ ตุลาคม ๒๕๖๒}}
|Footer=
}}
[[หมวดหมู่:ดัชนีประกาศ]]`

console.log(new Wikitext(examplepagecontent).templates)