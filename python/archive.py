#!/usr/bin/python3
# -*- coding: utf-8 -*-
# LGPLv2+ license, look it up
# specifically for Thai Wiki(s)

import builtins
import collections
import sys
from collections import abc, OrderedDict
import re
import time
import locale
import traceback
import hashlib
# from typing import OrderedDict

import twiggy
from arrow import Arrow
from datetime import timedelta
from ceterach.api import MediaWiki
from ceterach.page import Page
from ceterach import exceptions as exc
import json

import mwparserfromhell as mwp

API_URL = "https://th.wikipedia.org/w/api.php"
LOGIN_INFO = "PatsaBot", json.load(open("../credentials.json", "rb"))["password"]
SHUTOFF = u"ผู้ใช้:PatsaBot/shutoff/archive"
ARCHIVE_TPL = u"แม่แบบ:เก็บอภิปรายอัตโนมัติ/ทดสอบ"
FREQ = 30

logger = twiggy.log.name("archivebot")
locale.setlocale(locale.LC_ALL, "en_US.utf8")
                     #   23:42, 14 พฤศจิกายน 2563 (+07)
                     #   2 3: 4 2, 14      พฤศจิกายน 2563      (+07 )
STAMP_RE = re.compile(r"\d\d:\d\d, \d{1,2} (มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม) (\d\d\d\d) \(\+07\)") # for thai-wiki
THE_FUTURE = Arrow.utcnow() + timedelta(365)
MONTHS_ENGLISH = (None, "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
)
MONTHS = (None, "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
          "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
)
MONTHS_SHORT = (None, "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
          "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.")


class ArchiveError(exc.CeterachError):
    """Generic base class for archive exceptions"""


class ArchiveSecurityError(ArchiveError):
    """Archive is not a subpage of page being archived and key not specified
    (or incorrect)."""


def twiggy_setup():
    everything_out = twiggy.outputs.StreamOutput(twiggy.formats.line_format)
    main_out = twiggy.outputs.FileOutput(
        "archivebot.log",
        twiggy.formats.line_format,
        msg_buffer=FREQ
    )
    err_out = twiggy.outputs.FileOutput("errlog", twiggy.formats.line_format)
    twiggy.add_emitters(
        ("everything", twiggy.levels.DEBUG, None, everything_out),
        ("main", twiggy.levels.INFO, None, main_out),
        ("err", twiggy.levels.ERROR, None, err_out)
    )


def mwp_parse(text):
    # Earwig :(
    return mwp.parser.Parser().parse(text, skip_style_tags=True)


def all_entities(text: str):
    ret = ''
    for ch in text:
        ret += "&#" + str(ord(ch)) + ";"
    return ret


def ucfirst(s: str):
    """Now with better namespace checks"""
    if ":" in s:
        if s.count(":") != 1:
            return s
        return ":".join(map(ucfirst, s.split(":")))
    return s[0].upper() + s[1:] if len(s) else s


def make_key(title, target):
    """echo -en "${salt}\n${title}\n${target}" | sha256sum"""
    sha256sum = hashlib.new("sha256", json.load(open("../credentials.json", "rb"))["scripts"]["archive"]["key_salt"])
    sha256sum.update(b'\n')
    sha256sum.update(title.encode("utf8"))
    sha256sum.update(b'\n')
    sha256sum.update(target.encode("utf8"))
    return sha256sum.hexdigest()


class RedoableIterator(abc.Iterator):
    """
    Put a value back in the top of the stack of the generator.
    In Perl, you would do:
    while (my $v = $iterable_obj->next()) { func(); redo }
    In Python, you would do:
    for v in iterable_obj:
        func()
        iterable_obj.redo()
        continue
    """
    def __init__(self, iterable_obj):
        self.data = iter(iterable_obj)
        self._redo = False

    def __next__(self):
        if self._redo:
            self._redo = False
            return self._val
        self._val = next(self.data)  # The StopIteration will propagate
        return self._val

    def redo(self):
        self._redo = True


