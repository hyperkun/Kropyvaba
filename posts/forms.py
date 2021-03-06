# coding: utf-8

"""handle with user forms (in static mode)"""

from subprocess import call
from tempfile import NamedTemporaryFile
from datetime import datetime
from ipaddress import ip_address
import re

import GeoIP
import simplejson as json

from django.forms import Form
from django import forms
from django.core.urlresolvers import reverse
from django.core.files.uploadedfile import UploadedFile
from PIL import Image
from imagekit import ImageSpec
from imagekit.processors import ResizeToFit

from config.settings import config
from config.settings import MEDIA_ROOT
from precise_bbcode.bbcode import get_parser


class PostForm(Form):
    """
    form for user posts
    """

    id = forms.IntegerField()
    thread = forms.IntegerField()
    subject = forms.CharField(max_length=100, required=False)
    email = forms.CharField(max_length=30, required=False)
    name = forms.CharField(max_length=35, required=False)
    trip = forms.CharField(max_length=15)
    capcode = forms.CharField(max_length=50)
    body = forms.CharField(widget=forms.Textarea, required=False)
    body_nomarkup = forms.CharField(max_length=16000)
    bump = forms.IntegerField()
    files = forms.CharField()
    num_files = forms.IntegerField()
    filehash = forms.CharField()
    password = forms.CharField(max_length=20)
    embed = forms.CharField()
    slug = forms.CharField(max_length=256)
    video = forms.CharField(required=False)

    def process(self, board, _ip, thread):
        """
        Add new post/thread.

        :param self: form that needs to handle
        :param board: thread or reply board
        :param _ip: ip of poster
        :param thread: thread id if we work with reply
        :return: True if form is valid and processed
        """
        for banned in Ban.current_banned():
            if ip_address(_ip) >= banned[0] and ip_address(_ip) <= banned[1]:
                return False
        name = self.cleaned_data['name']
        email = self.cleaned_data['email']
        subject = self.cleaned_data['subject']
        body = self.cleaned_data['body']
        password = self.cleaned_data['password']
        time = datetime.timestamp(datetime.now())
        if thread is None and len(self.files) == 0:
            return False
        if len(self.files) > config['max_images']:
            return False
        if len(body) == 0 and len(self.files) == 0:
            return False
        if spam(body):
            return False
        if len(self.files):
            files = handle_files(self.files, str(time), board)
            if not files:
                return False
        else:
            files = []
        _board = Board.objects.get(uri=board)
        _board.posts += 1
        _board.save()
        new_post = Post.objects.create(
            id=_board.posts,
            time=int(time),
            board=Board.objects.get(uri=board),
            sage=0,
            cycle=0,
            locked=0,
            sticky=0
        )
        new_post.name = name
        new_post.num_files = len(files)
        new_post.subject = subject
        new_post.email = email
        bb_parser = get_parser()
        gi = GeoIP.new(GeoIP.GEOIP_MEMORY_CACHE)
        country_code = gi.country_code_by_addr(_ip)
        nomarkup = '\
            {0}\n<tinyboard flag>{1}</tinyboard>\
            \n<tinyboard proxy>{2}</tinyboard>'.format(body, country_code, _ip)
        body = markup(bb_parser.render(body), board) if len(body) else ''
        new_post.body = body
        new_post.files = json.dumps(files)
        new_post.body_nomarkup = nomarkup
        new_post.password = password
        new_post.ip = _ip
        new_post.thread = thread
        if not new_post.sage and new_post.thread:
            op_post = Post.objects.get(board__uri=board, id=thread)
            op_post.bump = int(time)
            op_post.save()
        new_post.bump = time
        new_post.save()
        return new_post.id


def spam(text):
    "Check text for spam/flood."
    for word in config['wordfilter']:
        matches = re.match(word, text)
        if matches:
            return True
    return False

