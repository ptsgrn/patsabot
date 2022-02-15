// import bot from '../patsabot/bot.js'
import { diffChars } from 'diff'
import chalk from 'chalk'
let test = `
{{ฉบับร่างบทความ}}
<!-- เขียนข้อความสำหรับบทความของคุณด้านล่างบรรทัดนี้ ประโยคแรกควรเริ่มต้นด้วยหัวเรื่องของบทความของคุณที่อยู่ในอะพอสทรอฟีสามตัว (ตัวอย่างเช่น: '''ชื่อบทความ''' คือ...) -->สมคิด พุ่มพวง (อังกฤษ: somkid pumpuang ) หรือคิดเดอะริปเปอร์,เเจ็กเดอะริปเปอร์เมืองไทย เป็นชื่อของ[[ฆาตกรต่อเนื่อง]]ที่ก่อคดีฆาตกรรมหมอนวดเเละนักร้องคาเฟ่5ศพ เขาถูกจับกุมฐานฆ่าหมอนวดสาวใน จังหวัดบุรีรัมย์ในปี 2548 ต่อมาตำรวจพบข้อมูลการใช้โทรศัพท์มือถือของเหยื่อรายหนึ่ง ที่ถูกขโมยไปหลังโดนฆาตกรรม โทร.ออกจาก จ.ชัยภูมิตํารวจตามไปและได้เจอตัวนายสมคิดหนีมากบดานอยู่ นายสมคิดให้การรับสารภาพ 4 คดี ยกเว้นคดีฆ่า น.ส.พัชรีย์ ต่อมาศาลอุทรณ์เเละฎีกาตัดสินจำคุกตลอดชีวิตทั้ง5คดี สมคิด พุ่มพวงได้รับการลดโทษลงมาเรื่อยๆตามหลักเกณฑ์จากการที่ประพฤติตัวดี จนมีโทษเหลืออยู่ไม่ถึง 25 ปี เขาจึงถูกย้ายออกจากเรือนจำกลางบางขวาง กลับภูมิลำเนามาอยู่ที่เรือนจำหนองคาย ก่อนจะได้รับการปล่อยตัว โดยถูกจำคุกจริงรวมประมาณ 14 ปี <ref>[https://mgronline.com/onlinesection/detail/9620000120161 เผย “หลักทัณฑวิทยา” ลดโทษ “สมคิด พุ่มพวง” คุกตลอดชีวิตเหลือ 14 ปี ก่อนก่อเหตุซ้ำ]</ref> จนพ้นโทษในเดือนพฤษภาคม 2562 ต่อมาในวันที่15 ธันวาคม 2562  เขาได้ก่อเหตุฆาตกรรมหญิงวัย 51 ปี ที่ บ้านพักในอ.กระนวน จ.ขอนแก่น <ref name="thaipbs">[https://news.thaipbs.or.th/content/287119/ย้อนคดี "สมคิด พุ่มพวง" แจ็ค เดอะริปเปอร์เมืองไทย]</ref>วันที่17 ธันวาคม 2562 เขาถูกตำรวจจับกุมที่สถานีรถไฟปากช่องขณะนั่งรถไฟหลังจากมีพลเมืองดีเเจ้งว่าพบสมคิดบนรถไฟ<ref >[https://www.thairath.co.th/news/crime/1728698/ด่วน จับได้แล้ว "สมคิด พุ่มพวง" จนมุมบนรถไฟ]</ref>   วันที่ 2 เม.ย.64 ศาลจังหวัดขอนแก่นได้ตัดสินประหารชีวิตสมคิด พุ่มพวงคดีฆาตกรรมหญิงวัย 51 ปี ที่ บ้านพักในอ.กระนวน  <ref >[https://www.thairath.co.th/news/crime/2062148/ศาลประหารชีวิต "สมคิด พุ่มพวง" ฆาตกร 6 ศพ ชี้ไม่สำนึก-ขาดความเมตตา]</ref>
{{Infobox criminal
| name = สมคิด พุ่มพวง
| image_name = 
| image_caption = 
| birth_name = เเดง
| birth_date = พ.ศ. 2507
| birth_place = [[อำเภอทุ่งสง]] [[จังหวัดนครศรีธรรมราช]] [[ประเทศไทย]]
| death_date = 
| death_place = 
| resting_place = 
| known_for = เป็นฆาตกรต่อเนื่องที่ฆ่าหมอนวดเเละนักร้องคาเฟ่5ศพเเล้วก่อเหตุซ้ำ
| nationality =
| criminal_charge = ฆาตกรรมโดยเจตนา (ก่อเหตุครั้งเเรก)  ฆาตกรรมโดยไตร่ตรองไว้ก่อนโดยทรมานหรือโดยการกระทำทารุณโหดร้าย (ก่อเหตุซ้ำ)
| conviction_penalty = ถูกตัดสินจำคุกตลอดชีวิตภายหลังได้รับอภัยโทษลดโทษเหลือ13ปี(คดีฆ่าหมอนวดเเละนักร้องคาเฟ่ปี2548) คดียังไม่สิ้นสุด(คดีฆ่าเเม่บ้านโรงเเรมปี2562)
| conviction_status = 
| occupation = สามล้อรับจ้าง
| trial_start = 30 ม.ค.2548<ref name="thaipbs">[https://news.thaipbs.or.th/content/287119/ย้อนคดี "สมคิด พุ่มพวง" แจ็ค เดอะริปเปอร์เมืองไทย]</ref>
| trial_end =  
| victims = นางสาววารุณี นางสาวผ่องพรรณ นางสาวนางพัชรีย์ นางสาวพรตะวัน นางสาวสมปอง นางรัศมี 
| date = 27 มกราคม 2548  4 มิถุนายน 2548 11 มิถุนายน 2548 18 มิถุนายน 2548 21 มิถุนายน 2548 15 ธันวาคม 2562 
| time = 
| locations =อำเภอเมืองมุกดาหาร อำเภอเมืองลำปาง อำเภอเมืองตรัง อำเภอเมืองอุดรธานี อำเภอเมืองบุรีรัมย์ อำเภอกระนวม 
| apprehended = 27 มิถุนายน 2548  (18 ธันวาคม 2562 ถูกจับครั้งที่2)
| fatalities = อย่างน้อย6 ราย
| weapon = อ่างน้ำ มือ สายไฟ เทปใส
}}
==ประวัติ==
===วัยเด็ก===
สมคิด พุ่มพวงถูกพ่อนำมาฝากไว้ ให้อยู่กับลุงที่จ.นครศรีธรรมราช ตั้งแต่ “สมคิด” อายุ 8 ขวบ หลังจากที่แม่ของเขาได้เสียชีวิตลง
เมื่อ สมคิด อยู่กับลุงได้ไม่นาน เขาก็เริ่มขโมยทรัพย์สินภายในบ้าน จนกระทั่งเขาได้ไปขโมยรถจักรยานของครูที่โรงเรียน เหตุนี้จึงทำให้สมคิด ถูกไล่ออกจากโรงเรียนเมื่ออายุประมาณ 14-15 ปี ลุงได้พา “สมคิด” มาทำงานที่โรงเลื่อย โดยเขามีหน้าที่ขับรถนำไม้ยางไปส่งที่โรงงานใน อ.ทุ่งสง จ.นครศรีธรรมราช
อยู่มาวันหนึ่งลุงจับได้ว่า “สมคิด ” แอบขโมยเงินเถ้าแก่ ลุง จึงไล่สมคิดออกจากบ้าน เขาจึงมุ่งหน้าไปหาพ่อที่จ.ตรัง
เมื่อได้ไปอยู่กับพ่อ “สมคิด” ไม่ทิ้งนิสัยเดิม ชอบลักขโมย และ มีเรื่องทะเลาะวิวาทอยู่เป็นประจำ สุดท้ายถูกกลุ่มวัยรุ่นเจ้าถิ่นรุมทำร้าย สมคิด จึงตัดสินใจหนีออกจากหมู่บ้านไป และ ก็ไม่มีใครทราบข่าวคราวของ “สมคิด พุ่มพวง” อีกเลย [https://www.pptvhd36.com/news/%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B9%80%E0%B8%94%E0%B9%87%E0%B8%99%E0%B8%A3%E0%B9%89%E0%B8%AD%E0%B8%99/116095]
===พยานเท็จคดีฆ่านายปรีณะ ลีพัฒนะพันธ์ ===
นายสมคิด โผล่มาพบตำรวจอ้างว่าเป็นพยานที่เห็นเหตุการณ์ในคดีฆ่านายปรีณะ ลีพัฒนะพันธ์ อดีตผู้ว่าฯ ยโสธร แต่ตํารวจสอบไปสอบมาสุดท้ายนายสมคิด สารภาพว่ามีคนจ้างมาให้การเท็จ คดีดังกล่าวตํารวจดําเนินคดีและส่งฟ้องศาล ได้รับโทษจําคุก 6 เดือน <ref>[https://www.silpa-mag.com/history/article_42881/ย้อนคดีเขย่าขวัญ “สมคิด พุ่มพวง” ฆาตกรต่อเนื่อง ฉายา “คิด เดอะริปเปอร์]</ref>ระหว่างอยู่ในคุกเขาได้เขียนจดหมายส่งไปถึงภรรยาของญาติของเเกนนำการต่อต้านในบ่อบำบัดน้ำเสียราชาเทวะที่ถูกยิงตาย<ref>
[https://www.bangkokbiznews.com/news/858769 ย้อนคดีเขย่าขวัญ พลิกแฟ้มคดี 'สมคิด ฆาตกรต่อเนื่อง' สุขทุกครั้งที่ได้บีบคอเหยื่อ]</ref>

==การก่อคดีในปี2548==
===รูปแบบการฆาตกรรม===
บีบคอ ใช้สายไฟรัดคอ กดน้ำ 
วิธีบีบคอเขาได้เรียนรู้จากทหารเวียดกงขณะทำงานในบ่อนคาสิโน ถ้ามีอ่างอาบน้ำก็กดน้ำ<ref>[https://www.youtube.com/watch?v=UG8MR4mXYGg/ข่าวดังข้ามเวลา : ฆาตกรรมซ้ำซ้อน..ฆาตกรต่อเนื่อง]</ref>
===การจับกุม===
เขาถูกจับกุมที่ จ.ชัยภูมิ ที่บ้านของภรรยา หลังจากตำรวจพบข้อมูลการใช้โทรศัพท์มือถือของเหยื่อรายหนึ่ง ที่ถูกขโมยไปหลังถูกฆาตกรรม ซึ่งโทรออกจาก จ.ชัยภูมิ
===คำให้การ===
นายสมคิดสารภาพ 4 คดี อ้างว่าลงมือสังหารเพราะโมโหที่เหยื่อทุกรายซึ่งซื้อบริการมาหลับนอน ขอเพิ่มค่าตัวเลยฆ่าทิ้งให้หายแค้น

===เหยื่อ===
การสืบสวนสอบสวนจนทราบว่า เหยื่อทั้ง 5 รายนั้นเป็นฝีมือของฆาตกรคนเดียวกัน นายสมคิดได้ให้การรับสารภาพ 4 คดี ยกเว้นคดีฆ่า น.ส.พัชรีย์
{| class="wikitable"
|+ Caption text
|-
! เหยื่อรายที่ !! ชื่อ !! วัน !! สถานที่ !! ประเภทของสถานที่ก่อเหตุ !! อาชีพ !! ลักษณะการก่อเหตุ
|-
| 1 || นางสาววารุณี พิมพะบุตร  || 30 มกราคม 2548 || ตำบลมุกดาหาร อำเภอเมือง จ.มุกดาหาร || โรงเเรม ||  นักร้องคาเฟ่ ||  ถูกจับมัดเเล้วกดน้ำ
|-
| 2 || นางสาวผ่องพรรณ ทรัพย์ชัย || 4 มิถุนายน 2548  || ต.สวนดอก อ.เมือง จ.ลำปาง || โรงเเรม || หมอนวดเเผนโบราณ ||  ถูกบีบคอ
|-
| 3 || นางสาวพัชรีย์ อมตนิรันดร์ || 11 มิถุนายน 2548 || ต.ทับเที่ยง อ.เมืองตรัง || โรงเเรม || นักร้องคาเฟ่ || รัดคอด้วยสายไฟ
|-
| 4 || นางสาวพรตะวัน ปังคะบุตร || 18 มิถุนายน 2548 || อ.เมือง จ.อุดรธานี || โรงเเรม || หมอนวด || กดน้ำ
|-
| 5 || นางสาวสมปอง พิมพรภิรมย์ || 21 มิถุนายน 2548 || ต.ชุมเห็ด อ.เมือง จ.บุรีรัมย์ || แมนชั่น || หมอนวด|| บีบคอ
|}

===การพิจารณาคดี===
ศาลอุทรณ์เเละฎีกาได้ตัดสินประหารชีวิตในข้อหาในความผิดฐานฆ่าผู้อื่นโดยไตร่ตรองไว้ก่อน โดยทรมาน โดยกระทําการทารุณโหดร้าย และลักทรัพย์ในเวลากลางคืนในคดีที่1,2เเละ5เเต่จำเลยให้การรับสารภาพจึงลดโทษเหลือจำคุกตลอดชีวิต ส่วนคดีที่3เเละ4โทษจำคุกตลอดชีวิต <ref name="thaipbs">[https://news.thaipbs.or.th/content/287119/ย้อนคดี "สมคิด พุ่มพวง" แจ็ค เดอะริปเปอร์เมืองไทย]</ref>
<ref>[https://www.silpa-mag.com/history/article_42881/ย้อนคดีเขย่าขวัญ “สมคิด พุ่มพวง” ฆาตกรต่อเนื่อง ฉายา “คิด เดอะริปเปอร์]</ref>
==ก่อเหตุซ้ำปี2562==
===เหตุการณ์===
สมคิด พุ่มพวง ได้รับการลดโทษลงมาเรื่อยๆตามหลักเกณฑ์จากการที่ประพฤติตัวดี จนมีโทษเหลืออยู่ไม่ถึง 25 ปี เขาจึงถูกย้ายออกจาก[[เรือนจำกลางบางขวาง]] กลับภูมิลำเนามาอยู่ที่เรือนจำหนองคาย ก่อนจะได้รับการปล่อยตัว โดยถูกจำคุกจริงรวมประมาณ 14 ปี <ref>[https://mgronline.com/onlinesection/detail/9620000120161 เผย “หลักทัณฑวิทยา” ลดโทษ “สมคิด พุ่มพวง” คุกตลอดชีวิตเหลือ 14 ปี ก่อนก่อเหตุซ้ำ]</ref>
หลังจากได้รับการปล่อยตัวออกจากเรือนจำหนองคายเมื่อวันที่ 17 พ.ค.62 สมคิดใช้ชีวิตตามปกติเเละเริ่มคบหากับนางรัศมีซึ่งเป็นเเม่บ้านของโรงเเรมเเห่งหนึ่งโดยรู้จักกันผ่านช่องทาง[[เฟซบุ๊ก]] ซึ่งเฟซบุ๊คที่นายเเขกใช้ติดต่อเป็นของเป็นแฟนสาวอีกคนของนายแขกถูกนายแขกแอบเอาเฟซบุ๊กไปใช้โดยชื่อว่าอ้างตัวว่าชื่อว่านายเเขก เป็นทนายความ  วันที่ 9 ธ.ค. นายแขกพานางรัศมีไปจองรถเก๋งที่ศูนย์มิตซูบิชิในเมืองขอนแก่น ใช้ชื่อนางรัศมีเป็นผู้จอง จากนั้นนางรัศมีโทรศัพท์บอกเพื่อนสนิทว่าแฟนหนุ่มพาไปจองรถและกำลังหาทำเลเปิดร้านอาหารปักษ์ใต้เพื่อเตรียมต้อนรับญาติฝ่ายชายที่จะเดินทางมาสู่ขอในวันที่ 15 ธ.ค ช่วงสายของวันที่ 15 ธ.ค. เพื่อนบ้านได้ยินเสียงทั้งคู่ทะเลาะวิวาทกัน กระทั่งช่วงเที่ยงเสียงเงียบไป จนถึงเย็นเพื่อนบ้านไม่เห็นนางรัศมีออกไปทำงาน ด้วยความสงสัยจึงชวนกันไปเรียกหานางรัศมี แต่ไม่มีเสียงขานรับ เปิดประตูเข้าไปดูในบ้านจึงพบศพนางรัศมีถูกฆ่าตายอยู่ใต้ที่นอนสภาพศพถูกห่อด้วยผ้าห่มท่อนล่างเปลือยบริเวณลำคอถูกพันด้วยเทปใส ที่ข้อเท้าถูกมัดด้วยสายชาร์จโทรศัพท์และไม่พบนายแขก แฟนหนุ่ม เชื่อว่านายแขกน่าจะเป็นคนร้ายที่ลงมือฆ่านางรัศมีแล้วหลบหนีไป 
แพทย์ชันสูตรศพพบว่า สาเหตุการเสียชีวิตจากการขาดอากาศหายใจ โดยคนร้ายใช้สายไฟรัดที่คอแล้วใช้เทปใสพันคอซ้ำทำให้เสียชีวิต
ตำรวจชุดสืบสวนลงพื้นที่หาเบาะแสคนร้าย ตรวจสอบจากหลักฐานต่างๆที่ได้ในที่เกิดเหตุรวมทั้งสอบสวนพยานและนำภาพถ่ายผู้ต้องสงสัยให้ดู พยานยืนยันตรงกันว่านายแขกคือนายสมคิด หรือบัง พุ่มพวง อายุ 55 ปี ชาว จ.นครศรีธรรมราช<ref name="ไทยรัฐ">[https://www.thairath.co.th/news/local/northeast/1727635ล่าไอ้ฆาตกรโรคจิต "สมคิด พุ่มพวง" ฆ่าสาวศพที่6 กรมคุกเต้นเพิ่งได้อภัยโทษ (คลิป)]</ref>

===จับกุม===
วันที่18 ธันวาคม 2562เจ้าหน้าที่ตำรวจสถานีตำรวจภูธรปากช่อง ได้รับการประสานจากเจ้าหน้าที่ตำรวจรถไฟ ว่ามีพลเมืองดีพบบุคคลน่าสงสัยว่าจะเป็น นายสมคิด พุ่มพวง ฆาตกรต่อเนื่องนั่งมากับรถไฟโดยสารขบวนที่ ข.234 สายกรุงเทพ-สุรินทร์หลังรับแจ้งเจ้าหน้าที่ตำรวจชุดสายสืบประมาณ 30 นาย จึงเข้าโอบล้อมบริเวณชานชาลา[[สถานีรถไฟปากช่อง]]ไว้ก่อนที่ขบวนรถไฟจะเข้าจอดเทียบชานชาลา เมื่อรถไฟจอดสนิท เจ้าหน้าที่ตำรวจจึงจู่โจมขึ้นบนตู้ที่ 2 พบ นายสมคิด แต่งกายปิดแมสที่จมูกและปากอำพรางตัวอย่างมิดชิดนั่งปะปนอยู่กับผู้โดยสารทั่วไป
เมื่อเห็นเจ้าหน้าที่ตำรวจ นายสมคิด ได้หันหน้าเข้าข้างผนังรถไฟเพื่อไม่ให้เห็นหน้า แต่เจ้าหน้าที่ก็ไม่รีรอ ตรงเข้าล็อกตัวไว้ทันที ซึ่งนายสมคิด ก็ไม่ได้ขัดขวางหรือขัดขืนประการใด จากนั้นเจ้าหน้าที่ตำรวจจึงนำตัวนายสมคิดมาพักไว้ที่สถานีตำรวจภูธรปากช่อง
<ref>[https://www.thairath.co.th/news/society/1728856เปิดคลิปไทม์ไลน์ "สมคิด พุ่มพวง" ตีตั๋วขึ้นรถไฟ ก่อนถูกรวบจนมุมที่ปากช่อง]</ref>

===คำให้การ===
สมคิด พุ่มพวงได้ให้การว่าวันที่ 14 ธันวาคม ได้ขับขี่รถจักรยานยนต์ของผู้ตายไปจอดไว้ที่โรงพยาบาลขอนแก่น และขับขี่รถจักรยานยนต์ของตัวเองกลับไปหาผู้ตายที่ [[อำเภอกระนวน]] ทำให้ผู้ตายไม่พอใจและทะเลาะกัน จนถึงเช้าวันที่ 15 ธันวาคม สมคิดอ้างว่า มีความรักใคร่ผู้ตายและจะแต่งงานจริง แต่ช่วงที่ทะเลาะกันสมคิดอ้างว่า ผู้ตายกัดที่นิ้ว ข่วนที่หน้า จึงโมโห พลั้งมือบีบคอผู้ตายจนสลบคามือจากนั้นได้เอาสายไฟ รัดที่คอซ้ำ จนผู้ตายขาดใจตาย จึงนำเทปกาวใสมาพันรอบคอซ้ำอีก แล้วใช้สายชาร์จโทรศัพท์มือถือมัดมือมัดเท้า เก็บศพไว้ใต้ที่นอนแล้วเก็บทุกอย่างให้เรียบร้อยแล้วก็หลบหนี <ref>[https://www.thairath.co.th/news/local/northeast/1729470 เปิดคำรับสารภาพ "สมคิด พุ่มพวง" ฆาตกรโรคจิต เหตุฆ่าศพที่ 6 สาวกระนวน]</ref>

==='''คำตัดสิน'''===

====ศาลชั้นต้น====
วันที่ 17 มีนาคม 2564 เวลา 09.00 น. ศาลจังหวัดขอนแก่น อ่านคำพิพากษาในคดีอาญาหมายเลขดำที่ 87/2564 ระหว่างพนักงานอัยการจังหวัดขอนแก่น โจทก์ นายสมคิด พุ่มพวง จำเลย ศาลพิพากษาว่า จำเลยมีความผิดตามประมวลกฎหมายอาญา มาตรา 289(4) (5) มาตรา 199 และ มาตรา 334 ประมวลกฎหมายวิธีพิจารณาความอาญา มาตรา 150 ทวิ วรรคสอง

การกระทำของจำเลยเป็นความผิดหลายกรรมต่างกัน ให้ลงโทษทุกกรรมเป็นกระทงความผิดไป ตามประมวลกฎหมายอาญา มาตรา 91 ฐานฆ่าผู้อื่นโดยไตร่ตรองไว้ก่อน โดยทรมานหรือโดยการกระทำทารุณโหดร้าย ลงโทษประหารชีวิต ฐานลักทรัพย์ จำคุก 2 ปี สำหรับความผิดซ่อนเร้น ย้าย หรือทำลายศพหรือส่วนของศพ เพื่อปิดบังการเกิด การตาย หรือสาเหตุแห่งการตาย และฐานเป็นการกระทำใดๆ ต่อศพหรือสภาพแวดล้อมในบริเวณที่พบศพก่อนการชันสูตรพลิกศพเสร็จสิ้น ในประการที่น่าจะทำให้การชันสูตรพลิกศพหรือผลทางคดีเปลี่ยนแปลงไปเพื่ออำพรางคดี

เป็นการกระทำกรรมเดียวเป็นความผิดต่อกฎหมายหลายบท ให้ลงโทษตามประมวลกฎหมายวิธีพิจารณาความอาญา มาตรา 150 ทวิ วรรคสอง อันเป็นบทกฎหมายบทที่มีโทษหนักที่สุด ตามประมวลกฎหมายอาญา มาตรา 90 จำคุก 12 เดือน

ฐานลักทรัพย์เพิ่มโทษตามประมวลกฎหมายอาญา มาตรา 93 เป็นจำคุก 3 ปี ฐานเป็นการกระทำใดๆ ต่อศพหรือสภาพแวดล้อมในบริเวณที่พบศพก่อนการชันสูตรพลิกศพเสร็จสิ้น ในประการที่น่าจะทำให้การชันสูตรพลิกศพหรือผลทางคดีเปลี่ยนแปลงไปเพื่ออำพรางคดี เพิ่มโทษตามประมวลกฎหมายอาญา มาตรา 92 เป็นจำคุก 16 เดือน

เนื่องจากศาลลงโทษประหารชีวิตซึ่งเป็นโทษสูงสุดแล้ว จึงไม่อาจเพิ่มโทษได้อีก จำเลยให้การรับสารภาพในชั้นจับกุมและชั้นสอบสวนในครั้งแรกเพราะจำนนต่อพยานหลักฐาน แต่ให้การปฏิเสธในชั้นพิจารณา ต่อสู้คดีอย่างเต็มที่ คำรับสารภาพดังกล่าวไม่เป็นประโยชน์แก่การพิจารณา เป็นเพียงกลวิธีในการต่อสู้คดีของจำเลยเพื่อให้ศาลพิจารณาลดโทษให้เท่านั้น

ประกอบกับพฤติการณ์การกระทำความผิดของจำเลยได้กระทำต่อเนื่องในลักษณะเดียวกันรวมคดีนี้ด้วยถึง 6 คดี หลังจากจำเลยพ้นโทษจากคดีทั้งห้าคดีก่อนนั้นเป็นเวลาเพียง 6 เดือนเศษ ทั้งไม่สำนึกในการกระทำความผิด ขาดความเมตตาปรานี สร้างความสูญเสียแก่สุจริตชนและเป็นอันตรายต่อสังคมอย่างใหญ่หลวง จึงไม่มีเหตุบรรเทาโทษ <ref>[https://www.khaosod.co.th/newspaper-column/live-from-the-scene/news_6337861 ปิดฉากฆาตกรต่อเนื่อง ประหารสมคิดพุ่มพวง ย้อนคดีสยองปี2548 พ้นโทษ-ก่อเหตุฆ่าซ้ำ]</ref>

คงให้ประหารชีวิตจำเลยสถานเดียว และ ริบของกลาง

====ศาลอุทธรณ์====
อยู่ในระหว่างระยะเวลายื่นอุทธรณ์
==ดูเพิ่ม==
*[[พันธ์ สายทอง]]
*[[เดชา สุวรรณสุก]]
*[[ฆาตกรติ๊งต่าง]]
*[[ไอ้หื่นซิกซ์แพก]]
*[[ซีอุย]]
*[[เฉลิมชัย มัจฉากล่ำ]]
*[[ฆาตกรต่อเนื่อง]]
*[[บ่อขยะราชาเทวะ จังหวัดสมุทรปราการ]]

== อ้างอิง ==
<!--- ดู [[วิธีใช้:เชิงอรรถ]] ถึงวิธีการเพิ่มการอ้างอิงโดยใช้ป้ายระบุ <ref></ref> ซึ่งจะอยู่ในหน้านี้โดยอัตโนมัติ -->
{{Reflist}}

== แหล่งข้อมูลอื่น ==
<!-- ใช้รูปแบบ: * [http://www.example.com/ example.com] -->

<!--- หมวดหมู่ --->
[[Category:ศาลอุทธรณ์]][[หมวดหมู่:ฆาตกรต่อเนื่อง|ฆาตกรต่อเนื่อง]]
{{AfC submission|||ts=20220131111356|u=Stirz117|ns=118}}
`
class AfCDraft {
  constructor(page, text) {
    this.page = page
    this.text = text
  }

