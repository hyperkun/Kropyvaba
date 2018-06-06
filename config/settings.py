# encoding=utf-8
"""
Django settings for config project.

Generated by 'django-admin startproject' using Django 1.10.6.

For more information on this file, see
https://docs.djangoproject.com/en/1.10/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.10/ref/settings/
"""

import os

PROJECT_ROOT = os.path.join(os.path.dirname(__file__), os.pardir)

SETTINGS_DIR = os.path.abspath(os.path.dirname(__file__))

try:
    from secret_key import SECRET_KEY
except ImportError:
    from django.utils.crypto import get_random_string

    CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)'
    FILE = open(os.path.join(SETTINGS_DIR, 'secret_key.py'), 'w')
    FILE.write('SECRET_KEY = "' + get_random_string(50, CHARS) + '"\n')
    FILE.close()
    import sys
    sys.path.append(SETTINGS_DIR)
    from secret_key import SECRET_KEY

# for flake8
assert SECRET_KEY

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'django.contrib.flatpages',
    'debug_toolbar',
    'posts',
    'precise_bbcode',
]

SITE_ID = 1

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# Cache

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

CACHE_TTL = 60 * 15

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# Password validation
# https://docs.djangoproject.com/en/1.10/ref/settings/#auth-password-validators

PASSW_VALIDATOR = 'django.contrib.auth.password_validation.'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': PASSW_VALIDATOR + 'UserAttributeSimilarityValidator',
    },
    {
        'NAME': PASSW_VALIDATOR + 'MinimumLengthValidator',
    },
    {
        'NAME': PASSW_VALIDATOR + 'CommonPasswordValidator',
    },
    {
        'NAME': PASSW_VALIDATOR + 'NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

LANGUAGE_CODE = 'uk'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

LOCALE_PATHS = [
    PROJECT_ROOT+'/locale',
]


USE_TZ = True

INTERNAL_IPS = ['127.0.0.1']

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/

STATIC_ROOT = os.path.join(BASE_DIR, 'static/')
STATIC_URL = '/static/'

# Media files

MEDIA_ROOT = os.path.join(BASE_DIR, 'media/')

config = {
    'title': "Гіперчан",
    'url_favicon': "favicon.ico",
    'url_stylesheet': "style.css",
    'default_stylesheet': {
        '1': 'ukrchan.css'
    },
    'stylesheets': [['Ukrchan', 'ukrchan.css'], ['Futaba', 'futaba.css']],
    'additional_javascript': [
        'jquery.js',
        'style-select.js',
        'dollchan.js',
    ],
    'footer': ['Гіперчан 2014-14880. Використовує vichan та Kropyvaba.'],
    'max_filesize': 40 * 1024 * 1024,  # 40MB
    'max_images': 4,
    'allowed_ext': ['png', 'jpeg', 'gif', 'jpg', 'webm'],
    'uri_stylesheets': '',
    'font_awesome': True,
    'post_date': "%d-%m-%y о %H:%M:%S",
    'recent': "recent.css",
    'url_javascript': 'main.js',
    'wordfilter': [
        r"пилипони"
    ],
    'catalog_link': 'catalog.html',
    'button_reply': "Відповісти",
    'button_newtopic': "Створити нитку",
    'allow_delete': False,
    'field_disable_password': True,
    'field_disable_name': True,
    'post_url': 'http://hyperchan.org/api/post?p',
    'slogan': [
        "Український іміджборд",
        "Перша іміджборда у гіпервимірі!",
        "Тепер ролідовий!",
        "Найкраще смакує з друзями!",
        "Остерігайтеся підробок!",
        "Запалює це знову — як влітку 07-го!",
        "Такого ви ще не бачили!",
        "Відпускається без рецепта!",
        "Найбільш толерантний іміджборд Українського Рейху!",
        "Про нього в курсі навіть твоя мама!",
        "Палкий, квітневий, твій!",
        "Більше мільярда можливих комбінацій постів!",
        "US PATENT PENDING",
        "Можна вживати при алергії на кропиву!",
        "Постійно неперевершуваний!",
        "Отримав визнання в більше ніж 300 країнах!",
        "Безмежна інтенсивність!",
        "Новий дизайн — збільшуйте запас!",
        "Для тих, хто розуміє.",
        "Майбутній цвіт українського суспільства!",
        "Солідний іміджборд — для солідних безосібних.",
        "Отримав найвищу оцінку організації WebValidator!",
        "Поринь у світ торішніх мемасів!",
        "Під час виробництва жоден безосібний не постраждав!",
        "Застрелитися? А може, краще Гіперчан?",
        "Тепер у двох нових кольорах!",
        "Завжди щось нове!",
        "Завжди доречний!",
        "Секрет супергероїв!",
        "Задоволення — або ми повернемо гроші!",
        "Візьми і запости!",
        "Більше 10.000 добірно відібраних літер!",
        "Робить неможливе можливим!",
        "Йому навіть не потрібна реклама!",
        "Відновлює мікрофлору анусу!",
        "Міг би бути підтриманий навіть Джоном Ленноном!",
        "Краще, ніж секс!",
        "Майже як морозиво, але без морозива!",
        "Наш кандидат!",
        "Кількість використань необмежена!",
        "І нехай весь світ зачекає!",
        "Те, про що ти завжди мріяв!",
        "Мабуть, найцікавіше, що зможе показати твій комп'ютер!",
        "Підтримує більше 100 тисяч можливих символів!",
        "Підтримує більше 16 мільйонів кольорів!",
    ]
}
