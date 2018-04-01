{% load static %}/* gettext-compatible _ function, example of usage:
 *
 * > // Loading pl_PL.json here (containing polish translation strings generated by tools/i18n_compile.php)
 * > alert(_("Hello!"));
 * Witaj!
 */
function _(s) {
	return (typeof l10n != 'undefined' && typeof l10n[s] != 'undefined') ? l10n[s] : s;
}

/* printf-like formatting function, example of usage:
 *
 * > alert(fmt("There are {0} birds on {1} trees", [3,4]));
 * There are 3 birds on 4 trees
 * > // Loading pl_PL.json here (containing polish translation strings generated by tools/locale_compile.php)
 * > alert(fmt(_("{0} users"), [3]));
 * 3 uzytkownikow
 */
function fmt(s,a) {
	return s.replace(/\{([0-9]+)\}/g, function(x) { return a[x[1]]; });
}

function until($timestamp) {
        var $difference = $timestamp - Date.now()/1000|0, $num;
        switch(true){
        case ($difference < 60):
                return "" + $difference + ' ' + _('second(s)');
        case ($difference < 3600): //60*60 = 3600
                return "" + ($num = Math.round($difference/(60))) + ' ' + _('minute(s)');
        case ($difference < 86400): //60*60*24 = 86400
                return "" + ($num = Math.round($difference/(3600))) + ' ' + _('hour(s)');
        case ($difference < 604800): //60*60*24*7 = 604800
                return "" + ($num = Math.round($difference/(86400))) + ' ' + _('day(s)');
        case ($difference < 31536000): //60*60*24*365 = 31536000
                return "" + ($num = Math.round($difference/(604800))) + ' ' + _('week(s)');
        default:
                return "" + ($num = Math.round($difference/(31536000))) + ' ' + _('year(s)');
        }
}

function ago($timestamp) {
        var $difference = (Date.now()/1000|0) - $timestamp, $num;
        switch(true){
        case ($difference < 60) :
                return "" + $difference + ' ' + _('second(s)');
        case ($difference < 3600): //60*60 = 3600
                return "" + ($num = Math.round($difference/(60))) + ' ' + _('minute(s)');
        case ($difference <  86400): //60*60*24 = 86400
                return "" + ($num = Math.round($difference/(3600))) + ' ' + _('hour(s)');
        case ($difference < 604800): //60*60*24*7 = 604800
                return "" + ($num = Math.round($difference/(86400))) + ' ' + _('day(s)');
        case ($difference < 31536000): //60*60*24*365 = 31536000
                return "" + ($num = Math.round($difference/(604800))) + ' ' + _('week(s)');
        default:
                return "" + ($num = Math.round($difference/(31536000))) + ' ' + _('year(s)');
        }
}

var datelocale =
        { days: [_('Sunday'), _('Monday'), _('Tuesday'), _('Wednesday'), _('Thursday'), _('Friday'), _('Saturday')]
        , shortDays: [_("Sun"), _("Mon"), _("Tue"), _("Wed"), _("Thu"), _("Fri"), _("Sat")]
        , months: [_('January'), _('February'), _('March'), _('April'), _('May'), _('June'), _('July'), _('August'), _('September'), _('October'), _('November'), _('December')]
        , shortMonths: [_('Jan'), _('Feb'), _('Mar'), _('Apr'), _('May'), _('Jun'), _('Jul'), _('Aug'), _('Sep'), _('Oct'), _('Nov'), _('Dec')]
        , AM: _('AM')
        , PM: _('PM')
        , am: _('am')
        , pm: _('pm')
        };