'''
class OrderedDefaultdict(abc.defaultdict, abc.OrderedDict):
    def __init__(self, default_factory, *args, **kwargs):
        abc.defaultdict.__init__(self, default_factory)
        abc.OrderedDict.__init__(self, *args, **kwargs)
'''  # Both implemented in Python so you get a TypeError

# https://stackoverflow.com/a/6190500
class OrderedDefaultdict(OrderedDict):
    # Source: http://stackoverflow.com/a/6190500/562769
    def __init__(self, default_factory=None, *a, **kw):
        if (default_factory is not None and
            not callable(default_factory)):
            #not isinstance(default_factory, abc.Callable)):
            raise TypeError('first argument must be callable')
        super().__init__(*a, **kw)
        self.default_factory = default_factory

    def __getitem__(self, key):
        try:
            return super().__getitem__(key)
        except KeyError:
            return self.__missing__(key)

    def __missing__(self, key):
        if self.default_factory is None:
            raise KeyError(key)
        self[key] = value = self.default_factory()
        return value

    def __reduce__(self):
        if self.default_factory is None:
            args = tuple()
        else:
            args = self.default_factory,
        return type(self), args, None, None, self.items()

    def copy(self):
        return self.__copy__()

    def __copy__(self):
        return type(self)(self.default_factory, self)

    def __deepcopy__(self, memo):
        import copy
        return type(self)(self.default_factory,
                          copy.deepcopy(self.items()))

    def __repr__(self):
        return 'OrderedDefaultdict(%s, %s)' % (self.default_factory,
                                               OrderedDict.__repr__(self))

def str2time(s: str):
    """Accepts a string defining a time period:
    7d - 7 days
    36h - 36 hours
    Returns the corresponding time, measured in seconds."""
    s = str(s)
    s = s.lower()
    try:
        if s[-1] == 'd':
            return timedelta(seconds=int(s[:-1]) * 24 * 3600)
        elif s[-1] == 'h':
            return timedelta(seconds=int(s[:-1]) * 3600)
        else:
            return timedelta(seconds=int(s))
    except OverflowError:
        return timedelta.max


def str2size(s: str):
    """Accepts a string defining a size:
    1337 - 1337 bytes
    150K - 150 kilobytes
    2M - 2 megabytes
    20T - 20 threads
    Returns a tuple (size,unit), where size is an integer and unit is
    'B' (bytes) or 'T' (threads)."""
    # AT LAST, THIS FUNCTION HAS BEEN DE-UGLIFIED
    s = str(s)
    unit = s[-1].lower()
    # int() handles other strange unicode characters too, so yay
    # http://www.fileformat.info/info/unicode/category/Nd/list.htm
    allowed_units = {'b': 1, 'k': 1024, 'm': 1024 * 1024, 't': 1, '': 1}
    allowed_units = collections.defaultdict(lambda: 1024 * 1024, **allowed_units)
    if not unit in allowed_units and not unit.isdecimal():
        raise TypeError("Bad input")
    if unit in allowed_units:
        s = s[:-1]
    if not s.isdecimal():
        raise TypeError("Bad input")
    if (s + unit).isdecimal():
        unit = ''
    if int(s) == 0:
        raise TypeError("Zero is not allowed")
    return int(s) * allowed_units[unit], "T" if unit == 't' else "B"


