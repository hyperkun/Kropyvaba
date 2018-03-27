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
BOARDS = [
    {'url': 'b', 'title': 'Безлад', 'flags': False},
    {'url': 'meta', 'title': 'Робота сайту', 'flags': False}
]


class Page404(object):

    """Decorate render pages for 404 error."""

    def __init__(self, func):
        self.func = func

    def __call__(self, *args, **kwargs):
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
        stats = get_stats()
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
    threads = get_all_posts_for_threads(threads, True)
    if request.method == 'POST':
        json_response = 'json_response' in request.POST
        agreed_with_rules = 'rules' in request.POST
        form = PostForm(request.POST, request.FILES)
        if agreed_with_rules:
            if form.is_valid():
                _ip = get_ip(request)
                new_post_id = form.process(board_name, _ip, None)
                if new_post_id:
                    if json_response:
                        respond = json.dumps({
                            'id': new_post_id,
                            'noko': False,
                            'redirect': '/' + board_name
                        })
                        answer = HttpResponse(
                            respond,
                            content_type="application/json"
                        )
                    else:
                        answer = HttpResponseRedirect(
                            reverse('thread', args=[board_name, new_post_id])
                        )
                    return answer
    else:
        form = PostForm()
    context = {
        'config': config,
        'board': board,
        'boards': get_boards_navlist(),
        'threads': threads,
        'pages': pages,
        'hr': True,
        'index': True,
        'form': form
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
    post = get_single_thread(board, thread_id)
    post = get_all_posts_for_threads(post, False)
    if request.method == 'POST':
        if 'delete' in request.POST:
            for key in request.POST.keys():
                if key.startswith('delete_'):
                    post_id = key[7:]
                    post_to_delete = Post.objects.get(board=board, id=post_id)
                    if post_to_delete.password == request.POST['password']:
                        post_to_delete.delete()
                        return HttpResponseRedirect(
                            reverse('thread', args=[
                                board_name,
                                thread_id
                            ]))
        if 'report' in request.POST:
            for key in request.POST.keys():
                if key.startswith('delete_'):
                    post_id = key[7:]
                    post_to_report = Post.objects.get(board=board, id=post_id)
                    print(post_to_report)
                    report = Report(
                        ip=get_ip(request),
                        reason=request.POST['reason'],
                        post=post_to_report
                    )
                    report.save(force_insert=True)
                    return HttpResponseRedirect(
                        reverse('thread', args=[
                            board_name,
                            thread_id
                        ]))
        json_response = 'json_response' in request.POST
        agreed_with_rules = 'rules' in request.POST
        post_form = PostForm(request.POST, request.FILES)
        if agreed_with_rules:
            if post_form.is_valid():
                _ip = get_ip(request)
                new_post_id = post_form.process(board_name, _ip, thread_id)
                if new_post_id:
                    if json_response:
                        respond = json.dumps({
                            'id': new_post_id,
                            'noko': False,
                            'redirect': '/' + board_name
                        })
                        answer = HttpResponse(
                            respond,
                            content_type="application/json"
                        )
                    else:
                        answer = HttpResponseRedirect(
                            reverse('thread', args=[
                                board_name,
                                thread_id
                            ]) + '#{0}'.format(new_post_id)
                        )
                    return answer
    else:
        post_form = PostForm()
    context = {
        'config': config,
        'board': board,
        'boards': boards,
        'threads': post,
        'hr': True,
        'form': post_form,
        'id': 1
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
    posts = get_posts(board)
    recent_posts = [_ for _ in get_threads(posts).order_by('-bump')]
    for thread in recent_posts:
        thread.reply_count = len(get_posts(board).filter(thread=thread.id))
    context = {
        'config': config,
        'board': board,
        'boards': boards,
        'recent_posts': recent_posts,
        'hr': True
    }
    return render(request, 'posts/catalog.html', context)


@Page404
def get_media(request, board_name, media_type, path):
    """Deal with media files (sic!)"""
    f_board = get_board(board_name)['url']
    f_path = int(path)
    post = get_single_post(f_board, f_path)
    if post is None or len(post['files']) == 0:
        raise ObjectDoesNotExist()
    partial_path = '{0}/{1}{2}'.format(f_board, f_path, 't' if media_type == 'thumb' else '')
    if DEBUG:
        response = serve(request, partial_path, document_root=MEDIA_ROOT)
    else:
        response = HttpResponse()
        response['X-Accel-Redirect'] = '/@content/' + partial_path
    response['Content-Type'] = post['files'][0]['mime']
    response['Expires'] = 'Tue Jan 19 2038 03:14:07 UTC'
    response['Content-Disposition'] = 'inline;filename=hyp-{0}-{1}.{2}'.format(
        f_board, f_path, post['files'][0]['extension']
    )
    return response


def make_stats(data):
    """
    Count posting statistics.

    :param data: posts for statistics
    :return: Statistics object
    """

    class Statistic(object):
        """
        Object which contain next statistics data:

        Number of all posts;
        Number of posted threads;
        Number of posters;
        Variables with '_per24' prefix -- same things but for last 24 hours
        """

        def __init__(self, posts):
            # functions for DRY
            def count_threads(_posts):
                """
                Count number of threads in _posts.

                :param _posts: source data
                :return: number of threads
                """
                return len([post for post in _posts if not post['thread']])

            def count_posters(_posts):
                """
                Count number of uniques posters in _posts.

                :param _posts: source data
                :return: number of posters
                """
                return len(set(post['ip'] for post in _posts))

            # getting time info
            past = datetime.utcnow() + timedelta(hours=-24)
            stamp = timegm(past.timetuple())
            # total objects
            boards_posts = []
            for board in PostBreaf.boards:
                posts_id = []
                for post in posts:
                    if post['board_id'] == board['id']:
                        posts_id.append(post['id'])
                    else:
                        posts_id.append(0)
                boards_posts.append(max(posts_id))
            self.total_posts = sum(boards_posts)
            self.total_threads = count_threads(posts)
            self.posters = count_posters(posts)
            # objects for last 24 hours
            last_posts = [post for post in posts if post['time'] >= stamp]
            self.posts_per24 = len(last_posts)
            self.threads_per24 = count_threads(last_posts)
            self.posters_per24 = count_posters(last_posts)

    stats = Statistic(data)
    return stats


def get_posts(board):
    """
    Return post's query.

    :param board: board %)
    :return: post's query
    """
    return Post.objects.filter(board=board)


def get_threads(posts):
    """
    Return threads objects.

    :param posts: data for filtering
    :return: threads query
    """
    return posts.filter(thread=None)


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
        return next(board for board in BOARDS if board['url'] == board_uri)
    except StopIteration:
        raise ObjectDoesNotExist()


def get_boards_navlist():
    return BOARDS


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