function alert(a, do_confirm, confirm_ok_action, confirm_cancel_action) {
      var handler, div, bg, closebtn, okbtn;
      var close = function() {
              handler.fadeOut(400, function() { handler.remove(); });
              return false;
      };

      handler = $("<div id='alert_handler'></div>").hide().appendTo('body');

      bg = $("<div id='alert_background'></div>").appendTo(handler);

      div = $("<div id='alert_div'></div>").appendTo(handler);
      closebtn = $("<a id='alert_close' href='javascript:void(0)'><i class='fa fa-times'></i></div>")
              .appendTo(div);

      $("<div id='alert_message'></div>").html(a).appendTo(div);

      okbtn = $("<button class='button alert_button'>"+_("OK")+"</button>").appendTo(div);

      if (do_confirm) {
              confirm_ok_action = (typeof confirm_ok_action !== "function") ? function(){} : confirm_ok_action;
              confirm_cancel_action = (typeof confirm_cancel_action !== "function") ? function(){} : confirm_cancel_action;
              okbtn.click(confirm_ok_action);
              $("<button class='button alert_button'>"+_("Cancel")+"</button>").click(confirm_cancel_action).click(close).appendTo(div);
              bg.click(confirm_cancel_action);
              okbtn.click(confirm_cancel_action);
              closebtn.click(confirm_cancel_action);
      }

      bg.click(close);
      okbtn.click(close);
      closebtn.click(close);

      handler.fadeIn(400);
}

var saved = {};


var selectedstyle = 'ukrchan.css';
var styles = {
	{% for stylesheet in config.stylesheets %}
	'{{ stylesheet.0 }}' : '{% static stylesheet.1 %}',
	{% endfor %}
};

if (typeof board_name === 'undefined') {
	var board_name = false;
}

function changeStyle(styleName, link) {

	localStorage.stylesheet = styleName;


	if (!document.getElementById('stylesheet')) {
		var s = document.createElement('link');
		s.rel = 'stylesheet';
		s.type = 'text/css';
		s.id = 'stylesheet';
		var x = document.getElementsByTagName('head')[0];
		x.appendChild(s);
	}

	document.getElementById('stylesheet').href = styles[styleName];
	selectedstyle = styleName;

	if (document.getElementsByClassName('styles').length != 0) {
		var styleLinks = document.getElementsByClassName('styles')[0].childNodes;
		for (var i = 0; i < styleLinks.length; i++) {
			styleLinks[i].className = '';
		}
	}

	if (link) {
		link.className = 'selected';
	}

	if (typeof $ != 'undefined')
		$(window).trigger('stylesheet', styleName);
}


	if (localStorage.stylesheet) {
		for (var styleName in styles) {
			if (styleName == localStorage.stylesheet) {
				changeStyle(styleName);
				break;
			}
		}
	}

function init_stylechooser() {
	var newElement = document.createElement('div');
	newElement.className = 'styles';

	for (styleName in styles) {
		var style = document.createElement('a');
		style.innerHTML = '[' + styleName + ']';
		style.onclick = function() {
			changeStyle(this.innerHTML.substring(1, this.innerHTML.length - 1), this);
		};
		if (styleName == selectedstyle) {
			style.className = 'selected';
		}
		style.href = 'javascript:void(0);';
		newElement.appendChild(style);
	}

	document.getElementsByTagName('body')[0].insertBefore(newElement, document.getElementsByTagName('body')[0].lastChild.nextSibling);
}

function get_cookie(cookie_name) {
	var results = document.cookie.match ( '(^|;) ?' + cookie_name + '=([^;]*)(;|$)');
	if (results)
		return (unescape(results[2]));
	else
		return null;
}

function highlightReply(id) {
	if (typeof window.event != "undefined" && event.which == 2) {
		// don't highlight on middle click
		return true;
	}

	var divs = document.getElementsByTagName('div');
	for (var i = 0; i < divs.length; i++)
	{
		if (divs[i].className.indexOf('post') != -1)
			divs[i].className = divs[i].className.replace(/highlighted/, '');
	}
	if (id) {
		var post = document.getElementById('reply_'+id);
		if (post)
			post.className += ' highlighted';
			window.location.hash = id;
	}
	return true;
}

function generatePassword() {
	var pass = '';
	var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
	for (var i = 0; i < 8; i++) {
		var rnd = Math.floor(Math.random() * chars.length);
		pass += chars.substring(rnd, rnd + 1);
	}
	return pass;
}