class DiscussionPage(Page):
    def __init__(self, api: MediaWiki, title: str, archiver, simulate: bool):
        super().__init__(api, title)
        self.archiver = archiver
        self.talkhead = ""
        self.threads = []
        self.sections = []
        self.simulate = simulate

    def reset(self):
        self.threads = []
        self.sections = []
        self.talkhead = ""

    def generate_threads(self):
        code = mwp_parse(self.content)
        sects = iter(code.get_sections())
        # We will always take the 0th section, so might as well eat it
        self.talkhead = str(next(sects))
        for section in sects:  # WT:TW
            if section.get(0).level < 3:
                break
            self.talkhead += str(section)
        del sects  # Large talk pages will waste memory
        for section in code.get_sections(levels=[1, 2]):
            head = section.filter_headings()[0]
            if head.level == 1:
                # If there is a level 1 header, it probably has level 2 children.
                # Because get_sections(levels=[1, 2]) will yield the level 2 sections
                # later, we can just take the level 1 header and ignore its children.
                section = section.get_sections(include_lead=False, flat=True)[0]
            d = {"header": "", "content": "",
                 ("header", "content"): "",
                 "stamp": THE_FUTURE,
                 "oldenough": False
            }
            d['header'] = str(head)
            d['content'] = str(section[len(head):])
            d['header', 'content'] = str(section)
            self.threads.append(d)
            self.sections.append(section)
        self.parse_stamps()  # Modify this if the wiki has a weird stamp format - yes, we're

    def parse_stamps(self, expr=STAMP_RE, fmt='%H:%M, %d %B %Y (%z)'):
        stamps = []
        algo = self.archiver.config['algo']
        try:
            maxage = str2time(re.search(r"^old\((\w+)\)$", algo).group(1))
        except AttributeError as e:
            e.args = ("Malformed archive algorithm",)
            raise ArchiveError(e)
        for thread in self.threads:
            if mwp_parse(thread['header']).get(0).level != 2:
                # the header is not level 2
                stamps = []
                continue
            for stamp in expr.finditer(thread['content']):
                # This for loop can probably be optimised, but ain't nobody
                # got time fo' dat
                _stamp = stamp.group(0)
                # this will be parse by Arrow.strptime() below so preprocess it
                # replace Thai month with English month
                for index, month_en in enumerate(MONTHS_ENGLISH):
                    if month_en is None:
                        continue
                    _stamp = _stamp.replace(MONTHS[index], month_en)
                # replace Thai BE year
                _stamp = _stamp.replace(stamp.group(2), str(int(stamp.group(2))-543))
                _stamp = _stamp.replace("(+07)","(+0700)")
                try:
                    stamps.append(Arrow.strptime(_stamp, fmt))
                except ValueError:  # Invalid stamps should not be parsed, ever
                    continue
            if stamps:
                # The most recent stamp should be used to see if we should archive
                most_recent = max(stamps)
                thread['stamp'] = most_recent
                thread['oldenough'] = Arrow.utcnow() - most_recent > maxage
                pass  # No stamps were found, abandon thread
            stamps = []

    def rebuild_talkhead(self, dry=False):
        """
        Specify the dry parameter if you only want to see if there's
        an archive template on the page.
        """
        new_tpl = self.archiver.generate_template()
        talkhead = mwp_parse(self.talkhead)
        for talkhead_tpl_ref in talkhead.filter_templates():
            tpl_name = talkhead_tpl_ref.name.strip_code().strip() 
            if ucfirst(tpl_name) == ucfirst(self.archiver.tl):
                break
        else:
            raise ArchiveError("No talk head")
            #return 0x1337  # Our duty is done, and this function broke
        if dry:
            return  # Our duty is done, and this function worked
        for p in new_tpl.params:
            if talkhead_tpl_ref.has_param(p.name):
                talkhead_tpl_ref.add(p.name, p.value)
        self.talkhead = str(talkhead)
        del new_tpl, talkhead

    def update(self, archives_touched=None):
        """Remove threads from the talk page after they have been archived"""
        self.rebuild_talkhead()
        text = str(self.talkhead) + "".join(map(str, self.sections))
        # Instead of counting the sections in the archives, we can count the
        # sections we removed from the page
        arch_thread_count = len([sect for sect in self.sections if not sect])
        # Fancier edit summary stuff
        summ = "เก็บ {0} การอภิปรายไปยัง {1}) (บอต"
        titles = "/dev/null"
        if archives_touched:
            titles = ", ".join("[[" + tit + "]]" for tit in archives_touched)
        summ = summ.format(arch_thread_count, titles)
        # But wait, there's more!
        maybe_error = sys.exc_info()[1]
        if isinstance(maybe_error, Exception):
            # This means this method was called by unarchive_threads()
            err = traceback.format_exception_only(*sys.exc_info()[:2])
            err = ''.join(err)
            summ = "เก็บลงกรุไม่สำเร็จ: {}) (บอต".format(err.strip())
            archives_touched = None  # unarchiving doesn't touch stuff
        if text != self.content:
            if not archives_touched and not maybe_error:
                # The talk page was changed, but nothing was archived
                raise ArchiveError("Nothing moved to archives")
            try:
                if self.simulate:
                    logger.info("SIMULATE: {} {}", summ, text)
                else:
                    logger.info("{}", self.edit(text, summ, minor=True, bot=True))
            except exc.SpamFilterError as e:
                if e.code == 'spamblacklist':
                    # The only way to override the spam blacklist is to nowiki it
                    nul = "<nowiki>", "</nowiki>"
                    code = mwp_parse(text)
                    bad_strings = e.response['matches']
                    for url in code.filter_external_links():
                        if any(s in url for s in bad_strings):
                            url.url = url.url.join(nul)
                    text = str(code)
                    del code
                    if self.simulate:
                        logger.info("SIMULATE: {} {}", summ, text)
                    else:
                        logger.info("{}", self.edit(text, summ, minor=True, bot=True))
            return
        if not archives_touched:
            return  # The talk page was not changed, and nothing was archived
        # Otherwise, blow up and move on
        raise ArchiveError("Nothing happened")


