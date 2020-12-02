import os
import ipaddress
import pytz
import re
from enum import Enum
from collections import namedtuple
from django.db import models
from django.utils import timezone
from config.settings import MEDIA_ROOT
from django.db import connection
from html.parser import HTMLParser
from posts.owls import *
from django.core.urlresolvers import reverse

boards = None

POSTS_QUERY_GEO_APPENDIX = \
    "(select iso_code         from geo_countries where visible_country = geo_countries.id) as country_iso, " +\
    "(select visible_ukr_name from geo_countries where visible_country = geo_countries.id) as country_name, " +\
    "(select visible_ukr_name from geo_cities where visible_city = geo_cities.id) as city_name"

def named_tuple_fetch_all(cursor):
    desc = cursor.description
    nt_result = namedtuple('Result', [col[0] for col in desc])
    return [nt_result(*row) for row in cursor.fetchall()]


def get_all_last_posts(limit = None):
    limit = limit or 9999
    posts = []
    with connection.cursor() as cursor:
        cursor.execute(
            last_posts_query("select *, (select board from threads where op = id or op = thread) as board, " +
                POSTS_QUERY_GEO_APPENDIX + " from posts order by creation desc limit %s"),
            [limit])
        posts.extend(extract_posts(cursor, None))
    return sorted(posts, key=lambda post: post['time'], reverse=True)[:limit]


def beautify_custom_sign(custom_sign):
    if custom_sign == '<b><span style="color:#a00">hyper</span>kun</b>':
        return '<span style="color:#a00">hyper</span><span style="color:#333">kun</span>'
    else:
        return custom_sign


def extract_posts(cursor, board_name):
    posts = named_tuple_fetch_all(cursor)
    dm = Demarkuper()
    return [{
        'id': int(post.id),
        'body': convert_to_classic_markup(board_name or post.board, post.text),
        'body_nomarkup': dm.feeda(post.text),
        'thread': int(post.thread or post.id),
        'is_op': post.thread is None,
        'time': post.creation.replace(tzinfo=pytz.UTC),
        'board_id': board_name or post.board,
        'embed': post.info if post.type == 2 else None,
        'num_files': 0 if post.type not in [1, 4] else 1,
        'files': [] if post.type not in [1, 4] else [extract_file_info(post, board_name or post.board)],
        'email': 'sage' if post.saged else '',
        'name': beautify_custom_sign(post.custom_sign),
        'country_iso': post.country_iso,
        'country_name': post.country_name,
        'city_name': post.city_name
    } for post in posts]


def extract_file_info(post, board):
    info = post.info.split()
    dims = (int(info[2]), int(info[3]))
    ext = mime_to_ext(info[0])
    filename = str(post.id) + "." + ext
    return {
        "name": filename,
        "type": 0,  # content_type,
        "error": 0,
        "size": int(info[1]),
        "extension": ext,
        "file": filename,
        "thumb": 'test.jpg',
        "is_an_image": post.type == 1,  # content_type.split('/')[0] == 'image',
        "hash": "c5c76d11ff82103d18c3c9767bcb881e",  # TODO hash
        "width": dims[0],
        "height": dims[1],
        "thumbwidth": dims_to_thumb(dims)[0],
        "thumbheight": dims_to_thumb(dims)[1],
        "file_path": '{0}/src'.format(int(post.id)),
        "thumb_path": '{0}/thumb'.format(int(post.id)),
        "mime": info[0]
    }


def mime_to_ext(mime):
    if mime == "image/jpg" or mime == "image/jpeg":
        return "jpg"
    elif mime == "image/png":
        return "png"
    elif mime == "image/gif":
        return "gif"
    else:
        return "webm"


def dims_to_thumb(dims):
    r = max(dims[0] / 250, dims[1] / 300, 1)
    return (int(dims[0] / r), int(dims[1] / r))


def get_stats(boards):
    with connection.cursor() as cursor:
        def get_posts_count(where=''):
            cursor.execute("select count(*) from posts %s" % (where))
            return cursor.fetchone()[0]
        def get_posters(where=''):
            cursor.execute("select count(distinct ip) from posts %s" % (where))
            return cursor.fetchone()[0]
        w_thread = "WHERE thread is null"
        w_per24 = "WHERE creation > now() at time zone 'utc' - interval '1' day"
        w_per24_thread = w_per24 + " AND thread is null"
        return {
            'total_posts': get_posts_count(),
            'total_threads': get_posts_count(w_thread),
            'posters': get_posters(),
            'posts_per24': get_posts_count(w_per24),
            'threads_per24': get_posts_count(w_per24_thread),
            'posters_per24': get_posters(w_per24),
        }