function dopost(form) {
	if (form.elements['name']) {
		localStorage.name = form.elements['name'].value.replace(/( |^)## .+$/, '');
	}
	if (form.elements['password']) {
		localStorage.password = form.elements['password'].value;
	}
	if (form.elements['email'] && form.elements['email'].value != 'sage') {
		localStorage.email = form.elements['email'].value;
	}

	saved[document.location] = form.elements['body'].value;
	sessionStorage.body = JSON.stringify(saved);

	return form.elements['body'].value != "" || (form.elements['file'] && form.elements['file'].value != "") || (form.elements.file_url && form.elements['file_url'].value != "");
}

function citeReply(id, with_link) {
	var textarea = document.getElementById('id_body');

	if (!textarea) return false;

	if (document.selection) {
		// IE
		textarea.focus();
		var sel = document.selection.createRange();
		sel.text = '<' + id + '>\n';
	} else if (textarea.selectionStart || textarea.selectionStart == '0') {
		var start = textarea.selectionStart;
		var end = textarea.selectionEnd;
		textarea.value = textarea.value.substring(0, start) + '<' + id + '>\n' + textarea.value.substring(end, textarea.value.length);

		textarea.selectionStart += ('<' + id + '>').length + 1;
		textarea.selectionEnd = textarea.selectionStart;
	} else {
		// ???
		textarea.value += '<' + id + '>\n';
	}
	if (typeof $ != 'undefined') {
		var select = document.getSelection().toString();
		if (select) {
			var body = $('#reply_' + id + ', #op_' + id).find('div.body');  // TODO: support for OPs
			var index = body.text().indexOf(select.replace('\n', ''));  // for some reason this only works like this
			if (index > -1) {
				textarea.value += '>' + select + '\n';
			}
		}

		$(window).trigger('cite', [id, with_link]);
		$(textarea).change();
	}
	return false;
}

function rememberStuff() {
	if (document.forms.post) {
		if (document.forms.post.password) {
			if (!localStorage.password)
				localStorage.password = generatePassword();
			document.forms.post.password.value = localStorage.password;
		}

		if (localStorage.name && document.forms.post.elements['name'])
			document.forms.post.elements['name'].value = localStorage.name;
		if (localStorage.email && document.forms.post.elements['email'])
			document.forms.post.elements['email'].value = localStorage.email;

		if (window.location.hash.indexOf('q') == 1)
			citeReply(window.location.hash.substring(2), true);

		if (sessionStorage.body) {
			var saved = JSON.parse(sessionStorage.body);
			if (get_cookie('serv')) {
				// Remove successful posts
				var successful = JSON.parse(get_cookie('serv'));
				for (var url in successful) {
					saved[url] = null;
				}
				sessionStorage.body = JSON.stringify(saved);

				document.cookie = 'serv={};expires=0;path=/;';
			}
			if (saved[document.location]) {
				document.forms.post.body.value = saved[document.location];
			}
		}

		if (localStorage.body) {
			document.forms.post.body.value = localStorage.body;
			localStorage.body = '';
		}
	}
}

var script_settings = function(script_name) {
	this.script_name = script_name;
	this.get = function(var_name, default_val) {
		if (typeof tb_settings == 'undefined' ||
			typeof tb_settings[this.script_name] == 'undefined' ||
			typeof tb_settings[this.script_name][var_name] == 'undefined')
			return default_val;
		return tb_settings[this.script_name][var_name];
	}
};

function init() {
	init_stylechooser();

	if (document.forms.postcontrols && document.forms.postcontrols.password) {
		document.forms.postcontrols.password.value = localStorage.password;
	}


	if (window.location.hash.indexOf('q') != 1 && window.location.hash.substring(1))
		highlightReply(window.location.hash.substring(1));
}

var RecaptchaOptions = {
	theme : 'clean'
};

onready_callbacks = [];
function onready(fnc) {
	onready_callbacks.push(fnc);
}

function ready() {
	for (var i = 0; i < onready_callbacks.length; i++) {
		onready_callbacks[i]();
	}
}


var max_images = 4;

onready(init);