class Archiver:
    def __init__(self, api: MediaWiki, title: str, tl="เก็บอภิปรายอัตโนมัติ/ทดสอบ", simulate=False):
        self.config = {'algo': 'old(24h)',
                       'archive': '',
                       'archiveheader': "{{กรุ}}{{กล่องกรุ/หน้าใน}}",
                       'maxarchivesize': '1954K',
                       'minthreadsleft': 5,
                       'minthreadstoarchive': 2,
                       'counter': 1,
                       'oldcounter': 1,  # For internal use by the bot
                       'key': '',
        }
        self.api = api
        self.tl = tl
        self.archives_touched = frozenset()
        self.indexes_in_archives = collections.defaultdict(list)
        self.page = DiscussionPage(api, title, self, simulate=simulate)

    def generate_config(self):
        """Extracts options from the archive template."""
        # I literally copied this part from self.page.generate_threads()
        code = mwp_parse(self.page.content)
        sects = iter(code.get_sections())
        self.page.talkhead = str(next(sects))
        for section in sects:
            if section.get(0).level < 3: break
            self.page.talkhead += str(section)
        del sects
        code = mwp_parse(self.page.talkhead)  # The template MUST be in the talkhead
        try:
            template = next(code.ifilter_templates(matches=self.tl))
        except StopIteration:
            raise ArchiveError("No talk head")
        for p in template.params:
            if p.name.strip() != "archiveheader":
                # Strip html comments from certain parameters
                for html_cmt in p.value.filter_comments():
                    p.value.remove(html_cmt)
            self.config[p.name.strip()] = p.value.strip()
        arch_string = self.config['archive'].replace("_", " ").strip()
        self.config['archive'] = arch_string
        try:
            # All these config options must be integers
            counter_ = str(self.config['counter'])
            self.config['counter'] = abs(int(counter_ if counter_.isdecimal() else 1)) or 1
            self.config['oldcounter'] = self.config['counter']
            self.config['minthreadstoarchive'] = int(self.config['minthreadstoarchive'] or 1)
            self.config['minthreadsleft'] = int(self.config['minthreadsleft'] or 1)
        except ValueError as e:
            print("Could not intify:", self.page.title)
            raise ArchiveError(e)

    def generate_template(self):
        """Return a template with an updated counter"""
        # DONTFIXME: Preserve template formatting shit
        # This is only called so the params can be extracted.
        code = mwp.nodes.Template(self.tl)
        for paramname, val in self.config.items():
            code.add(paramname, val)
        return code

    def archive_threads(self):
        """Move the threads from the talk page to the archives."""
        def make_params():
            return {'counter': self.config['counter'],
                    'year': stamp.year + 543,
                    'ceyear': stamp.year,
                    'quarter': (stamp.month-1)//3 + 1,
                    'month': stamp.month,
                    'monthname': MONTHS[stamp.month],
                    'monthnameshort': MONTHS_SHORT[stamp.month],
                    'week': stamp.week,
            }
        keep_threads = self.config['minthreadsleft']
        fmt_str = self.config['archive']
        max_arch_size = str2size(self.config['maxarchivesize'])
        arched_so_far = 0
        archives_to_touch = OrderedDefaultdict(str)
        # self.indexes_in_archives already set in __init__
        # strftime() to create the keys for archives_to_touch
        # Values should be the text to append, text should be matched to
        # corresponding key based on where the thread belongs
        # Then iterate over .items() and edit the pages
        p = self.api.page("ถ่านหิน")
        arch_pages = {p.title: p}  # Caching page titles to avoid API spam
        arch_thread_count, arch_size, text = 0, 0, ''  # This shuts up PyCharm
        # Archive the oldest threads first, not the highest threads
        # that happen to be old
        threads_with_indices = enumerate(self.page.threads)
        threads_with_indices = sorted(threads_with_indices, key=lambda t: t[1]['stamp'])
        threads_with_indices = RedoableIterator(threads_with_indices)
        for index, thread in threads_with_indices:
        #for index, thread in enumerate(self.page.threads):
            if len(self.page.threads) - arched_so_far <= keep_threads:
                logger.info("Keep at least {} threads on {}", keep_threads, self.page.title)
                break
            if not thread["oldenough"]:
                continue  # Thread is too young to archive
            stamp = thread['stamp']
            logger.info("{} is old enough ({})", thread['header'], stamp)
            params = make_params()
            subpage = fmt_str % params
            if not subpage in arch_pages:
                p = self.api.page(subpage)
                arch_pages[subpage] = p
                try:
                    text = mwp_parse(p.content)
                except exc.NonexistentPageError:
                    text = mwp_parse("")
                arch_thread_count = len(text.get_sections(levels=[2]))
                arch_size = len(text)
            else:
                p = arch_pages[subpage]
            if max_arch_size[1] == "T":
                # Size is measured in threads
                if arch_thread_count + 1 > max_arch_size[0]:
                    logger.fields(measure="T").info("Increment counter")
                    self.config['counter'] += 1
                    params = make_params()
                    if fmt_str % params == subpage:
                        # Now we will increment the counter ad SIGINTum
                        break
                    threads_with_indices.redo()
                    continue
            elif max_arch_size[1] == "B":
                # Size is measured in bytes
                if len(thread['header', 'content']) + arch_size > max_arch_size[0]:
                    # But if len(thread) > max arch size, we will increment
                    # the counter ad SIGINTum
                    # Therefore:
                    if arch_size == 0:
                        # Put it in anyway, and make an archive with 1 thread
                        pass
                    else:
                        logger.fields(measure="B").info("Increment counter")
                        self.config['counter'] += 1
                        params = make_params()
                        if fmt_str % params == subpage:
                            # Now we will increment the counter ad SIGINTum
                            break
                        threads_with_indices.redo()
                        continue
            logger.info("Archive subpage: {}", p.title)
            arch_size += len(self.page.sections[index])
            arched_so_far += 1
            arch_thread_count += 1
            if archives_to_touch[subpage]\
                and not (archives_to_touch[subpage].endswith("\n")
                         or self.page.sections[index].startswith("\n")):
                archives_to_touch[subpage] += '\n'
            archives_to_touch[subpage] += str(self.page.sections[index])
            self.indexes_in_archives[subpage].append(index)
            # Remove this thread from the talk page
            self.page.sections[index] = ""
        self.archives_touched = frozenset(archives_to_touch)
        archives_actually_touched = []
        if arched_so_far < self.config['minthreadstoarchive']:
            # We might not want to archive a measly few threads
            # (lowers edit frequency)
            self.archives_touched = frozenset()
            if arched_so_far > 0:
                # Useful output so we don't leave you hanging on "Archive subpage:"
                logger.info("Need more threads to archive")
            return  # Finished, so raise StopIteration
        yield None  # I am such an evil Pythoneer
        for title, content in archives_to_touch.items():
            page = arch_pages[title]  # Actually implement the caching
            arch_thread_count = len(mwp_parse(content).get_sections(levels=[2]))
            summ = "เก็บ {0} การอภิปรายลงกรุจาก [[{1}]]) (บอต"
            summ = summ.format(arch_thread_count, self.page.title)
            try:
                if page.exists:
                    logger.info("{}", page.append("\n\n" + content, summ, minor=True, bot=True))
                else:
                    content = self.config['archiveheader'] + "\n\n" + content
                    logger.info("{}", page.create(content, summ, minor=True, bot=True))
            except exc.SpamFilterError as e:
                if e.code == 'spamblacklist':
                    # The only way to override the spam blacklist is to nowiki it
                    nul = "<nowiki>", "</nowiki>"
                    code = mwp_parse(content)
                    bad_strings = e.response['matches']
                    for url in code.filter_external_links():
                        if any(s in url for s in bad_strings):
                            url.url = url.url.join(nul)
                    content = str(code)
                    del code
                    if page.exists:
                        logger.info("{}", page.append("\n\n" + content, summ, minor=True, bot=True))
                    else:
                        logger.info("{}", page.create(content, summ, minor=True, bot=True))
            logger.fields(p=page.title).info("Actually archived")
            archives_actually_touched.append(title)
            # If the bot explodes mid-loop, we know which archive pages
            # were actually saved
            self.archives_touched = frozenset(archives_actually_touched)
        yield None  # Finished

    def unarchive_threads(self):
        """Restore the threads that were not archived to the talk page"""
        untouched_archives = self.indexes_in_archives.keys() - self.archives_touched
        #                          archives to touch       archives actually touched
        if not untouched_archives:
            # If we couldn't edit a single archive, restore the whole TP
            untouched_archives = self.archives_touched
        total_counter_increments = self.config['counter'] - self.config['oldcounter']
        for untouched in untouched_archives:
            total_counter_increments -= 1
            for index in self.indexes_in_archives[untouched]:
                # Reconstruct the section from self.page.threads
                thread = self.page.threads[index]
                text = str(thread['header']) + str(thread['content'])
                self.page.sections[index] = text
        if 0 < total_counter_increments:
            # Suppose we failed the first archive, and didn't increment?
            # Thus, we need to see how many times we incremented the counter,
            # and decrement it for each archive we didn't actually touch.
            # If result le 0, it means we did not increment the counter, but
            # we didn't touch some archives.
            # Otherwise, we incremented the counter, and also touched some
            # archives, and as such, we can do subtraction to find the correct
            # counter to restore.
            self.config['counter'] -= total_counter_increments
        self.page.update()

    def key_ok(self):
        return self.config['key'] == make_key(self.page.title, self.config.get('archive', ''))

    def run(self):
        self.generate_config()  # If it fails, abandon page
        self.page.generate_threads()
        self.page.rebuild_talkhead(dry=True)  # Raises an exception if it fails
        if not self.config['archive'].startswith(self.page.title + "/"):
            if not self.key_ok():
                raise ArchiveSecurityError("Bad key: " + repr(self.config['key']))
        time_machine = self.archive_threads()
        try:
            next(time_machine)  # Prepare the archive pages
        except StopIteration:  # Don't archive a measly few threads
            return
        # Now let's pause execution for a bit
        #self.page.update(self.archives_touched)  # Assume that we won't fail
        # Save the archives last (so that we don't fuck up if we can't edit the TP)
        # Bugs won't cause a loss of data thanks to unarchive_threads()
        #next(time_machine)  # Continue archiving
        # try to deal with blacklists this way?
        next(time_machine)
        self.page.update(self.archives_touched)