def handle_files(files, time, board):
    """
    Check and save files.

    :param files: files fot handling
    :param time: current time
    :param board: post's board
    :return: json list of files features
    """
    _files = []
    for file in files.items():
        size = file[1].size
        if size > config['max_filesize']:
            return False
        name = file[1].name
        ext = name.split('.')[-1]
        if not ext.lower() in config['allowed_ext']:
            return False

        # file saving
        index = file[0].replace('file', '')  # equal 0 for first file and so on
        path = choose_path(board, 'src', time, ext, index)

        with open(path, 'wb+') as destination:
            for chunk in file[1].chunks():
                destination.write(chunk)
        destination.close()

        # TODO: Refactor all this hell

        if ext.lower() == 'webm':
            temp_file = NamedTemporaryFile()
            temp_path = temp_file.name + '.png'
            call(["ffmpeg", "-i", path, "-vframes", "1", temp_path])
            temp_file.close()
            temp_th = open(temp_path, 'rb+')
            preview = UploadedFile(file=temp_th)
            thumb = make_thumb(preview)
            preview.close()
            image = Image.open(temp_path)
        else:
            image = Image.open(path)
            thumb = make_thumb(file[1])

        path = choose_path(board, 'thumb', time, 'jpg', index)

        destination = open(path, 'wb+')
        destination.write(thumb.read())
        destination.close()

        thumb = Image.open(path)

        filename = '{0}-{1}.{2}'.format(time, index, ext)

        file_data = {
            "name": name,
            "type": 0,  # content_type,
            "tmp_name": ".",  # ???
            "error": 0,
            "size": size,
            "filename": name,
            "extension": ext,
            "file_id": time,
            "file": filename,
            "thumb": '{0}-{1}.jpg'.format(time, index),
            "is_an_image": 0,  # content_type.split('/')[0] == 'image',
            "hash": "c5c76d11ff82103d18c3c9767bcb881e",  # TODO hash
            "width": image.width,
            "height": image.height,
            "thumbwidth": thumb.width,
            "thumbheight": thumb.height,
            "file_path": '{0}/src/{1}'.format(board, filename),
            "thumb_path": '{0}/thumb/{1}-{2}.jpg'.format(board, time, index)
        }
        image.close()
        thumb.close()
        _files.append(file_data)
    return _files


def make_thumb(_file):
    thumb_generator = Thumbnail(source=_file)
    thumb = thumb_generator.generate()
    return thumb


def choose_path(board, _type, time, ext, index):
    """
    Form a system path for file.

    :param board: file's board
    :param _type: type of file (src/thumb)
    :param time: current time
    :param ext: extension
    :param index: file's index in the form
    :return: path string
    """
    directory = '{0}{1}/{2}/'.format(MEDIA_ROOT, _type, board,)
    file = '{0}-{1}.{2}'.format(time, index, ext)
    return directory+file


def markup(body, board):
    """
    Generate a markup for text.

    :param body: text for processing
    :param board: posts board
    :return: markuped text
    """
    strings = body.split('<br />')
    respond = []
    for string in strings:

        def process_markup(regex, output):
            """
            Process markup for simple rules i.e. bold or cursive text.
            :param regex: regex condition
            :param output: rule for replace
            :return: processed string
            """

            def replace(match, result):
                text = match.group('text')
                return result.format(text)

            return re.sub(regex, lambda line: replace(line, output), string)

        # quotation
        string = process_markup(
            r"^(?P<quote_mark>&gt;)(?P<text>(?!&gt;).+)",
            '<span class="quote">&gt;{0}</span>'
        )
        # reply's

        def rep(match):
            reply_id = match.group('id')
            post = Post.objects.get(board__uri=board, id=reply_id)
            if post:
                thread_id = post.thread if post.thread else post.id
                link = reverse('thread', args=[board, thread_id])
                if not post.thread:
                    link += '#' + str(post.id)
                return '''<a onclick="highlightReply('{0}', event);\
                          "href="{1}">&gt;&gt;{0}</a>'''.format(reply_id, link)

        string = re.sub(r"(?P<reply>&gt;&gt;)(?P<id>\d+)", rep, string)
        # bold
        string = process_markup(
            r"\*\*(?P<text>[^\*\*]+)\*\*",
            '<strong>{0}</strong>'
        )
        # italic
        string = process_markup(r"\*(?P<text>[^\*]+)\*", '<em>{0}</em>')
        # underline
        string = process_markup(r"\_\_(?P<text>[^\_\_]+)\_\_", '<u>{0}</u>')
        # strike
        string = process_markup(
            r"~~(?P<text>[^~~]+)~~",
            '<strike>{0}</strike>'
        )
        # spoiler

        string = process_markup(
            r"\%\%(?P<text>[^\%\%]+)\%\%",
            '<span class="spoiler">{0}</span>'
        )

        respond += [string]

    return '<br />'.join(respond)


class Thumbnail(ImageSpec):

    """Thumbnail settings."""

    processors = [ResizeToFit(255, 255)]
    format = 'JPEG'
    options = {'quality': 60}
