import { Bot } from "@core";

export default class DraftsFormatBot extends Bot {
  info = {
    id: "drafts-format-bot",
    name: "Drafts Format Bot",
    description: "จัดรูปแบบฉบับร่างให้เหมาะสม",
  };

  async run() {}

  cleanUp(text: string, pageTitle: string): string {
    let commentRegex;
    let commentsToRemove = [
      "Please don't change anything and press save",
      "Carry on from here, and delete this comment.",
      "Please leave this line alone!",
      "Important, do not remove this line before (template|article) has been created.",
      'Just press the "Save page" button below without changing anything! Doing so will submit your article submission for review. ' +
        "Once you have saved this page you will find a new yellow 'Review waiting' box at the bottom of your submission page. " +
        "If you have submitted your page previously,(?: either)? the old pink 'Submission declined' template or the old grey " +
        "'Draft' template will still appear at the top of your submission page, but you should ignore (them|it). Again, please " +
        'don\'t change anything in this text box. Just press the "Save page" button below.',
    ];

    text = text.replace(/\[\[(Category|หมวดหมู่):/gi, "[[:หมวดหมู่:");

    // Remove empty section at the end (caused by "Resubmit" button on "declined" template)
    // Section may have categories after it - keep them there
    text = this.removeEmptySectionAtEnd(text);
    text = text.replace(
      /\n+==.+?==((?:\[\[:?(Category|หมวดหมู่):.+?\]\]|\s+)*)$/,
      "$1",
    );

    // Assemble a master regexp and remove all now-unneeded comments (commentsToRemove)
    commentRegex = new RegExp(
      "<!-{2,}\\s*(" + commentsToRemove.join("|") + ")\\s*-{2,}>",
      "gi",
    );
    text = text.replace(commentRegex, "");

    // Remove initial request artifact
    text = text.replace(/== Request review at \[\[WP:AFC\]\] ==/gi, "");

    // Remove sandbox templates
    text = text.replace(
      /\{\{(userspacedraft|userspace draft|user sandbox|Please leave this line alone \(sandbox heading\))(?:\{\{[^{}]*\}\}|[^}{])*\}\}/gi,
      "",
    );
    text = text.replace(
      /\{\{(กระบะทรายผู้ใช้|กรุณาอย่าแก้ไขบรรทัดนี้ \(ส่วนหัวหน้าทดลองเขียน\))(?:\{\{[^{}]*\}\}|[^}{])*\}\}/gi,
      "",
    );

    // Remove html comments (<!--) that surround categories
    text = text.replace(
      /<!--\s*((\[\[:{0,1}((?:Category|หมวดหมู่):.*?)\]\]\s*)+)-->/gi,
      "$1",
    );

    // Remove spaces/commas between <ref> tags
    text = text.replace(
      /\s*(<\/\s*ref\s*>)\s*[,]*\s*(<\s*ref\s*(name\s*=|group\s*=)*\s*[^/]*>)[ \t]*$/gim,
      "$1$2",
    );

    // Remove whitespace before <ref> tags
    text = text.replace(
      /[ \t]*(<\s*ref\s*(name\s*=|group\s*=)*\s*.*[^/]+>)[ \t]*$/gim,
      "$1",
    );

    // Move punctuation before <ref> tags
    text = text.replace(
      /\s*((<\s*ref\s*(name\s*=|group\s*=)*\s*.*[/]{1}>)|(<\s*ref\s*(name\s*=|group\s*=)*\s*[^/]*>(?:<[^<>]*>|[^><])*<\/\s*ref\s*>))[ \t]*([.!?,;:])+$/gim,
      "$6$1",
    );

    // Replace {{http://example.com/foo}} with "* http://example.com/foo" (common newbie error)
    text = text.replace(
      /\n\{\{(http[s]?|ftp[s]?|irc|gopher|telnet):\/\/(.*?)\}\}/gi,
      "\n* $1://$3",
    );

    // Convert http://-style links to other wikipages to wikicode syntax
    // FIXME: Break this out into its own core function? Will it be used elsewhere?
    let linkRegex =
        /\[{1,2}(?:https?:)?\/\/(?:(?:en|th).wikipedia.org\/wiki|enwp.org)\/([^\s|\][]+)(?:\s|\|)?((?:\[\[[^[\]]*\]\]|[^\][])*)\]{1,2}/gi,
      linkMatch = linkRegex.exec(text),
      title,
      displayTitle,
      newLink;

    while (linkMatch) {
      title = decodeURI(linkMatch[1]).replace(/_/g, " ");
      displayTitle = decodeURI(linkMatch[2]).replace(/_/g, " ");

      // Don't include the displayTitle if it is equal to the title
      if (displayTitle && title !== displayTitle) {
        newLink = "[[" + title + "|" + displayTitle + "]]";
      } else {
        newLink = "[[" + title + "]]";
      }

      text = text.replace(linkMatch[0], newLink);
      linkMatch = linkRegex.exec(text);
    }

    /**
     * Fix the spelling.
     * Taken from iScript modules.
     *
     * @author iScript authors
     * @param {string} text text to fix
     * @return fixed text
     */
    // Spellings
    if (text.indexOf("nofixbot") !== -1) {
      // do not run if nofixbot
      text = text
        .replace(/ไบท์(?!\]\])/g, "ไบต์") // Ordering is intended
        .replace(/เยอรมันนี/g, "เยอรมนี")
        .replace(/\sกฏ/g, " กฎ")
        .replace(/\sเกมส์/g, " เกม")
        .replace(/ก๊กกะ|กิกะ(?=ไบต์|บิ)/g, "จิกะ")
        .replace(/กฏหมาย/g, "กฎหมาย")
        .replace(/กรกฏาคม/g, "กรกฎาคม")
        .replace(/กระทั้ง/g, "กระทั่ง")
        .replace(/กราฟฟิค|กราฟฟิก/g, "กราฟิก")
        .replace(/กษัตรย์/g, "กษัตริย์")
        .replace(/กิติมศักดิ์/g, "กิตติมศักดิ์")
        .replace(/ขาดดุลย์/g, "ขาดดุล")
        .replace(/คริสต(ศตวรรษ|ศักราช|ศาสนา)/g, "คริสต์$1")
        .replace(/คริสต์กาล/g, "คริสตกาล")
        .replace(/คริสต์เตียน/g, "คริสเตียน")
        .replace(/คริสมาส|คริสมาสต์/g, "คริสต์มาส")
        .replace(/คลีนิก/g, "คลินิก")
        .replace(/คำนวน/g, "คำนวณ")
        .replace(/เคเบิ้ล/g, "เคเบิล")
        .replace(/โครงการณ์/g, "โครงการ")
        .replace(/งบดุลย์/g, "งบดุล")
        .replace(/จักรสาน/g, "จักสาน")
        .replace(/ซอฟท์แวร์/g, "ซอฟต์แวร์")
        .replace(/ซีรี่ส์|ซีรีย์|ซีรี่ย์/g, "ซีรีส์")
        .replace(/เซ็นติ/g, "เซนติ")
        .replace(/เซอร์เวอร์/g, "เซิร์ฟเวอร์")
        .replace(/ฑูต/g, "ทูต")
        .replace(/ดอท ?คอม|ด็อท ?คอม|ด็อต ?คอม/g, "ดอตคอม")
        .replace(
          /ดอท ?เน็ท|ดอต ?เน็ท|ด็อต ?เน็ต|ด็อท ?เน็ต|ดอท ?เน็ต|ดอท?เนท/g,
          "ดอตเน็ต",
        )
        .replace(/ถ่วงดุลย์/g, "ถ่วงดุล")
        .replace(/ทรงทอดพระเนตร/g, "ทอดพระเนตร")
        .replace(/ทรงบรรทม/g, "บรรทม")
        .replace(/ทรงประชวร/g, "ประชวร")
        .replace(/ทรงเป็นพระ/g, "เป็นพระ")
        .replace(/ทรงผนวช/g, "ผนวช")
        .replace(/ทรงมีพระ/g, "มีพระ")
        .replace(/ทรงสวรรคต/g, "สวรรค")
        .replace(/ทรงเสด็จ/g, "เสด็จ")
        .replace(/(?!วัด)ทรงเสวย/g, "เสวย")
        .replace(/ทะเลสาป(?!สีเลือด)/g, "ทะเลสาบ")
        .replace(/เทมเพลท/g, "เทมเพลต")
        .replace(/ธุระกิจ/g, "ธุรกิจ")
        .replace(/นิวยอร์ค/g, "นิวยอร์ก")
        .replace(/โน๊ต/g, "โน้ต")
        .replace(/บรรได/g, "บันได")
        .replace(/บรรเทิง(?!จิตร)/g, "บันเทิง") // See: ประสิทธิ์ ศิริบรรเทิง and กรรณิการ์ บรรเทิงจิตร
        .replace(/บราวเซอร์|เบราเซอร์/g, "เบราว์เซอร์")
        .replace(/บล็อค|บล๊อค|บล๊อก/g, "บล็อก")
        .replace(/เบรค/g, "เบรก")
        .replace(/ปฎิ/g, "ปฏิ")
        .replace(/ปฏิกริยา|ปฎิกริยา/g, "ปฏิกิริยา")
        .replace(/ปรากฎ/g, "ปรากฏ")
        .replace(/ปราถนา/g, "ปรารถนา")
        .replace(/ปีรามิด|ปิระมิด/g, "พีระมิด")
        .replace(/โปรเจ็?คท์|โปรเจ็?คต์|โปรเจ็?ค/g, "โปรเจกต์")
        .replace(/โปรโตคอล/g, "โพรโทคอล")
        .replace(/ผลลัพท์/g, "ผลลัพธ์")
        .replace(/ผูกพันธ์/g, "ผูกพัน")
        .replace(/ฝรั่งเศษ/g, "ฝรั่งเศส")
        .replace(/ฟังก์ชั่น/g, "ฟังก์ชัน")
        .replace(/ภาพยนต์/g, "ภาพยนตร์")
        .replace(/มิวสิค(?!\u0E31)/g, "มิวสิก")
        .replace(/ไมโครซอฟต์/g, "ไมโครซอฟท์")
        .replace(/รถยนตร์/g, "รถยนต์")
        .replace(/ร็อค(?!แม)/g, "ร็อก") // ignore ร็อคแมน
        .replace(/ฤา/g, "ฤๅ")
        .replace(/ล็อค/g, "ล็อก")
        .replace(
          /ลอส แองเจลิส|ลอส แองเจลลิส|ลอส แองเจลีส|ลอสแองเจลิส|ลอสแองเจลีส|ลอสแองเจลลิส|ลอสแองเจอลิส|ลอสแองเจอลีส|ลอสแอนเจลลิส/g,
          "ลอสแอนเจลิส",
        )
        .replace(/ลายเซ็นต์/g, "ลายเซ็น")
        .replace(/ลิงค์|ลิ้งค์|ลิ๊งค์|ลิ้งก์|ลิ๊งก์/g, "ลิงก์")
        .replace(/เวคเตอร์/g, "เวกเตอร์")
        .replace(/เวทย์มนตร์|เวทย์มนต์|เวทมนต์/g, "เวทมนตร์")
        .replace(
          /เวบไซท์|เวบไซต์|เวบไซท์|เว็บไซท์|เว็บไซต(?!\u0E4C)/g,
          "เว็บไซต์",
        )
        .replace(/เวอร์ชั่น/g, "เวอร์ชัน")
        .replace(/เวิล์ด/g, "เวิลด์")
        .replace(/ศรีษะ/g, "ศีรษะ")
        .replace(/สคริปท์|สครปต์/g, "สคริปต์")
        .replace(/สเตชั่น/g, "สเตชัน")
        .replace(/สมดุลย์/g, "สมดุล")
        .replace(/สวดมน(?!\u0E21|\u0E15)|สวดมนตร์/g, "สวดมนต์")
        .replace(/สวรรณคต/g, "สวรรคต")
        .replace(/สังเกตุ/g, "สังเกต")
        .replace(/อโดบี/g, "อะโดบี")
        .replace(/อนิเม(?!\u0E30|ช|ท|ต)|อานิเมะ|อะนิเมะ/g, "อนิเมะ")
        // .replace(/อนิเม(?!ช|ท|ต)|อานิเมะ|อะนิเม(?!\u0E30|\u0E47|ช|ท|ต|เ|แ)/g, "อะนิเมะ")
        .replace(/อนุญาติ/g, "อนุญาต")
        .replace(/อลูมิเนียม/g, "อะลูมิเนียม")
        .replace(/ออบเจ็ค|ออปเจ็ค|ออปเจค/g, "อ็อบเจกต์")
        .replace(/อัพเด็ต|อัพเดต|อัพเดท|อัปเด็ต/g, "อัปเดต")
        .replace(/อัพโหลด/g, "อัปโหลด")
        .replace(
          /อินเตอเน็ต|อินเตอร์เน็ต|อินเตอร์เนต|อินเทอร์เนต/g,
          "อินเทอร์เน็ต",
        )
        .replace(/อิเล็กโทรนิกส์/g, "อิเล็กทรอนิกส์")
        .replace(/อิสระภาพ/g, "อิสรภาพ")
        .replace(/เอ็กซ์/g, "เอกซ์")
        .replace(/เอ็นจิ้น|เอ็นจิน|เอนจิ้น/g, "เอนจิน")
        .replace(/เอล์ฟ/, "เอลฟ์")
        .replace(/เอาท์พุต|เอาท์พุท/g, "เอาต์พุต")
        .replace(
          /แอปพลิเคชั่น|แอพพลิเคชั่น|แอพพลิเคชัน|แอพพลิคเคชัน/g,
          "แอปพลิเคชัน",
        )

        // Exceptions cases handling
        .replace(/คริสต์มาส วิไลโรจน์/g, "คริสมาส วิไลโรจน์")
        .replace(/สมาคมเนชั่นแนล จีโอกราฟิก/g, "สมาคมเนชั่นแนล จีโอกราฟฟิก")
        .replace(/(อีเอ็มไอ|เบเกอรี่)มิวสิก/g, "$1มิวสิค")
        .replace(/สตรีลิงก์/g, "สตรีลิงค์")
        .replace(/นกหัสดีลิงก์/g, "นกหัสดีลิงค์")
        .replace(/โปรเจกต์วัน/g, "โปรเจควัน")
        .replace(/ร โปรเจกต์/g, "ร โปรเจ็คต์") // ดิ โอฬาร โปรเจ็คต์
        .replace(/สารอัปเดต/g, "สารอัพเดท"); // นิตรสารอัพเดท

      // .replace(/เอ็กซเรย์/g, "เอกซเรย์")
    }

    /**
     * Fixing some common mistakes in the text
     * Taken from iScript modules.
     *
     * @author iScript authors
     * @param {string} text text to fix
     * @return fixed text
     */
    text = text
      /* policyFix */
      .replace(/(>|\n|\[|^)(image|file):/gi, "$1ไฟล์:")
      .replace(/(>|\n|\[|^)ภาพ:/gi, "$1ไฟล์:")
      .replace(
        /== *(แหล่งอ้างอิง|หนังสืออ้างอิง|เอกสารอ้างอิง|ข้อมูลอ้างอิง|แหล่งข้อมูลอ้างอิง|อ้างอิงจาก) *==/gi,
        "== อ้างอิง ==",
      )
      .replace(
        /== *(เพิ่มเติม|ดูเพิ่มเติม|ดูเพื่มเติม|ดูเพิ่มที่|อ่านเพิ่ม|อ่านเพิ่มเติม|หัวข้อที่เกี่ยวข้อง|หัวข้ออื่นที่เกี่ยวข้อง|ลิงก์ที่เกี่ยวข้อง) *==/gi,
        "== ดูเพิ่ม ==",
      )
      .replace(
        /== *(เว็บไซต์|เว็บไซต์ภายนอก|เว็บไซต์อื่น|เว็บไซต์ที่เกี่ยวข้อง|ข้อมูลภายนอก|โยงภายนอก|เว็บลิงก์ภายนอก|ลิงก์ภายนอก|ลิงค์ภายนอก|ลิ้งค์ภายนอก|ดูลิงก์ภายนอก|แหล่งข้อมูลภายนอก|แหล่งข้อมูลเพิ่มเติม|แหล่งข้อมูลที่เกี่ยวข้อง|แหล่งข้อข้อมูลอื่น) *==/gi,
        "== แหล่งข้อมูลอื่น ==",
      )
      .replace(
        /== *(Link\s?ภายนอก|link\s?ภายนอก|ลิงก์ข้างนอก|ลิงก์ที่เกี่ยวข้อง|ลิงก์ข้อมูลเพิ่มเติม|เว็บแหล่งข้อมูลอื่น|เชื่อมแหล่งข้อมูลอื่น|เชื่อมโยงลิงก์อื่น|ลิงก์นอก) *==/gi,
        "== แหล่งข้อมูลอื่น ==",
      )
      .replace(
        /== *(ประวัติความเป็นมา|ประวัติส่วนตัว|ความเป็นมา|ชีวประวัติ) *==/gi,
        "$1ประวัติ ==",
      )
      .replace(/\[\[category:/gi, "[[หมวดหมู่:")
      .replace(/\[\[template:/gi, "[[แม่แบบ:")
      .replace(
        /\n{0,}{{โครง(?!-?ส่วน|การพี่น้อง)(.*?)}} ?((?:\n*?\[\[หมวดหมู่:.*?\]\])*)/g,
        "$2\n\n{{โครง$1}}",
      ); // Move stub below categories // was only detecting in NS:0

    /**
     * Fix some unnecessary exeed vowels in Thai in text
     * Taken from iScript modules.
     *
     * @author iScript authors
     * @param {string} text text to fix
     * @return fixed text
     */
    // Fix double Thai vowels
    // # สระหน้า           เ|แ|โ|ใ|ไ
    // # สระหลัง           ะ|า|ๅ
    // # อำ คือ             ำ
    // # สระบน             ั|ิ|ี|ึ|ื|ํ
    // # สระล่าง            ุ|ู|ฺ
    // # ไม้ไต่คู้             ็
    // # วรรณยุกต์          ่|้|๊|๋
    // # ทัณฑฆาต          ์
    // # ไปยาลน้อย        ฯ
    // # ไม้ยมก           ๆ
    // text = text.replace(/(แ|โ|ใ|ไ|ะ|า|ๅ|ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็|่|้|๊|๋|์){2,}/g, "$1") //remove dup

    text = text
      .replace(/ํา/g, "ำ") // Nikhahit (nikkhahit) + Sara Aa -> Saram Am
      .replace(/เเ/g, "แ") // Sara E + Sara E -> Sara Ae
      .replace(/(เ|แ|โ|ใ|ไ)(ะ|า|ๅ|ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็|่|้|๊|๋|์)/g, "$1") // สระหน้า
      .replace(/(ะ|า|ๅ)(ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็|่|้|๊|๋|์)/g, "$1") // สระหลัง
      .replace(/(ำ)(ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็|่|้|๊|๋|์)/g, "$1") // สระอำ
      .replace(/(ั|ิ|ี|ึ|ื|ํ)( ะ|า|ๅ|ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็)/g, "$1") // สระบน
      .replace(/(ุ|ู|ฺ)( ะ|า|ๅ|ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็)/g, "$1") // สระล่าง
      .replace(/(็)( ะ|า|ๅ|ำ|ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็)/g, "$1") // ไม้ไต่คู้
      .replace(/(่|้|๊|๋)(ั|ิ|ี|ึ|ื|ํ|ุ|ู|ฺ|็|่|้|๊|๋|์)/g, "$1") // วรรณยุกต์

      .replace(/\u0E48\u0E48/g, "\u0E48") // Mai Ek
      .replace(/\u0E49\u0E49/g, "\u0E49") // Mai Tho
      .replace(/\u0E4A\u0E4A/g, "\u0E4A") // Mai Tri
      .replace(/\u0E4B\u0E4B/g, "\u0E4B") // Mai Chattawa
      .replace(/์์/g, "์"); // ทัณฑฆาต

    /**
     * Reformatting various text style
     * Taken from iScript modules.
     *
     * @author iScript authors
     * @param {string} text text to fix
     * @return fixed text
     */
    /* reformat - header */
    text = text
      .replace(/\n(={1,5}) ?''' ?(.*) ?''' ?(={1,5})/gm, "\n$1 $2 $3") // == '''หัวข้อ''' == -> == หัวข้อ ==
      .replace(/^= ?([^=].*?) ?=/gm, "== $1 ==") // = หัวข้อ =  -> == หัวข้อ ==
      .replace(/^(={1,5}) *(.*?) ?(={1,5}) *$/gm, "$1 $2 $3"); // ==หัวข้อ== -> == หัวข้อ ==

    /* reformat - parentheses */
    // Add exception for RTL languages. Example:ps:ماينامار(برما)
    var rtlLangPrefix = [
      "ar",
      "arc",
      "ckb",
      "dv",
      "fa",
      "ha",
      "he",
      "khw",
      "ks",
      "ps",
      "sd",
      "ur",
      "yi",
    ]; // https://meta.wikimedia.org/wiki/Template:List_of_language_names_ordered_by_code
    var matches = text.match(
      new RegExp("\\[\\[(?:" + rtlLangPrefix.join("|") + ")\\:.*?\\]\\]", "ig"),
    );
    text = text
      .replace(/(.(?!( f\()).[^\s\[\]\(\_\#\/\{\"\f])\(/g, "$1$2 (") // Ignore f(x) case from f (x)
      .replace(/(.*?)\)([^\s\]\)\|\.\_\#\/\}\"\,\<\"])/g, "$1) $2")
      .replace(/(.*?)\]\]\(/g, "$1]] ("); // Allow spacing for link scenario such as [[Link]](Hello World!)

    if (matches) {
      for (var i in matches) {
        // duplicate of above
        var rtlEdgeCase = matches[i]
          .replace(/(.(?!( f\()).[^\s\[\]\(\_\#\/\{\"\f])\(/g, "$1$2 (") // Ignore f(x) case from f (x)
          .replace(/(.*?)\)([^\s\]\)\|\.\_\#\/\}\"\,\<\"])/g, "$1) $2")
          .replace(/(.*?)\]\]\(/g, "$1]] ("); // Allow spacing for link scenario such as [[Link]](Hello World!)

        // now fix the error
        text = text.replace(rtlEdgeCase, matches[i]);
      }
    }

    /* reformat - others */
    text = text
      .replace(
        new RegExp("\\[\\[(" + pageTitle.replace(/_/g, " ") + ")\\]\\]", "g"),
        "'''$1'''",
      ) // Basic replace [[wgPageName]] to '''wgPageName'''
      .replace(/\[\[หมวดหมู่: {1,}(.*?)\]\]/g, "[[หมวดหมู่:$1]]") // [[หมวดหมู่: xxx]] -> [[หมวดหมู่:xxx]] (เว้นกี่ช่องก็ได้)
      .replace(/{{แม่แบบ:(.*?)}}/g, "{{$1}}") // {{แม่แบบ:xxx}} -> {{xxx}}
      .replace(/(พ|ค)\.? ?ศ. ?(\d{1,4})/g, "$1.ศ. $2") // Fix Year Formatting
      .replace(/^([\*#]+) {0,}/gm, "$1 ") // *xxx -> * xxx (ul) and #xxx -> # xxx (ol)
      .replace(/<\/(.*?) {1,}>/g, "</$1>") // Fix tag spacing, </xxx > -> </xxx>
      .replace(
        /<ref(.*?)> ?({{.*? icon}}) ?(.*?) ?<\/ref>/g,
        "<ref$1>$3 $2</ref>",
      ); // Fix lang icons: Move from front to back // แก้ <ref...> {{...}} [...] </ref> -> <ref...>[...] {{...}}</ref> // Case Study: //th.wikipedia.org/w/index.php?title=เหตุการณ์แผ่นดินไหวในมณฑลเสฉวน_พ.ศ._2551&diff=1161797&oldid=1152067

    // Remove signatures on article pages if not uncyclopedia
    text = text.replace(/-{0,2} ?\[\[ผู้ใช้:.*/g, "");

    // Fix Template Parameters Layout: Move | from back to front (using Top to Bottom approach)
    text = text.replace(
      / *\|(?!-) *\r?\n *([^=\*<|{}]*?) ?=(?!=) *([^\|={}]*?)/gm,
      "\n| $1 = $2",
    ); // รวมแก้สองอย่างโดยการตรวจย้ายบนไปล่างแทน
    // text = text.replace(/({{.*)(?!})\| *\r/g,"$1");                                   //แก้ {{... | -> {{...
    // text = text.replace(/(\n) *([^|{}]*?) ?= *([^|{}]*?)\| *\r/g,"$1| $2 = $3");      //แก้ ... | -> | ...

    // TODO: Need comments for code below for maintenance reasons: Hard to debug
    text = text.replace(
      /\n *\|(?!-) *([^={}\*].*?) ?= *([^<={}]*?) \| ?( *}} *\r?\n| *\r?\n *}} *\r?\n)/g,
      "\n| $1 = $2\n}}\n",
    ); // รุ่นใหม่ แค่จับขึ้นบรรทัดใหม่
    // text = text.replace(/(\n) *([^\|{}].*?) ?= *([^|{}]*?)(}}\r\n|\r\n *}})/g,"$1| $2 = $3\n}}");//แก้ ... -> | ...

    // Fix Template Parameters Layout: Add extra space in betweens
    text = text.replace(
      /\r?\n *\|(?!-) *([^=\|\?'"{}]*?) ?= *([^=]*?) */g,
      "\n| $1 = $2",
    );

    // Fix Template: Remove extra | if exist at the end
    text = text.replace(
      /\n *\|(?!-) *([^=\|'"{}]*?)=([^=\|]*?) ?\r?\n?\| ?\r?\n?\}\}(?!\})/g,
      "\n| $1 = $2\n}}",
    ); // | abc = 123 | }} -> | abc = 123 }}

    // Replace 3+ newlines with just two
    text = text.replace(/(?:[\t ]*(?:\r?\n|\r)){3,}/gi, "\n\n");
    // Remove all whitespace at the top of the article
    text = text.replace(/^\s*/, "");

    return text;
  }

  removeEmptySectionAtEnd(wikicode: string) {
    // Hard to write a regex that doesn't catastrophic backtrack while still saving multiple categories and multiple blank lines. So we'll do this the old-fashioned way...

    // Divide wikitext into lines
    let lines = wikicode.split("\n");

    // Buffers
    const linesToKeep = [];
    let i;

    // Crawl the list of lines backward (bottom up)
    let count = lines.length;
    for (i = count - 1; i >= 0; i--) {
      const line = lines[i];
      const isWhitespace = line.match(/^\s*$/);
      const isCategory = line.match(/^\s*\[\[:?(?:Category|หมวดหมู่):/i);
      const isHeading = line.match(/^==[^=]+==$/i);

      if (isWhitespace || isCategory) {
        linesToKeep.push(line);
        continue;
      } else if (isHeading) {
        break;
      }

      // If it's something besides the three things above, such as text, then there's no blank headings to delete. Return unaltered wikitext. We're done.
      return wikicode;
    }

    // Delete the lines we checked from the array of lines. We'll be replacing these with new lines in a moment.
    lines = lines.slice(0, i);

    // Add the categories and blank lines back
    // Need to iterate backward, same as the loop above
    count = linesToKeep.length;
    for (let j = count - 1; j >= 0; j--) {
      const lineToKeep = linesToKeep[j];
      lines.push(lineToKeep);
    }

    wikicode = lines.join("\n");

    // The old algorithm had some quirks related to adding and removing \n. Mimic the old algorithm for now, so that unit tests pass and users don't have to get used to new behavior.
    if (wikicode.match(/\n\n$/)) {
      wikicode = wikicode.slice(0, -1);
    }
    wikicode = wikicode.replace(/\n(\n\n\[\[:?(?:Category|หมวดหมู่):)/i, "$1");

    return wikicode;
  }
}
