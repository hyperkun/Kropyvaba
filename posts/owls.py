# OWLS - Outstanding Whimsy Library (Streamlined).
# Copyright 2018, hyperkun.

def last_b_posts_query(query):
    return query


def last_meta_posts_query(query):
    return query


def threads_query(query, board_url):
    return query % board_url


def board_posts_query(query, board_url, in_str):
    return query % (board_url, in_str, in_str)


def post_query(query, board_url):
    return query % (board_url, '%s')