class Demarkuper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = ""

    def handle_starttag(self, tag, attrs):
        if tag == 'span':
            self.text += "<"
        elif tag == 'br':
            self.text += " "

    def handle_endtag(self, tag):
        if tag == 'span':
            self.text += ">"

    def handle_data(self, data):
        self.text += data

    def feeda(self, str):
        self.text = ""
        self.feed(str)
        return self.text


def str_replaced(str, begin, end, replacement):
    return str[:begin] + replacement + str[end:]


RAINBOW_STYLE = 'style=\'\
    background: linear-gradient(90deg, #f00, #0ff, #00f, #f00);\
    background-size: 600% 600%;\
    -webkit-background-clip: text;\
    -webkit-text-fill-color: transparent;\
    -webkit-animation: RAINBOW 2s linear infinite;\
    -moz-animation: RAINBOW 2s linear infinite;\
    animation: RAINBOW 2s linear infinite running normal;\''
INIT = {
    'кропивач': 'салодівчач',
    'жироблядач': 'бурʼянач'
}
ENDINGS = ['', 'а', 'у', 'ем', 'і', 'еві']
FORMS = {key + e: value + e for key, value in INIT.items() for e in ENDINGS}


def convert_to_classic_markup(board_context, markup):
    for prefix, replace in FORMS.items():
        matches = list(re.finditer(r'\b' + prefix + r'\b', markup, re.IGNORECASE))
        shift = 0
        for match in matches:
            mode = None
            if match.group(0).lower() == match.group(0):
                mode = 0
            elif match.group(0).upper() == match.group(0):
                mode = 1
            else:
                for maybe_mode in [2, 3]:
                    even = [c for i, c in enumerate(match.group(0)) if i % 2 == 0]
                    odd  = [c for i, c in enumerate(match.group(0)) if i % 2 == 1]
                    if ''.join([
                        (c.lower() if maybe_mode == 2 else c.upper()) +
                        ((odd[i].upper() if maybe_mode == 2 else odd[i].lower()) if i < len(odd) else '')
                        for i, c in enumerate(even)
                    ]) == match.group(0):
                        mode = maybe_mode
                        break
            if mode is None:
                mode = 0
            if mode == 0:
                v = replace.lower()
            elif mode == 1:
                v = replace.upper()
            elif mode == 2:
                v = ''.join([c.upper() if i % 2 == 1 else c.lower() for i, c in enumerate(replace)])
            else:
                v = ''.join([c.upper() if i % 2 == 0 else c.lower() for i, c in enumerate(replace)])
            full_replace = '<span ' + RAINBOW_STYLE + '>' + v + '</span>'
            delta = len(full_replace) - len(match.group(0))
            markup = str_replaced(markup, match.start(0) + shift, match.end(0) + shift, full_replace)
            shift += delta
    begin = 0
    while True:
        prefix = '<span class=l data-post='
        pr_place = markup.find(prefix, begin)
        if pr_place == -1:
            break
        begin = pr_place + len(prefix)
        post_place = markup.find('>', begin)
        assert post_place != -1
        assert post_place != begin
        space_place = markup.find(' ', begin, post_place)
        if space_place == -1:
            post_id = markup[begin:post_place]
            board_id = None
        else:
            post_id = markup[begin:space_place]
            board_suffix = ' data-board='
            board_place = space_place + len(board_suffix)
            assert markup[space_place:board_place] == board_suffix
            board_id = markup[board_place:post_place]
        post_id = int(post_id)
        postfix = '</span>'
        begin = markup.find(postfix, post_place)
        assert begin != -1
        begin += len(postfix)
        replacement = classic_markup_link(board_id or board_context, post_id)
        markup = str_replaced(markup, pr_place, begin, replacement)
        begin = pr_place + len(replacement)
    begin = 0
    line_end = '<br>'
    while True:
        if begin == len(markup):
            break
        line_end_pos = markup.find(line_end, begin)
        if line_end_pos == -1:
            line_end_pos = len(markup)
        if markup[begin] == '>':
            replacement = '<span class=quote>' + markup[begin:line_end_pos] +\
                '</span>'
            markup = str_replaced(markup, begin, line_end_pos, replacement)
            line_end_pos = begin + len(replacement)
        begin = min(len(markup), line_end_pos + len(line_end))
    begin = 0
    while True:
        link_pos = markup.find('http', begin)
        if link_pos == -1:
            break
        begin = link_pos + len('http')
        if begin == len(markup):
            break
        if markup[begin] == 's':
            begin += 1
        infix = '://'
        if markup[begin:begin + len(infix)] != infix:
            continue
        begin += len(infix)
        is_empty = True
        while True:
            if begin == len(markup):
                break
            if markup[begin] == ' ' or markup[begin] == '<':
                break
            begin += 1
            is_empty = False
        if not is_empty:
            while markup[begin - 1] in [',', '.', ';', ':', '-']:
                begin -= 1
            link = markup[link_pos:begin]
            quot_link = link.replace('\"', '\\\"')
            full_link = '<a href="' + quot_link + '">' + link + '</a>'
            markup = str_replaced(markup, link_pos, begin, full_link)
            begin = link_pos + len(full_link)
    return markup