import unittest


class TestShit(unittest.TestCase):
    def setUp(self):
        self.config = {'algo': 'old(24h)',
                       'archive': '',
                       'archiveheader': "{{กรุ}}",
                       'maxarchivesize': '1000M',
                       'minthreadsleft': 5,
                       'minthreadstoarchive': 2,
                       'counter': 1,
                       'oldcounter': 1,
                       'key': '',
        }

    def modified_generate_config(self, k):
        import urllib.parse
        arch_string = self.config['archive'].replace("_", " ").strip()
        arch_string = urllib.parse.unquote(arch_string)
        self.config['archive'] = arch_string  # Normalise the archive titles
        try:
            # All these config options must be integers
            counter_ = str(self.config['counter'])
            self.config['counter'] = int(counter_ if counter_.isdecimal() else 1) or 1
            self.config['minthreadstoarchive'] = int(self.config['minthreadstoarchive'] or 1)
            self.config['minthreadsleft'] = int(self.config['minthreadsleft'] or 1)
        except ValueError:
            print("Could not intify:", "<unittest>", self.config)
            raise
        if k:
            return self.config[k]

    def test_counter_shit(self):
        self.config['counter'] = s = 0
        self.assertEqual(1, self.modified_generate_config('counter'))
        self.config['counter'] = s = s - 3  # -3
        self.assertEqual(1, self.modified_generate_config('counter'))
        self.config['counter'] = s = s + 4j  # -3 + 4j
        self.assertEqual(1, self.modified_generate_config('counter'))
        self.config['counter'] = s = '`'  # Non-number
        self.assertEqual(1, self.modified_generate_config('counter'))
        self.config['counter'] = s = 'oeutuonoi'  # Non-numbers again
        self.assertEqual(1, self.modified_generate_config('counter'))
        self.config['counter'] = s = '12345'  # West Arabic numbers
        self.assertEqual(12345, self.modified_generate_config('counter'))
        self.config['counter'] = s = "१२३४५६७८९०"  # Devanagari numbers
        self.assertEqual(1234567890, self.modified_generate_config('counter'))
        self.config['counter'] = s = "00000000"
        self.assertEqual(1, self.modified_generate_config('counter'))

    def test_str2size(self):
        def foo(res):
            return str2size(res)[0]
        s = "200T"
        self.assertEqual(200, foo(s))
        s = "some random string"
        self.assertRaises(TypeError, lambda: foo(s))
        s = "some random string with a unit at the endK"
        self.assertRaises(TypeError, lambda: foo(s))
        s = ""
        self.assertRaises(IndexError, lambda: foo(s))
        s = "-423B"
        self.assertRaises(TypeError, lambda: foo(s))
        s = "14"
        self.assertEqual(14, foo(s))
        s = "3004M"
        self.assertEqual(3004 * 1024 * 1024, foo(s))
        s = "444S"
        self.assertRaises(TypeError, lambda: foo(s))
        s = "१२३४५६७८९०"
        self.assertEqual(1234567890, foo(s))
        s = "١٢٣٤٥٦٧٨٩٠"  # East Arabic
        self.assertEqual(1234567890, foo(s))
        s = "۹"  # Perso-Arabic
        self.assertEqual(9, foo(s))
        s = "0"
        self.assertRaises(TypeError, lambda: foo(s))
        s = "00000000K"
        self.assertRaises(TypeError, lambda: foo(s))

    def test_str2time(self):
        s = "12d"
        self.assertEqual(12 * 24 * 60 * 60, str2time(s).total_seconds())
        s = "33"
        self.assertEqual(33, str2time(s).total_seconds())
        s = "some random string"
        self.assertRaises(ValueError, lambda: str2time(s).total_seconds())
        s = ""
        self.assertRaises(IndexError, lambda: str2time(s).total_seconds())
        s = "१२३४५६७८९०"
        self.assertEqual(1234567890, str2time(s).total_seconds())
        s = "-10"  # get instant archiving by setting algo to 0 or under
        self.assertEqual(-10, str2time(s).total_seconds())
        s = "-10h"
        self.assertEqual(-10 * 60 * 60, str2time(s).total_seconds())
        s = "34j"
        self.assertRaises(ValueError, lambda: str2time(s).total_seconds())

