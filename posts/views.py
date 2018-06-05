# coding: utf-8

"""file with backend code"""

import random
import re
from calendar import timegm
from datetime import datetime, timedelta

import simplejson as json

# django stuff
from django.http import HttpResponse, HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import render
from django.views.static import serve
from django.core.paginator import Paginator
from django.utils.translation import ugettext as _
# from django.views.decorators.cache import cache_page

from posts.forms import PostForm
from config.settings import MEDIA_ROOT, DEBUG
from posts.models import *
from config.settings import config  # , CACHE_TTL

EMPTY_POST = _('(коментар відсутній)')


class Page404(object):

    """Decorate render pages for 404 error."""

    def __init__(self, func):
        self.func = func

    def __call__(self, *args, **kwargs):
        prefetch_response = maybe_prefetch_response(args[0])
        if prefetch_response is not None:
            return prefetch_response
        try:
            return self.func(*args, **kwargs)
        except ObjectDoesNotExist:
            return HttpResponse('404')


@Page404
def render_index(request):
    """
    Render main page with lists of boards, recent posts and statistics.

    :param request: user's request
    :return: main page
    """
    boards = get_boards_navlist()
    PostBreaf.set_boards(boards)
    fields = ['id', 'body_nomarkup', 'thread', 'time', 'ip', 'board_id']
    posts = get_all_last_posts(30)
    if len(posts):
        recent = [PostBreaf(post) for post in posts]
        stats = get_stats(boards)
    else:
        recent = []
        stats = None
    context = {
        'config': config,
        'boards': boards,
        'slogan': random.choice(config['slogan']),
        'stats': stats,
        'recent_posts': recent[:30]
    }
    return render(request, 'posts/main_page.html', context)


@Page404
def render_board(request, board_name, current_page=1):
    """
    Render board with lists of threads and last 5 posts for them.
    :param request: user's request
    :param board_name: name of board that we should render
    :param current_page: page that user requested
    :return: board page
    """
    board = get_board(board_name)
    if board is None:
        raise ObjectDoesNotExist()
    threads = get_all_threads(board)
    pages = Paginator(threads, 10)
    threads = pages.page(int(current_page))
    threads = get_all_posts_for_threads(threads, PostQueryMode.ON_BOARD_ONLY)
    if request.method == 'POST':
        raise ObjectDoesNotExist()
    context = {
        'config': config,
        'board': board,
        'boards': get_boards_navlist(),
        'threads': threads,
        'pages': pages,
        'hr': True,
        'index': True,
        'form': PostForm()
    }
    return render(request, 'posts/index.html', context)


@Page404
def render_thread(request, board_name, thread_id):
    """
    Render thread page with all thread's posts.

    :param request: user's request
    :param board_name: name of threads board
    :param thread_id: thread id
    :return: thread page
    """
    board = get_board(board_name)
    boards = get_boards_navlist()
    post = get_single_thread(thread_id)
    if post[0]['board'] != board_name:
        raise ObjectDoesNotExist()
    post = get_all_posts_for_threads(post, PostQueryMode.ALL)
    del post[0]["omitted"]
    if request.method == 'POST':
        raise ObjectDoesNotExist()
    context = {
        'config': config,
        'board': board,
        'boards': boards,
        'threads': post,
        'hr': True,
        'form': PostForm(),
        'id': thread_id
    }
    return render(request, 'posts/page.html', context)


@Page404
def render_catalog(request, board_name):
    """
    Render catalog page for specific board.

    :param request: user's request
    :param board_name: board url
    :return: catalog page
    """
    board = get_board(board_name)
    boards = get_boards_navlist()
    threads = get_all_threads(board)
    threads = get_all_posts_for_threads(threads, PostQueryMode.OP_ONLY)
    context = {
        'config': config,
        'board': board,
        'boards': boards,
        'recent_posts': threads,
        'hr': True
    }
    return render(request, 'posts/catalog.html', context)


@Page404
def get_media(request, id, media_type):
    """Deal with media files (sic!)"""
    f_id = int(id)
    post = get_single_post(f_id)
    if post is None or len(post['files']) == 0:
        raise ObjectDoesNotExist()
    partial_path = 'attachments/{0}{1}'.format(f_id, 't' if media_type == 'thumb' else '')
    if DEBUG:
        response = serve(request, partial_path, document_root=MEDIA_ROOT)
    else:
        response = HttpResponse()
        response['X-Accel-Redirect'] = '/@content/attachments/' + partial_path
    response['Content-Type'] = post['files'][0]['mime']
    response['Expires'] = 'Tue Jan 19 2038 03:14:07 UTC'
    response['Content-Disposition'] = 'inline;filename=hyp-{0}.{1}'.format(
        f_id, post['files'][0]['extension']
    )
    return response


def get_ip(request):
    """
    Return a user ip.
    :param request: http/s request
    :return: ip address
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_board(board_uri):
    try:
        return next(board for board in get_boards() if board['url'] == board_uri)
    except StopIteration:
        raise ObjectDoesNotExist()


def get_boards_navlist():
    return [{'url': board['url'], 'title': board['title'], 'flags': False}
        for board in get_boards()]


class PostBreaf(object):
    """Object for main page."""

    def __init__(self, post):
        self.id = post['id']
        body = post['body_nomarkup']
        self.thread = post['thread']
        self.time = post['time']
        boards = PostBreaf.boards
        for _board in boards:
            if _board['url'] == post['board_id']:
                board = _board

        def _slice(text):
            """
            Cut tinyboard tag.

            :param text: text for cutting
            :return: text within last row
            """
            result = re.sub(r"<tinyboard [^>]+>[^/]+</tinyboard>", '', text)
            return result

        sliced_body = _slice(body)
        length_of_sliced_body = len(sliced_body)

        self.snippet = sliced_body if length_of_sliced_body else EMPTY_POST
        self.board_name = board['title']
        self.board_url = board['url']

    @classmethod
    def set_boards(cls, boards):
        cls.boards = boards
