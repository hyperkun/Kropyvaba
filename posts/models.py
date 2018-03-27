import os
import ipaddress
import pytz
from django.db import models
from django.utils import timezone
from config.settings import MEDIA_ROOT
from django.db import connection
from html.parser import HTMLParser
from posts.owls import *
from django.core.urlresolvers import reverse

def get_all_last_posts(limit = None):
    limit = limit or 9999
    posts = []
    with connection.cursor() as cursor:
        cursor.execute(last_b_posts_query("select * from posts_b order by creation desc limit %s"), [limit])
        posts.extend(extract_posts(cursor, 'b'))
        cursor.execute(last_meta_posts_query("select * from posts_meta order by creation desc limit %s"), [limit])
        posts.extend(extract_posts(cursor, 'meta'))
    posts = posts[:limit]
    sorted(posts, key=lambda post: post['time'], reverse=True)
    return posts


def extract_posts(cursor, board_name):
    posts = cursor.fetchall()
    dm = Demarkuper()
    return [{
        'id': int(post[0]),
        'body': convert_to_classic_markup(board_name, post[1]),
        'body_nomarkup': dm.feeda(post[1]),
        'thread': int(post[2] or post[0]),
        'is_op': post[2] is None,
        'time': post[4].replace(tzinfo=pytz.UTC),
        'board_id': board_name,
        'embed': post[3] if post[8] == 2 else None,
        'num_files': 0 if post[8] not in [1, 4] else 1,
        'files': [] if post[8] not in [1, 4] else [extract_file_info(post, board_name)],
        'email': 'sage' if post[13] else '',
        'name': '<span style="color:#a00">hyper</span><span style="color:#333">kun</span>' if post[15] is not None else None
    } for post in posts]


def extract_file_info(post, board):
    info = post[3].split()
    dims = (int(info[2]), int(info[3]))
    ext = mime_to_ext(info[0])
    filename = str(post[0]) + "." + ext
    return {
        "name": filename,
        "type": 0,  # content_type,
        "error": 0,
        "size": int(info[1]),
        "extension": ext,
        "file": filename,
        "thumb": 'test.jpg',
        "is_an_image": post[8] == 1,  # content_type.split('/')[0] == 'image',
        "hash": "c5c76d11ff82103d18c3c9767bcb881e",  # TODO hash
        "width": dims[0],
        "height": dims[1],
        "thumbwidth": dims_to_thumb(dims)[0],
        "thumbheight": dims_to_thumb(dims)[1],
        "file_path": '{0}/src/{1}'.format(board, int(post[0])),
        "thumb_path": '{0}/thumb/{1}'.format(board, int(post[0])),
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


def get_stats():
    return None


class Demarkuper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = ""

    def handle_starttag(self, tag, attrs):
        if tag == 'span':
            self.text += ">>"
        elif tag == 'br':
            self.text += " "

    def handle_endtag(self, tag):
        pass

    def handle_data(self, data):
        self.text += data

    def feeda(self, str):
        self.text = ""
        self.feed(str)
        return self.text


def str_replaced(str, begin, end, replacement):
    return str[:begin] + replacement + str[end:]


def convert_to_classic_markup(board_context, markup):
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
    return markup


def classic_markup_link(board_id, post_id):
    op = get_thread(board_id, post_id)
    thread_id = op or post_id
    link = reverse('thread', args=[board_id, thread_id])
    if op is not None:
        link += '#' + str(post_id)
    return '''<a onclick="highlightReply('{0}', event);\
            " href="{1}">&gt;&gt;{0}</a>'''.format(post_id, link)


def get_all_threads(board):
    with connection.cursor() as cursor:
        cursor.execute(threads_query("select * from threads_%s order by last_bump desc", board['url']))
        return extract_threads(cursor, board['url'])


def get_single_thread(board, id):
    with connection.cursor() as cursor:
        cursor.execute(thread_single_query("select * from threads_%s where op=%s", board['url']), [id])
        return extract_threads(cursor, board['url'])


def extract_threads(cursor, board_name):
    threads = cursor.fetchall()
    return [{
        'id': int(thread[0]),
        'board': board_name,
        'subject': thread[10],
        'omitted': max(0, thread[5] - 6)
    } for thread in threads]


def get_all_posts_for_threads(threads, on_board_only):
    if len(threads) == 0:
        return []
    assert all(thread['board'] == threads[0]['board'] for thread in threads)
    board = threads[0]['board']
    with connection.cursor() as cursor:
        in_str = ','.join([str(thread['id']) for thread in threads])
        if on_board_only:
            cursor.execute(board_posts_query(
                "select * from posts_%s where id in (%s) or (thread in (%s) and on_board) order by creation asc",
                board,
                in_str))
        else:
            cursor.execute(thread_posts_query(
                "select * from posts_%s where id in (%s) or thread in (%s) order by creation asc",
                board,
                in_str))
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
        post['posts'] = reply_posts[post['id']] if post['id'] in reply_posts else []
    return [fuse_thread_and_op_post(thread, op_posts[thread['id']]) for thread in threads]


def fuse_thread_and_op_post(thread, op_post):
    op_post.update(thread)
    return op_post


def get_thread(board_id, id):
    with connection.cursor() as cursor:
        cursor.execute(post_query("select thread from posts_%s where id = %s", board_id), [id])
        thread = cursor.fetchone()
    return thread[0]


def get_single_post(board_id, id):
    with connection.cursor() as cursor:
        cursor.execute(post_query("select * from posts_%s where id = %s", board_id), [id])
        try:
            return extract_posts(cursor, board_id)[0]
        except IndexError:
            return None
