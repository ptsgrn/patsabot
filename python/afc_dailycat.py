import pywikibot
import os
from pywikibot import Site, login
import datetime

opt = {
    'category': 'หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/{date}',
    'header_template': '{{AfC submission category header}}',
    'summary': 'สร้างหมวดหมู่ฉบับร่างสำหรับ [[WP:AfC]]',
}

site = Site('th', 'wikipedia')

_month_name = {
    1: 'มกราคม',
    2: 'กุมภาพันธ์',
    3: 'มีนาคม',
    4: 'เมษายน',
    5: 'พฤษภาคม',
    6: 'มิถุนายน',
    7: 'กรกฎาคม',
    8: 'สิงหาคม',
    9: 'กันยายน',
    10: 'ตุลาคม',
    11: 'พฤศจิกายน',
    12: 'ธันวาคม'
}


def main():
    current_date = datetime.datetime.now()
    create_new_page(current_date.strftime('%d {month} %Y').format(
        month=_month_name[current_date.month]))
    if current_date.day == 1:
        create_new_page(current_date.strftime('{month} %Y').format(
            month=_month_name[current_date.month]))
    if current_date.month == 1 and current_date.day == 1:
        create_new_page(current_date.strftime('%Y'))


def create_new_page(date_str):
    pagename = opt['category'].format(date=date_str)
    pywikibot.output('Creating page: ' + pagename)
    page = pywikibot.Page(site, pagename)
    if page.exists():
        print('Page already exists')
        return
    page.text = opt['header_template']
    page.save(summary=opt['summary'])


main()