if __name__ == "__main__":
    # unittest.main(verbosity=2)
    # exit(0)
    import itertools

    def grouper(iterable, n, fillvalue=None):
        """Collect data into fixed-length chunks or blocks"""
        # grouper('ABCDEFG', 3, 'x') --> ABC DEF Gxx"
        # Stolen from http://docs.python.org/3.3/library/itertools.html
        args = [iter(iterable)] * n
        return itertools.zip_longest(*args, fillvalue=fillvalue)

    def page_gen_dec(ns):
        def decorator(func):
            # You're lucky I didn't nest this a second time
            real_dec = lambda *pages: (":".join([ns, shit]) for shit in func(*pages))
            return real_dec
        return decorator

    generic_func = lambda *pgs: pgs

    ut = page_gen_dec("คุยกับผู้ใช้")(generic_func)
    t = page_gen_dec("พูดคุย")(generic_func)
    wp = page_gen_dec("วิกิพีเดีย")(generic_func)
    wt = page_gen_dec("คุยเรื่องวิกิพีเดีย")(generic_func)

    twiggy_setup()

    api = MediaWiki(API_URL, config={"retries": 9, "sleep": 9, "maxlag": 9, "throttle": 0.5})
    api.login(*LOGIN_INFO)
    logger.info('Logged in.')
    #api.login("throwaway", "aoeui")
    #api.login("my password is literally just password", "password")
    api.set_token("edit")
    shutoff_page = api.page(SHUTOFF)
    victims = itertools.chain((x['title'] for x in api.iterator(list='embeddedin',
                                                                eititle=ARCHIVE_TPL,
                                                                einamespace=[3,4],
                                                                #eititle="Template:Experimental archiving",
                                                                eilimit=500)),
                              # wp("Administrators' noticeboard/Edit warring",
                              #    "Requests for undeletion",
                              # ),
                              # t("RuneScape",
                              #   "Main Page",
                              # ),
                              # wt("Did you know",
                              #    "Twinkle",
                              # ),
    )
    issimmulate = False
    if len(sys.argv) > 1:
        victims = sys.argv[1:]
        issimmulate = '--simulate' in sys.argv
    for subvictims in grouper(victims, FREQ, None):
        subvictims = RedoableIterator(subvictims)
        # To not spam the API, only check the shutoff page every $FREQ archives.
        try:
            shutoff_page.load_attributes()
        except exc.ApiError:
            # We'll survive another $FREQ pages
            pass
        if shutoff_page.content.lower() != "on":
            logger.info("Check the shutoff page, exiting.")
            break
        api.set_token("edit")
        for victim in subvictims:
            if victim is None:
                # TODO: Convert this part into iter(func, sentinel=None)
                break
            bot = Archiver(api, victim, simulate=issimmulate)
            try:
                logger.fields(p=victim).info("Beginning to work")
                bot.run()
            except Exception as e:
                crap = e
                logger.fields(p=victim).trace().error("Try to unarchive")
                if isinstance(e, ArchiveError):
                    continue
                elif isinstance(e, exc.ApiError):
                    time.sleep(5)
                    subvictims.redo()
                    continue
                try:
                    bot.unarchive_threads()
                except:
                    logger.fields(p=victim).trace().critical("Failed to unarchive")
                    continue
            else:
                logger.fields(p=victim).info("Done")