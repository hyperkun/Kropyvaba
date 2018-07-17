from django.conf.urls import url, include
from .views import render_board, render_catalog, render_index, render_thread
from .views import get_media

urlpatterns = [
    url(
        r'^$', render_index, name="index"),
    url(
        r'^(?P<board_name>\w+)/res/(?P<thread_id>[0-9]+).html$',
        render_thread,
        name="thread"
        ),
    url(r'^(?P<board_name>\w+)/$', render_board, name="board"),
    url(
        r'^(?P<board_name>\w+)/(?P<current_page>[0-9]+).html$',
        render_board,
        name="board_page"
        ),
    url(
        r'^(?P<board_name>\w+)/catalog.html$',
        render_catalog,
        name="catalog"
        ),
    url(
        r'(?P<id>[0-9]+)/(?P<media_type>(src|thumb))$',
        get_media,
        name='media'
        ),
    url(r'^about/', include('django.contrib.flatpages.urls')),
]
