require('cejs')
const Wikiapi = require('wikiapi')
const log = require('./logger')('templates')

const wikitext = `
{{กึ่งล็อก}}
{{Short description|fuckin god}}
{{กล่องข้อมูล ประเทศ
| native_name = {{lang|ar|دولة الكويت}} <small>{{ar icon}}</small>
| conventional_long_name = รัฐคูเวต
| common_name = คูเวต
| image_flag = Flag of Kuwait.svg
| image_coat = Coat of Arms of Kuwait-2.svg
| image_map = KWT orthographic.svg
| map_caption = ที่ตั้งของประเทศคูเวต (แดง) บน[[คาบสมุทรอาหรับ]]
| national_motto = For Kuwait (เพื่อคูเวต)
| national_anthem = ''[[เพลงชาติคูเวต]]'' <center>[[ไฟล์:National anthem of Kuwait (instrumental).ogg]]</center>
| official_languages = [[ภาษาอาหรับ]]
| capital = [[คูเวตซิตี]]
| latd = 29 |latm=22 |lats=11|latNS=N |longd=47 |longm=58 |longs=42|longEW=E
| largest_city = [[คูเวตซิตี]]
| government_type = [[รัฐเดี่ยว]] [[ราชาธิปไตยภายใต้รัฐธรรมนูญ]]<ref name=cia>{{cite web |url=https://www.cia.gov/library/publications/the-world-factbook/geos/ku.html |title=Kuwait |website=[[The World Factbook]] |publisher=[[Central Intelligence Agency]] |date=10 April 2015 |url-status=live |archiveurl=https://web.archive.org/web/20140702040108/https://www.cia.gov/library/publications/the-world-factbook/geos/ku.html |archivedate=2 July 2014 }}</ref>
| leader_title1 = [[รายพระนามเจ้าผู้ครองรัฐคูเวต|เจ้าผู้ครองรัฐ]]
| leader_title2 = [[มกุฎราชกุมาร]]
| leader_title3 = นายกรัฐมนตรี
| leader_name1 = [[นาวาฟ อัลอะห์มัด อัลญาบิร อัศเศาะบาห์]]
| leader_name2 = [[เจ้าชายมิชาล อัลอะห์มัด อัลญาบริ อัศเศาะบาห์]]
| leader_name3 = [[เศาะบาห์ อัลคัลอิด อัศเศาะบาห์]]
| area_rank = 153
| area_magnitude = 1 E10
| area_km2 = 17,820
| area_sq_mi = 6,880 <!-- Do not remove per [[WP:MOSNUM]] -->
| percent_water = น้อยมาก
| population_estimate = 2,985,000
| population_estimate_rank = 137
| population_estimate_year = 2552
| population_census =
  | population_census_year =
  | population_density_km2 = 37
| population_density_sq_mi = 339 <!-- Do not remove per [[WP:MOSNUM]] -->
  | population_density_rank = 57
| GDP_PPP_year = 2560
| GDP_PPP = $ 302.529 พันล้าน
| GDP_PPP_rank =
  | GDP_PPP_per_capita = $ 69,669
| GDP_PPP_per_capita_rank =
  | GDP_nominal_year = 2560
| GDP_nominal = $ 118.271 พันล้าน
| GDP_nominal_rank =
  | GDP_nominal_per_capita = $ 27,236
| GDP_nominal_per_capita_rank =
  | sovereignty_type = [[เอกราช|ได้รับเอกราช]]
  | established_event1 = จาก [[สหราชอาณาจักร]]
  | established_date1 = [[19 มิถุนายน]] [[พ.ศ. 2504]]
  | Gini_year =
  | Gini =
  | HDI_year = 2559
  | HDI = {{increase}} 0.800
  | HDI_rank = 51st
  | HDI_category = <font color="green">สูงมาก</font>
  | currency = [[ดีนาร์คูเวต]]
| currency_code = KWD
| country_code =
  | time_zone =
  |drives_on = ขวามือ
  | utc_offset = +3
  | time_zone_DST =
  | utc_offset_DST = +4
  | cctld = [[.kw]]
  | calling_code = 965
  | footnotes =
  | dd
  }}

'''คูเวต''' ({{lang-ar|الكويت}}) หรือชื่อทางการคือ '''รัฐคูเวต''' ({{lang-ar|دولة الكويت}}) เป็นประเทศปกครองโดย[[เจ้าผู้ครองรัฐ]]ที่มีขนาดเล็กและอุดมไปด้วยทรัพยากรน้ำมัน ตั้งอยู่ในภูมิภาค[[เอเชียตะวันตกเฉียงใต้]] ริมชายฝั่ง[[อ่าวเปอร์เซีย]] มีพรมแดนทางใต้ติดกับ[[ประเทศซาอุดีอาระเบีย]] และพรมแดนทางเหนือติดกับ[[ประเทศอิรัก]]
`

const template_parser = {
  template: function (wikitext, name) {
    let template = {}
    let parsed = CeL.wiki.parse(wikitext)
    parsed.forEach((t)=>{
      if (t.name !== name) return
      t.forEach((t)=>{
        if (!t.key) return
        template[t.key] = t[2].toString()
      })
    })
    return template
  }
}

console.log(template_parser.template(wikitext,'กล่องข้อมูล ประเทศ'))

module.exports = template_parser