  /**
   * cleanup wikitext and replace it with formatted wikitext
   * to be place in draft.
   * @param {string} wikitext Wikitext of page to be cleanup with.
   * @return {string} Wikitext of page after cleanup.
   */
  cleanUp() {
    let text = this.text,
      commentRegex,
      commentsToRemove = [
        'Please don\'t change anything and press save',
        'Carry on from here, and delete this comment.',
        'Please leave this line alone!',
        'Important, do not remove this line before (template|article) has been created.',
        'Just press the "Save page" button below without changing anything! Doing so will submit your article submission for review. ' +
        'Once you have saved this page you will find a new yellow \'Review waiting\' box at the bottom of your submission page. ' +
        'If you have submitted your page previously,(?: either)? the old pink \'Submission declined\' template or the old grey ' +
        '\'Draft\' template will still appear at the top of your submission page, but you should ignore (them|it). Again, please ' +
        'don\'t change anything in this text box. Just press the \"Save page\" button below.',
        'เขียนข้อความสำหรับบทความของคุณด้านล่างบรรทัดนี้ ประโยคแรกควรเริ่มต้นด้วยหัวเรื่องของบทความของคุณที่อยู่ในอะพอสทรอฟีสามตัว (ตัวอย่างเช่น: \'\'\'ชื่อบทความ\'\'\' คือ...)'
      ]
    text = text.replace(/\[\[(Category|หมวดหมู่):/gi, '[[:หมวดหมู่:')

    // Remove empty section at the end (caused by "Resubmit" button on "declined" template)
    // Section may have categories after it - keep them there
    text = text.replace(/\n+==.+?==((?:\[\[:?(Category|หมวดหมู่):.+?\]\]|\s+)*)$/, '$1')

    // Assemble a master regexp and remove all now-unneeded comments (commentsToRemove)
    commentRegex = new RegExp('<!-{2,}\\s*(' + commentsToRemove.join('|') + ')\\s*-{2,}>', 'gi')
    text = text.replace(commentRegex, '')

    // Remove initial request artifact
    text = text.replace(/== Request review at \[\[WP:AFC\]\] ==/gi, '')

    // Remove sandbox templates
    text = text.replace(/\{\{(userspacedraft|userspace draft|user sandbox|Please leave this line alone \(sandbox heading\))(?:\{\{[^{}]*\}\}|[^}{])*\}\}/ig, '')
    text = text.replace(/\{\{(กระบะทรายผู้ใช้|กรุณาอย่าแก้ไขบรรทัดนี้ \(ส่วนหัวหน้าทดลองเขียน\))(?:\{\{[^{}]*\}\}|[^}{])*\}\}/ig, '')

    // Remove html comments (<!--) that surround categories
    text = text.replace(/<!--\s*((\[\[:{0,1}((Category|หมวดหมู่):.*?)\]\]\s*)+)-->/gi, '$1')

    // Remove spaces/commas between <ref> tags
    text = text.replace(/\s*(<\/\s*ref\s*\>)\s*[,]*\s*(<\s*ref\s*(name\s*=|group\s*=)*\s*[^\/]*>)[ \t]*$/gim, '$1$2')

    // Remove whitespace before <ref> tags
    text = text.replace(/[ \t]*(<\s*ref\s*(name\s*=|group\s*=)*\s*.*[^\/]+>)[ \t]*$/gim, '$1')

    // Move punctuation before <ref> tags
    text = text.replace(/\s*((<\s*ref\s*(name\s*=|group\s*=)*\s*.*[\/]{1}>)|(<\s*ref\s*(name\s*=|group\s*=)*\s*[^\/]*>(?:<[^<\>]*\>|[^><])*<\/\s*ref\s*\>))[ \t]*([.!?,;:])+$/gim, '$6$1')

    // Replace {{http://example.com/foo}} with "* http://example.com/foo" (common newbie error)
    text = text.replace(/\n\{\{(http[s]?|ftp[s]?|irc|gopher|telnet)\:\/\/(.*?)\}\}/gi, '\n* $1://$3')
    function convertExternalLinksToWikilinks(text) {
      let linkRegex = /\[{1,2}(?:https?:)?\/\/(?:en.wikipedia.org\/wiki|enwp.org)\/([^\s\|\]\[]+)(?:\s|\|)?((?:\[\[[^\[\]]*\]\]|[^\]\[])*)\]{1,2}/ig,
        linkMatch = linkRegex.exec(text),
        title, displayTitle, newLink

      while (linkMatch) {
        title = decodeURI(linkMatch[1]).replace(/_/g, ' ')
        displayTitle = decodeURI(linkMatch[2]).replace(/_/g, ' ')

        // Don't include the displayTitle if it is equal to the title
        if (displayTitle && title !== displayTitle) {
          newLink = '[[' + title + '|' + displayTitle + ']]'
        } else {
          newLink = '[[' + title + ']]'
        }

        text = text.replace(linkMatch[0], newLink)
        linkMatch = linkRegex.exec(text)
      }

      return text
    }
  
    // Replace 3+ newlines with just two
    text = text.replace(/(?:[\t ]*(?:\r?\n|\r)){3,}/ig, '\n\n')
    // Remove all whitespace at the top of the article
    text = text.replace(/^\s*/, '')
    text = convertExternalLinksToWikilinks(text)
  
    //Format
    //text = text.replace(/<br>|<br\/>/gi, "<br />");                                   //<br/> -> <br />
    text = text.replace(/([^\[]|^)^(?!CDATA)\[([^\[^\]]*?)\]\]/gm, '$1[[$2]]')                   //[ลิงก์ใน]] -> [[ลิงก์ใน]]
    //Depreciated because of certain conditions would cause this to fail
    //Case study: [[ภาพ:Cube root.png|right|thumb|288px|กราฟของสมการ <math>y = \sqrt[3]{x}</math>]] 
    //text = text.replace(/\[\[([^\[^\]].*?)[$[^\]]?]/gm, "[[$1]]");                      //[[ลิงก์ใน] -> [[ลิงก์ใน]]
    text = text.replace(/\[\[ ?([^\]\|]*?) \s*([\|\s|\]\]])/g, '[[$1$2')               //[ ลิงก์ใน ]] -> [[ลิงก์ใน]]

    text = text.replace(/^([\*#]+) /gm, '$1')
    text = text.replace(/^([\*#]+(?!\!))/gm, '$1 ')
    text = text.replace(/\n(={1,5}) ?''' ?(.*) ?''' ?(={1,5})/gm, '\n$1 $2 $3')       //== '''หัวข้อ''' == -> == หัวข้อ ==
    text = text.replace(/^= ?([^=].*?) ?=/gm, '== $1 ==')                               //= หัวข้อ =  -> == หัวข้อ ==
    text = text.replace(/^(={1,5}) *(.*?) ?(={1,5}) *$/gm, '$1 $2 $3')              //==หัวข้อ== -> == หัวข้อ ==
    //text = text.replace(/&nbsp;/g, " ");
    text = text.replace(/&prime;/g, '\'')
    text = text.replace(/&amp;/g, '&')
    text = text.replace(/&minus;/g, '−')
    text = text.replace(/&times;/g, '×')
    text = text.replace(/&mdash;/g, '—')
    text = text.replace(/&ndash;/g, '-')

    //[[หมวดหมู่: xxx]] -> [[หมวดหมู่:xxx]]
    text = text.replace(/\[\[หมวดหมู่:\s(.*?)\]\]/g, '[[หมวดหมู่:$1]]')

    //{{แม่แบบ:xxx}} -> {{xxx}}
    text = text.replace(/{{แม่แบบ:(.*?)}}/g, '{{$1}}')

    //Fix spacing, </xxx > -> </xxx>
    text = text.replace(/<\/(.*?) ?>/g, '</$1>')

    //Fix spacing between char and paren
    //Add exception for ps: interlanguage. Example:ps:ماينامار(برما)
    var re = /\[\[ps:(.*?)\]\]/ig
    var matches = text.match(re)
    text = text.replace(/(.(?!( f\()).[^\s\[\]\(\_\#\/\{\"\f])\(/g, '$1$2 (')       //Ignore f(x) case from f (x)
    text = text.replace(/(.*?)\)([^\s\]\)\|\.\_\#\/\}\"\,\<\"])/g, '$1) $2')
    text = text.replace(/(.*?)\]\]\(/g, '$1]] (')                //Allow spacing for link scenario such as [[Link]](Hello World!)

    if (matches) {
      text = text.replace(/\[\[ps:.*?\]\]/ig, matches[0])
    }
    //Fix spacing between yamok and char
    //text = text.replace(/)

    //Fix lang icons: Move from front to back
    //Depreciated because now the ref links are used inside ref tags.
    //Case Study: //th.wikipedia.org/w/index.php?title=%E0%B9%80%E0%B8%AB%E0%B8%95%E0%B8%B8%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%93%E0%B9%8C%E0%B9%81%E0%B8%9C%E0%B9%88%E0%B8%99%E0%B8%94%E0%B8%B4%E0%B8%99%E0%B9%84%E0%B8%AB%E0%B8%A7%E0%B9%83%E0%B8%99%E0%B8%A1%E0%B8%93%E0%B8%91%E0%B8%A5%E0%B9%80%E0%B8%AA%E0%B8%89%E0%B8%A7%E0%B8%99_%E0%B8%9E.%E0%B8%A8._2551&diff=1161797&oldid=1152067
    //text = text.replace(/\* ?({{.*? icon}}) ?(.*?)\r?\n/g, "* $2 $1\n");                            //แก้ * {{...}} [...] -> * [...] {{...}}
    text = text.replace(/<ref(.*?)> ?({{.*? icon}}) ?(.*?) ?<\/ref>/g, '<ref$1>$3 $2</ref>')//แก้ <ref...> {{...}} [...] </ref> -> <ref...>[...] {{...}}</ref>

    //Fix Template Parameters Layout: Move | from back to front (using Top to Bottom approach)
    text = text.replace(/ *\|(?!-) *\r?\n *([^=\*<|{}]*?) ?=(?!=) *([^\|={}]*?)/gm, '\n| $1 = $2')      //รวมแก้สองอย่างโดยการตรวจย้ายบนไปล่างแทน
    //text = text.replace(/({{.*)(?!})\| *\r/g,"$1");                                   //แก้ {{... | -> {{...
    //text = text.replace(/(\n) *([^|{}]*?) ?= *([^|{}]*?)\| *\r/g,"$1| $2 = $3");      //แก้ ... | -> | ...

    //TODO: Need comments for code below for maintenance reasons: Hard to debug
    text = text.replace(/\n *\|(?!-) *([^={}\*].*?) ?= *([^<={}]*?) \| ?( *}} *\r?\n| *\r?\n *}} *\r?\n)/g, '\n| $1 = $2\n}}\n') //รุ่นใหม่ แค่จับขึ้นบรรทัดใหม่
    //text = text.replace(/(\n) *([^\|{}].*?) ?= *([^|{}]*?)(}}\r\n|\r\n *}})/g,"$1| $2 = $3\n}}");//แก้ ... -> | ...

    //Fix Template Parameters Layout: Add extra space in betweens
    text = text.replace(/\r?\n *\|(?!-) *([^=\|\?'"{}]*?) ?= *([^=]*?) */g, '\n| $1 = $2')

    //Fix Template: Remove extra | if exist at the end
    text = text.replace(/\n *\|(?!-) *([^=\|'"{}]*?)=([^=\|]*?) ?\r?\n?\| ?\r?\n?\}\}(?!\})/g, '\n| $1 = $2\n}}') //| abc = 123 | }} -> | abc = 123 }}

    //Fix Year Formatting
    text = text.replace(/(พ\. ?ศ\. ?|พศ\. ?)(\d{1,4})/g, 'พ.ศ. $2')
    text = text.replace(/(ค\. ?ศ\. ?|คศ\. ?)(\d{1,4})/g, 'ค.ศ. $2')

    //Fix double Thai vowels
    //# สระหน้า           เ|แ|โ|ใ|ไ
    //# สระหลัง           ะ|า|ๅ
    //# อำ คือ             ำ
    //# สระบน             ั|ิ|ี|ึ|ื|ํ
    //# สระล่าง            ุ|ู|ฺ
    //# ไม้ไต่คู้            ็
    //# วรรณยุกต์        ่|้|๊|๋
    //# ทัณฑฆาต        ์
    //# ไปยาลน้อย      ฯ
    //# ไม้ยมก            ๆ
    //text = text.replace(/(แ|โ|ใ|ไ|ะ|า|ๅ|ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็|่|้|๊|๋|์){2,}/g, "$1") //remove dup

    text = text.replace(/ํา/g, 'ำ') //Nikhahit (nikkhahit) + Sara Aa -> Saram Am
    text = text.replace(/เเ/g, 'แ') //Sara E + Sara E -> Sara Ae
    text = text.replace(/(เ|แ|โ|ใ|ไ)(ะ|า|ๅ|ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็|่|้|๊|๋|์)/g, '$1') //สระหน้า
    text = text.replace(/(ะ|า|ๅ)(ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็|่|้|๊|๋|์)/g, '$1')                //สระหลัง
    text = text.replace(/(ำ)(ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็|่|้|๊|๋|์)/g, '$1')                    //สระอำ
    text = text.replace(/(ั|ิ|ี|ึ|ื|ํ)( ะ|า|ๅ|ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็)/g, '$1')           //สระบน
    text = text.replace(/(ุ|ู|ฺ)( ะ|า|ๅ|ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็)/g, '$1')                     //สระล่าง
    text = text.replace(/(็)( ะ|า|ๅ|ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็)/g, '$1')                            //ไม้ไต่คู้
    text = text.replace(/(่|้|๊|๋)(ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็|่|้|๊|๋|์)/g, '$1')               //วรรณยุกต์

    text = text.replace(/\u0E48\u0E48/g, '\u0E48') //Mai Ek
    text = text.replace(/\u0E49\u0E49/g, '\u0E49') //Mai Tho
    text = text.replace(/\u0E4A\u0E4A/g, '\u0E4A') //Mai Tri
    text = text.replace(/\u0E4B\u0E4B/g, '\u0E4B') //Mai Chattawa
    text = text.replace(/์์/g, '์') //ทัณฑฆาต

    //Spellings
    if (text.indexOf('nofixbot') == -1) {
      var matches = /\n\{\{ชื่อนิยมอื่น\|(.*?)\}\}/.exec(text)
      text = text.replace(/ไบท์(?!\]\])/g, 'ไบต์') //Ordering is intended
      text = text.replace(/เยอรมันนี/g, 'เยอรมนี')
      text = text.replace(/\sกฏ/g, ' กฎ')
      text = text.replace(/\sเกมส์/g, ' เกม')
      text = text.replace(/ก๊กกะ|กิกะ(?=ไบต์|บิ)/g, 'จิกะ')
      text = text.replace(/กฏหมาย/g, 'กฎหมาย')
      text = text.replace(/กรกฏาคม/g, 'กรกฎาคม')
      text = text.replace(/กระทั้ง/g, 'กระทั่ง')
      text = text.replace(/กราฟฟิค|กราฟฟิก/g, 'กราฟิก')
      text = text.replace(/กษัตรย์/g, 'กษัตริย์')
      text = text.replace(/กิติมศักดิ์/g, 'กิตติมศักดิ์')
      text = text.replace(/ขาดดุลย์/g, 'ขาดดุล')
      text = text.replace(/คริสต(ศตวรรษ|ศักราช|ศาสนา)/g, 'คริสต์$1')
      text = text.replace(/คริสต์กาล/g, 'คริสตกาล')
      text = text.replace(/คริสต์เตียน/g, 'คริสเตียน')
      text = text.replace(/คริสมาส|คริสมาสต์/g, 'คริสต์มาส')
      text = text.replace(/คลีนิก/g, 'คลินิก')
      text = text.replace(/คำนวน/g, 'คำนวณ')
      text = text.replace(/เคเบิ้ล/g, 'เคเบิล')
      text = text.replace(/โครงการณ์/g, 'โครงการ')
      text = text.replace(/งบดุลย์/g, 'งบดุล')
      text = text.replace(/จักรสาน/g, 'จักสาน')
      text = text.replace(/ซอฟท์แวร์/g, 'ซอฟต์แวร์')
      text = text.replace(/ซีรี่ส์|ซีรีย์|ซีรี่ย์/g, 'ซีรีส์')
      text = text.replace(/เซ็นติ/g, 'เซนติ')
      text = text.replace(/เซอร์เวอร์/g, 'เซิร์ฟเวอร์')
      text = text.replace(/ฑูต/g, 'ทูต')
      text = text.replace(/ดอท ?คอม|ด็อท ?คอม|ด็อต ?คอม/g, 'ดอตคอม')
      text = text.replace(/ดอท ?เน็ท|ดอต ?เน็ท|ด็อต ?เน็ต|ด็อท ?เน็ต|ดอท ?เน็ต|ดอท?เนท/g, 'ดอตเน็ต')
      text = text.replace(/ถ่วงดุลย์/g, 'ถ่วงดุล')
      text = text.replace(/ทรงทอดพระเนตร/g, 'ทอดพระเนตร')
      text = text.replace(/ทรงบรรทม/g, 'บรรทม')
      text = text.replace(/ทรงประชวร/g, 'ประชวร')
      text = text.replace(/ทรงเป็นพระ/g, 'เป็นพระ')
      text = text.replace(/ทรงผนวช/g, 'ผนวช')
      text = text.replace(/ทรงมีพระ/g, 'มีพระ')
      text = text.replace(/ทรงสวรรคต/g, 'สวรรค')
      text = text.replace(/ทรงเสด็จ/g, 'เสด็จ')
      text = text.replace(/(?!วัด)ทรงเสวย/g, 'เสวย')
      text = text.replace(/ทะเลสาป(?!สีเลือด)/g, 'ทะเลสาบ')
      text = text.replace(/เทมเพลท/g, 'เทมเพลต')
      text = text.replace(/ธุระกิจ/g, 'ธุรกิจ')
      text = text.replace(/นิวยอร์ค/g, 'นิวยอร์ก')
      text = text.replace(/โน๊ต/g, 'โน้ต')
      text = text.replace(/บรรได/g, 'บันได')
      text = text.replace(/บรรเทิง(?!จิตร)/g, 'บันเทิง')       //See: ประสิทธิ์ ศิริบรรเทิง and กรรณิการ์ บรรเทิงจิตร
      text = text.replace(/บราวเซอร์|เบราเซอร์/g, 'เบราว์เซอร์')
      text = text.replace(/บล็อค|บล๊อค|บล๊อก/g, 'บล็อก')
      text = text.replace(/เบรค/g, 'เบรก')
      text = text.replace(/ปฎิ/g, 'ปฏิ')
      text = text.replace(/ปฏิกริยา|ปฎิกริยา/g, 'ปฏิกิริยา')
      text = text.replace(/ปรากฎ/g, 'ปรากฏ')
      text = text.replace(/ปราถนา/g, 'ปรารถนา')
      text = text.replace(/ปีรามิด|ปิระมิด/g, 'พีระมิด')
      text = text.replace(/โปรเจ็?คท์|โปรเจ็?คต์|โปรเจ็?ค/g, 'โปรเจกต์')
      text = text.replace(/โปรโตคอล/g, 'โพรโทคอล')
      text = text.replace(/ผลลัพท์/g, 'ผลลัพธ์')
      text = text.replace(/ผูกพันธ์/g, 'ผูกพัน')
      text = text.replace(/ฝรั่งเศษ/g, 'ฝรั่งเศส')
      text = text.replace(/ฟังก์ชั่น/g, 'ฟังก์ชัน')
      text = text.replace(/ภาพยนต์/g, 'ภาพยนตร์')
      text = text.replace(/มิวสิค(?!\u0E31)/g, 'มิวสิก')
      text = text.replace(/ไมโครซอฟต์/g, 'ไมโครซอฟท์')
      text = text.replace(/รถยนตร์/g, 'รถยนต์')
      text = text.replace(/ร็อค(?!แม)/g, 'ร็อก') //ignore ร็อคแมน
      text = text.replace(/ฤา/g, 'ฤๅ')
      text = text.replace(/ล็อค/g, 'ล็อก')
      text = text.replace(/ลอส แองเจลิส|ลอส แองเจลลิส|ลอส แองเจลีส|ลอสแองเจลิส|ลอสแองเจลีส|ลอสแองเจลลิส|ลอสแองเจอลิส|ลอสแองเจอลีส|ลอสแอนเจลลิส/g, 'ลอสแอนเจลิส')
      text = text.replace(/ลายเซ็นต์/g, 'ลายเซ็น')
      text = text.replace(/ลิงค์|ลิ้งค์|ลิ๊งค์|ลิ้งก์|ลิ๊งก์/g, 'ลิงก์')
      text = text.replace(/เวคเตอร์/g, 'เวกเตอร์')
      text = text.replace(/เวทย์มนตร์|เวทย์มนต์|เวทมนต์/g, 'เวทมนตร์')
      text = text.replace(/เวบไซท์|เวบไซต์|เวบไซท์|เว็บไซท์|เว็บไซต(?!\u0E4C)/g, 'เว็บไซต์')
      text = text.replace(/เวอร์ชั่น/g, 'เวอร์ชัน')
      text = text.replace(/เวิล์ด/g, 'เวิลด์')
      text = text.replace(/ศรีษะ/g, 'ศีรษะ')
      text = text.replace(/สคริปท์|สครปต์/g, 'สคริปต์')
      text = text.replace(/สเตชั่น/g, 'สเตชัน')
      text = text.replace(/สมดุลย์/g, 'สมดุล')
      text = text.replace(/สวดมน(?!\u0E21|\u0E15)|สวดมนตร์/g, 'สวดมนต์')
      text = text.replace(/สวรรณคต/g, 'สวรรคต')
      text = text.replace(/สังเกตุ/g, 'สังเกต')
      text = text.replace(/อโดบี/g, 'อะโดบี')
      text = text.replace(/อนิเม(?!\u0E30|ช|ท|ต)|อานิเมะ|อะนิเมะ/g, 'อนิเมะ')
      //text = text.replace(/อนิเม(?!ช|ท|ต)|อานิเมะ|อะนิเม(?!\u0E30|\u0E47|ช|ท|ต|เ|แ)/g, "อะนิเมะ");
      text = text.replace(/อนุญาติ/g, 'อนุญาต')
      text = text.replace(/อลูมิเนียม/g, 'อะลูมิเนียม')
      text = text.replace(/ออบเจ็ค|ออปเจ็ค|ออปเจค/g, 'อ็อบเจกต์')
      text = text.replace(/อัพเด็ต|อัพเดต|อัพเดท|อัปเด็ต/g, 'อัปเดต')
      text = text.replace(/อัพโหลด/g, 'อัปโหลด')
      text = text.replace(/อินเตอเน็ต|อินเตอร์เน็ต|อินเตอร์เนต|อินเทอร์เนต/g, 'อินเทอร์เน็ต')
      text = text.replace(/อิเล็กโทรนิกส์/g, 'อิเล็กทรอนิกส์')
      text = text.replace(/อิสระภาพ/g, 'อิสรภาพ')
      text = text.replace(/เอ็กซ์/g, 'เอกซ์')
      text = text.replace(/เอ็นจิ้น|เอ็นจิน|เอนจิ้น/g, 'เอนจิน')
      text = text.replace(/เอล์ฟ/, 'เอลฟ์')
      text = text.replace(/เอาท์พุต|เอาท์พุท/g, 'เอาต์พุต')
      text = text.replace(/แอปพลิเคชั่น|แอพพลิเคชั่น|แอพพลิเคชัน|แอพพลิคเคชัน/g, 'แอปพลิเคชัน')
    
      //Exceptions cases handling
      text = text.replace(/คริสต์มาส วิไลโรจน์/g, 'คริสมาส วิไลโรจน์')
      text = text.replace(/สมาคมเนชั่นแนล จีโอกราฟิก/g, 'สมาคมเนชั่นแนล จีโอกราฟฟิก')
      text = text.replace(/(อีเอ็มไอ|เบเกอรี่)มิวสิก/g, '$1มิวสิค')
      text = text.replace(/สตรีลิงก์/g, 'สตรีลิงค์')
      text = text.replace(/นกหัสดีลิงก์/g, 'นกหัสดีลิงค์')
      text = text.replace(/โปรเจกต์วัน/g, 'โปรเจควัน')
      text = text.replace(/ร โปรเจกต์/g, 'ร โปรเจ็คต์') //ดิ โอฬาร โปรเจ็คต์
      text = text.replace(/สารอัปเดต/g, 'สารอัพเดท') //นิตรสารอัพเดท
    
      //text = text.replace(/เอ็กซเรย์/g, "เอกซเรย์");
    
      //Cleanup
      text = text.replace(/\[\[category:/gi, '[[หมวดหมู่:')
      text = text.replace(/\[\[template:/gi, 'แม่แบบ:')
      text = text.replace(/(>|\n|\[|^)(image|file):/gi, '$1ไฟล์:')
      text = text.replace(/(>|\n|\[|^)ภาพ:/gi, '$1ไฟล์:')
  
      if (matches != null) {
        text = text.replace(/\n{{ชื่อนิยมอื่น.*/, matches[0])
      }
    }

    this.text = text
  }

  /**
   * Get current Draft status from wikitext
   */
  getDraftStatus() {
    let text = this.text

  }

  /**
   * Update and format categories
   * @param {string[]} categories
   * @returns {string} text
   */
  updateCategories(categories) {
    // There's no "g" flag in categoryRegex, because we use it
    // to delete its matches in a loop. If it were global, then
    // it would internally keep track of lsatIndex - then given
    // two adjacent categories, only the first would get deleted
    var catIndex, match,
      text = this.text,
      categoryRegex = /\[\[:?(Category|หมวดหมู่):.*?\s*\]\]/i,
      newCategoryCode = '\n'

    // Create the wikicode block
    $.each(categories, function (_, category) {
      var trimmed = $.trim(category)
      if (trimmed) {
        newCategoryCode += '\n[[หมวดหมู่:' + trimmed + ']]'
      }
    })

    match = categoryRegex.exec(text)

    // If there are no categories currently on the page,
    // just add the categories at the bottom
    if (!match) {
      text += newCategoryCode
      // If there are categories on the page, remove them all, and
      // then add the new categories where the last category used to be
    } else {
      while (match) {
        catIndex = match.index
        text = text.replace(match[0], '')
        match = categoryRegex.exec(text)
      }

      text = text.substring(0, catIndex) + newCategoryCode + text.substring(catIndex)
    }

    this.text = text
    return this.text
  }

  /**
   * just prepend the text with the this.text
   * @param {string} text 
   */
  prepend(text) {
    this.text = text + this.text
    return this.text
  }

  /**
   * just append the text with the this.text
   * @param {string} text
   */
  append(text) {
    this.text = this.text + text
    return this.text
  }

  /**
   * set
   * @param {string} text
   * @returns {string} text
   */
  set(text) {
    this.text = text
    return this.text
  }

  /**
   * get
   * @returns {string} text
   */
  get() {
    return this.text
  }

  /**
   * Gets the submitter, or, if no specific submitter is available,
	 * just the page creator
   * @returns {string} username
   */
  getSubmitter() {
    let user = this.params.u
    if (user) {
      return user
    } else {
      return this.page.getCreator()
    }
  }

  getCreator() {

  }

  cleanUpAll() {
    this.cleanUp()
    return this.text
  }
}

let newstr = new AfCDraft(test).cleanUpAll()
const d = diffChars(test,newstr)
let output = []
d.forEach((part) => {
  // green for additions, red for deletions
  // grey for common parts
  const color = part.added ? 'green' :
    part.removed ? 'bgRed' : 'grey'
  output.push(chalk[color](part.value))
})
console.log(output.join(''))