def classic_markup_link(board_id, post_id):
    op = get_thread(post_id)
    thread_id = op or post_id
    link = reverse('thread', args=[board_id, thread_id])
    if op is not None:
        link += '#' + str(post_id)
    return '''<a onclick="highlightReply('{0}', event);\
            " href="{1}">&lt;{0}&gt;</a>'''.format(post_id, link)


def get_all_threads(board):
    with connection.cursor() as cursor:
        cursor.execute(threads_query("select * from threads where board = %s order by sticky desc, last_bump desc"), [board['url']])
        return extract_threads(cursor)


def get_single_thread(id):
    with connection.cursor() as cursor:
        cursor.execute(thread_single_query("select * from threads where op = %s"), [id])
        return extract_threads(cursor)


def extract_threads(cursor):
    threads = named_tuple_fetch_all(cursor)
    return [{
        'id': int(thread.op),
        'board': thread.board,
        'subject': thread.topic,
        'omitted': max(0, thread.count_all - 6),
        'reply_count': thread.count_all - 1,
        'image_count': thread.count_img,
        'bump': thread.last_bump.replace(tzinfo=pytz.UTC),
        'sticky': thread.sticky,
        'locked': thread.locked
    } for thread in threads]


class PostQueryMode(Enum):
    ALL = 0
    ON_BOARD_ONLY = 1
    OP_ONLY = 2

def get_all_posts_for_threads(threads, mode):
    if len(threads) == 0:
        return []
    assert all(thread['board'] == threads[0]['board'] for thread in threads)
    board = threads[0]['board']
    with connection.cursor() as cursor:
        in_str = ','.join([str(thread['id']) for thread in threads])
        if mode == PostQueryMode.ON_BOARD_ONLY:
            cursor.execute(board_posts_query(
                "select *, " + POSTS_QUERY_GEO_APPENDIX + " from posts where id in (%s) or (thread in (%s) and on_board)",
                in_str))
        elif mode == PostQueryMode.ALL:
            cursor.execute(thread_posts_query(
                "select *, " + POSTS_QUERY_GEO_APPENDIX + " from posts where id in (%s) or thread in (%s)",
                in_str))
        elif mode == PostQueryMode.OP_ONLY:
            cursor.execute(catalog_posts_query(
                "select *, " + POSTS_QUERY_GEO_APPENDIX + " from posts where id in (%s)",
                in_str))
        else:
            assert False
        posts = extract_posts(cursor, board)
    op_posts = {}
    reply_posts = {}
    for post in posts:
        if post['is_op']:
            op_posts[post['id']] = post
        else:
            if post['thread'] not in reply_posts:
                reply_posts[post['thread']] = []
            reply_posts[post['thread']].append(post)
    for _, post in op_posts.items():
        post['posts'] = sorted(reply_posts[post['id']], key=lambda post: post['time']) if post['id'] in reply_posts else []
    return [fuse_thread_and_op_post(thread, op_posts[thread['id']]) for thread in threads]


def fuse_thread_and_op_post(thread, op_post):
    op_post.update(thread)
    return op_post


def get_thread(id):
    with connection.cursor() as cursor:
        cursor.execute(post_thread_query(
            "select (select op from threads where op = id or op = thread) from posts where id = %s"),
        [id])
        thread = cursor.fetchone()
    if thread is None:
        return None
    return thread[0]


def get_single_post(id):
    with connection.cursor() as cursor:
        cursor.execute(post_query(
            "select *, (select board from threads where op = id or op = thread) as board, " +
            POSTS_QUERY_GEO_APPENDIX + " from posts where id = %s"),
        [id])
        try:
            return extract_posts(cursor, None)[0]
        except IndexError:
            return None

def get_boards():
    global boards
    if boards is None:
        with connection.cursor() as cursor:
            cursor.execute("select * from boards")
            boards = cursor.fetchall()
            boards = [{'url': record[0], 'title': record[1]} for record in boards]
    return boards