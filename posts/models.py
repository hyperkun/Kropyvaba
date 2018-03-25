import os
import ipaddress
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
        'time': post[4],
        'board_id': board_name
    } for post in posts]


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


def extract_threads(cursor, board_name):
    threads = cursor.fetchall()
    return [{
        'id': int(thread[0]),
        'board': board_name
    } for thread in threads]


def get_all_on_board_posts_for_threads(threads):
    if len(threads) == 0:
        return
    assert all(thread['board'] == threads[0]['board'] for thread in threads)
    board = threads[0]['board']
    with connection.cursor() as cursor:
        in_str = ','.join([str(thread['id']) for thread in threads])
        cursor.execute(board_posts_query(
            "select * from posts_%s where id in (%s) or (thread in (%s) and on_board) order by creation asc",
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
    return [op_posts[thread['id']] for thread in threads]


def get_thread(board_id, id):
    with connection.cursor() as cursor:
        cursor.execute(post_query("select thread from posts_%s where id = %s", board_id), [id])
        thread = cursor.fetchone()
    return thread[0]