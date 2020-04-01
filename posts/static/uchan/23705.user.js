function getCookie(name) {
    var matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ))
    return matches ? decodeURIComponent(matches[1]) : undefined
}

if (getCookie('doll_on')==1) {

// Dollchan Extension Tools
// by Sthephan Shinkufag @ FreeDollChan
// copyright (C) 2084, Bender Bending Rodríguez
// ==UserScript==
// @name		Dollchan Extension Tools
// @version		2010-06-21
// @description	Doing some extended profit for russian AIB
// @namespace	http://freedollchan.org/scripts
// @include		*0chan.ru*
// @include		*2-ch.ru*
// @include		*iichan.ru*
// @include		*dobrochan.ru*
// @include		*wakachan.org*
// @include		*nowere.net*
// @include		*uchan.to*
// @include		*sibirchan.ru*
// ==/UserScript==
(function ()
{

	if (/Firefox/.test(navigator.userAgent))
	{
	 window.addEventListener('load', doScript, false);
	}
	else 
	{
		if(window.opera) 
		{
		window.addEventListener('load',doScript,false);
		}
		else
		{
			if (navigator.appName == 'Microsoft Internet Explorer')
			{
			window.attachEvent('onload',doScript,false);
			}
			else
			{
			window.addEventListener('load',doScript,false);
			}
 		}
	}


var defaultCfg = [
	0,		// 0	antiwipe detectors
	0,		// 1	hide posts with sage
	0,		// 2	hide posts with theme
	0,		// 3	hide posts without text
	0,		// 4	hide posts without img
	0,		// 5	-
	0,		// 6	hide post names
	1,		// 7	text format btns
	0,		// 8	hide posts by text size
	500,	// 9		text size in symbols
	0,		// 10	hide posts by regexp
	1,		// 11	additional hider menu
	0,		// 12	process hidden posts (0=no, 1=merge, 2=full hide)
	0,		// 13	apply filter to threads
	0,		// 14	fast hidden posts preview
	1,		// 15	>>links map
	1,		// 16	'quick reply' btns
	1,		// 17	'add to favorities' btns
	0,		// 18	show btns as text
	0,		// 19	show SAGE in posts
	0,		// 20	2-ch captchas (0,1,2)
	0,		// 21	hide board rules
	0,		// 22	hide 'goto' field
	2,		// 23	expand images (0=no, 1=simple, 2=+preview)
	0,		// 24	expand shorted posts
	0,		// 25	hide scrollers in posts
	1,		// 26	>>links preview
	0,		// 27	YouTube player
	0,		// 28	mp3 player
	0,		// 29	move replyform down
	442,	// 30	textarea width
	110,	// 31	textarea height
	0,		// 32	reply with SAGE
	0,		// 33	apply user password
	'',		// 34		user password value
	0,		// 35	apply user name
	'',		// 36		user name value
	2,		// 37	upload new posts (0=no, 1=by click, 2=auto)
	0,		// 38	reply without reload (verify on submit)
	0,		// 39	open spoilers
	0,		// 40	hide password field
	1,		// 41	email field -> sage btn
			// antiwipe:
	0,		// 42	Same lines
	0,		// 43	Same words
	0,		// 44	Specsymbols
	0,		// 45	Long columns
	0,		// 46	Long words
	0,		// 47	Numbers
	0		// 48	CaSe/CAPS
],

Cfg = [],
Visib = [],
Posts = [],
oPosts = [],
Expires = [],
postByNum = [],
ajaxPosts = {},
ajaxThrds = [],
doc = document,
HIDE = 1,
UNHIDE = 0,
STORAGE_LIFE = 259200000; // 3 days

/*=============================================================================
									UTILS
=============================================================================*/

function $X(path, rootNode) {
	return doc.evaluate(path, rootNode || doc, null, 6, null);
}
function $x(path, rootNode) {
	return doc.evaluate(path, rootNode || doc, null, 8, null).singleNodeValue;
}
function $id(id) {
	return doc.getElementById(id);
}
function $n(name) {
	return doc.getElementsByName(name)[0];
}
function $next(el) {
	do el = el.nextSibling;
	while(el && el.nodeType != 1);
	return el;
}
function $prev(el) {
	do el = el.previousSibling;
	while(el && el.nodeType != 1);
	return el;
}
function $up(el, i) {
	if(!i) i = 1;
	while(i--) el = el.parentNode;
	return el;
}
function $each(list, fn) {
	if(!list) return;
	var i = list.snapshotLength;
	if(i > 0) while(i--) fn(list.snapshotItem(i), i);
}
function $html(el, html) {
	var cln = el.cloneNode(false);
	cln.innerHTML = html;
	el.parentNode.replaceChild(cln, el);
	return cln;
}
function $attr(el, attr) {
	for(var key in attr) {
		if(key == 'html') {el.innerHTML = attr[key]; continue}
		if(key == 'text') {el.textContent = attr[key]; continue}
		if(key == 'value') {el.value = attr[key]; continue}
		el.setAttribute(key, attr[key]);
	}
	return el;
}
function $event(el, events) {
	for(var key in events)
		el.addEventListener(key, events[key], false);
}
function $revent(el, events) {
	for(var key in events)
		el.removeEventListener(key, events[key], false);
}
function $append(el, childs) {
	var child;
	for(var i = 0, len = childs.length; i < len; i++) {
		child = childs[i];
		if(child) el.appendChild(child);
	}
}
function $before(el, inserts) {
	for(var i = 0, len = inserts.length; i < len; i++)
		if(inserts[i]) el.parentNode.insertBefore(inserts[i], el);
}
function $after(el, inserts) {
	var i = inserts.length;
	while(i--)
		if(inserts[i]) el.parentNode.insertBefore(inserts[i], el.nextSibling);
}
function $new(tag, attr, events) {
	var el = doc.createElement(tag);
	if(attr) $attr(el, attr);
	if(events) $event(el, events);
	return el;
}
function $New(tag, childs, attr, events) {
	var el = $new(tag, attr, events);
	$append(el, childs);
	return el;
}
function $txt(el) {
	return doc.createTextNode(el);
}
function $if(cond, el) {
	if(cond) return el;
}
function $del(el) {
	if(el) el.parentNode.removeChild(el);
}
function delNexts(el) {
	while(el.nextSibling) $del(el.nextSibling);
}
function delChilds(el) {
	while(el.hasChildNodes()) el.removeChild(el.firstChild);
}
function toggleDisp(el) {
	el.style.display = (el.style.display != 'none') ? 'none' : '';
}
function toggleChk(box) {
	box.checked = !box.checked
}
function getOffset(a, b) {
	var c = 0;
	while (a) {c += a[b]; a = a.offsetParent}
	return c;
}
function rand10() {
	return Math.floor(Math.random()*1e10).toString(10);
}
function incc(arr, w) {
	if(arr[w]) arr[w] += 1;
	else arr[w] = 1;
}
function InsertInto(x, text) {
	var start = x.selectionStart;
	var end = x.selectionEnd;
	x.value = x.value.substr(0, start) + text + x.value.substr(end);
	x.setSelectionRange(start + text.length, start + text.length);
	x.focus();
}
String.prototype.trim = function() {
	var str = this.replace(/^\s\s*/, '');
	var i = str.length;
	while(/\s/.test(str.charAt(--i)));
	return str.substring(0, i + 1); 
};
function txtSelection() {
	return nav.Opera ? doc.getSelection() : window.getSelection().toString();
}

var jsonParse = function() {var u={'"':'"','/':'/','\\':'\\','b':'\b','f':'\f','n':'\n','r':'\r','t':'\t'};function v(h,j,e){return j?u[j]:String.fromCharCode(parseInt(e,16))}var w=new String(""),x=Object.hasOwnProperty;return function(h,j){h=h.match(new RegExp('(?:false|true|null|[\\{\\}\\[\\]]|(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)|(?:\"(?:[^\\0-\\x08\\x0a-\\x1f\"\\\\]|\\\\(?:[\"/\\\\bfnrt]|u[0-9A-Fa-f]{4}))*\"))','g'));var e,c=h[0],l=false;if("{"===c)e={};else if("["===c)e=[];else{e=[];l=true}for(var b,d=[e],m=1-l,y=h.length;m<y;++m){c=h[m];var a;switch(c.charCodeAt(0)){default:a=d[0];a[b||a.length]=+c;b=void 0;break;case 34:c=c.substring(1,c.length-1);if(c.indexOf('\\')!==-1)c=c.replace(new RegExp('\\\\(?:([^u])|u(.{4}))','g'),v);a=d[0];if(!b)if(a instanceof Array)b=a.length;else{b=c||w;break}a[b]=c;b=void 0;break;case 91:a=d[0];d.unshift(a[b||a.length]=[]);b=void 0;break;case 93:d.shift();break;case 102:a=d[0];a[b||a.length]=false;b=void 0;break;case 110:a=d[0];a[b||a.length]=null;b=void 0;break;case 116:a=d[0];a[b||a.length]=true;b=void 0;break;case 123:a=d[0];d.unshift(a[b||a.length]={});b=void 0;break;case 125:d.shift();break}}if(l){if(d.length!==1)throw new Error;e=e[0]}else if(d.length)throw new Error;if(j){var p=function(n,o){var f=n[o];if(f&&typeof f==="object"){var i=null;for(var g in f)if(x.call(f,g)&&f!==n){var q=p(f,g);if(q!==void 0)f[g]=q;else{i||(i=[]);i.push(g)}}if(i)for(g=i.length;--g>=0;)delete f[i[g]]}return j.call(n,o,f)};e=p({"":e},"")}return e}}();

function Log(txt) {
	var newTime = (new Date()).getTime();
	timeLog += '\n' + txt + ': ' + (newTime - oldTime).toString() + 'ms';
	oldTime = newTime;
}

/*=============================================================================
								STORAGE / CONFIG
=============================================================================*/

function setCookie(name, value, life) {
	if(!name) return;
	var life = (life == 'delete') ? -10 : STORAGE_LIFE;
	var date = (new Date((new Date()).getTime() + life)).toGMTString();
	doc.cookie = escape(name) + '=' + escape(value) + ';expires=' + date + ';path=/';
}

function getCookie(name) {
	var arr = doc.cookie.split('; ');
	var i = arr.length;
	while(i--) {
		var one = arr[i].split('=');
		if(one[0] == escape(name)) return unescape(one[1]);
	}
}

function turnCookies(name) {
	var max = ch._0ch ? 10 : 15;
	var data = getCookie(ID('Cookies'));
	var arr = data ? data.split('|') : [];
	arr[arr.length] = name;
	if(arr.length > max) {
		setCookie(arr[0], '', 'delete');
		arr.splice(0, 1);
	}
	setCookie(ID('Cookies'), arr.join('|'));
}

function getStored(name) {
	if(sav.local) return localStorage.getItem(name);
	return getCookie(name);
}

function setStored(name, value) {
	if(sav.local) {localStorage.setItem(name, value); return}
	setCookie(name, value);
}

function ID(name, pNum) {
	var c = !sav.cookie ? '_' + domain : '';
	if(name == 'Posts' || name == 'Threads')
		return 'DESU_' + name + c + '_' + board + (!pNum ? '' : '_' + pNum);
	if(name == 'Config' || name == 'Cookies' || name == 'RegExpr')
		return 'DESU_' + name + c;
}

function setDefaultCfg() {
	Cfg = defaultCfg;
	setStored(ID('Config'), defaultCfg.join('|'));
}

function saveCfg(num, val) {
	Cfg[num] = val;
	setStored(ID('Config'), Cfg.join('|'));
}

function toggleCfg(num) {
	var cnf = Cfg[num] == 0 ? 1 : 0;
	saveCfg(num, cnf);
}

function initCfg() {
	var data = getStored(ID('Config'));
	if(!data) setDefaultCfg();
	else Cfg = data.split('|');
	if(!getStored(ID('RegExpr')))
		setStored(ID('RegExpr'), '');
}

function getVisib(pNum) {
	var key = !sav.cookie ? board + pNum : postByNum[pNum].Count;
	if(key in Visib) return Visib[key];
	return null;
}

function readPostsVisib() {
	if(!sav.cookie) {
		var data = getStored(ID('Posts'));
		if(!data) return;
		var arr = data.split('-');
		var i = arr.length/3;
		while(i>0) {
			i--;
			if((new Date()).getTime() < arr[i*3 + 2]) {
				Visib[arr[i*3]] = arr[i*3 + 1];
				Expires[arr[i*3]] = arr[i*3 + 2];
			} else setStored(ID('Posts'), arr.splice(i*3, 3).join('-'));
		}
	} else if(!main) {
		var data = getStored(ID('Posts', oPosts[0].Num));
		if(!data) return;
		for(var i = 0, len = data.length; i < len; i++)
			Visib[i + 1] = data[i];
	}
	forAll(function(post) {post.Vis = getVisib(post.Num)});
}

function storePostsVisib() {
	if(!sav.cookie) {
		var arr = [];
		for(var key in Visib)
			arr[arr.length] = key + '-' + Visib[key] + '-' + Expires[key];
		setStored(ID('Posts'), arr.join('-'));
	} else {
		if(!main) {
			var name = ID('Posts', oPosts[0].Num);
			if(!getStored(name)) turnCookies(name);
			setStored(name, Visib.join(''));
		}
	}
}

function readThreadsVisib() {
	var data = getStored(ID('Threads'));
	if(!data) return;
	var arr = data.split('-');
	var ar = [];
	var i = arr.length;
	while(i--) ar[arr[i]] = 1;
	forOP(function(post) {
		if(board + post.Num in ar) {
			hideThread(post);
			post.Vis = HIDE;
		}
	});
}

function storeThreadVisib(post, vis) {
	if(post.Vis == vis) return;
	post.Vis = vis;
	var key = board + post.Num;
	var data = getStored(ID('Threads'));
	var arr = data ? data.split('-') : [];
	if(vis == HIDE) {
		if(sav.cookie && arr.length > 80) arr.splice(0, 1);
		arr[arr.length] = key;
	} else {
		var i = arr.length;
		while(i--) if(arr[i] == key) arr.splice(i, 1);
	}
	setStored(ID('Threads'), arr.join('-'));
}

function storeFavorities(post) {
	var txt = getTitle(post).replace(/\|/g, '');
	txt = !sav.cookie ? txt.substring(0, 70) : txt.substring(0, 25);
	var pNum = post.Num;
	var data = getStored('DESU_Favorities');
	var arr = data ? data.split('|') : [];
	if(sav.cookie && arr.length/4 > 25) return;
	for(var i = 0; i < arr.length/4; i++)
		if(arr[i*4 + 1] == board && arr[i*4 + 2] == pNum) return;
	arr[arr.length] = domain + '|' + board + (/\/arch/.test(location.pathname) ? '/arch|' : '|') + pNum + '|' + txt;
	setStored('DESU_Favorities', arr.join('|'));
}

function removeFavorities(node) {
	var key = node.textContent.replace('arch/', '').replace('res/', '').split('/');
	var arr = getStored('DESU_Favorities').split('|');
	for(var i = 0; i < arr.length/4; i++)
		if(arr[i*4] == key[0] && arr[i*4 + 1].split('/')[0] == key[1] && arr[i*4 + 2] == key[2])
			arr.splice(i*4, 4);
	$del($up(node, 2));
	if(arr.length == 0) $id('favorities_div').firstChild.innerHTML = '<b>Вибрані треди відсутні...</b>';
	setStored('DESU_Favorities', arr.join('|'));
}


/*=============================================================================
							CONTROLS / COMMON CHANGES
=============================================================================*/

function addControls() {
	var chkBox = function(num, fn, id) {
		if(!fn) fn = toggleCfg;
		var box = $new('input', {'type': 'checkbox'}, {'click': function() {fn(num)}});
		box.checked = Cfg[num] == 1;
		if(id) box.id = id;
		return box;
	},
	trBox = function(num, txt, fn, id) {
		return $New('tr', [chkBox(num, fn, id), $txt(' ' + txt)]);
	},
	optSel = function(id, arr, num, fn) {
		for(var i = 0; i < arr.length; i++)
			arr[i] = '<option value="' + i + '">' + arr[i] + '</option>';
		var x = $new('select', {'id': id, 'html': arr.join('')}, {'change': fn});
		x.selectedIndex = Cfg[num];
		return x;
	};
	
	var postarea = $x('.//div[@class="postarea" or @align="center"]') || delform;
	var txt = '<input type="button" value="';
	var tools = $new('div', {'html': txt+'Налаштування"> '+txt+'Приховане"> '+txt+'Вибране"> '+txt+'Оновити" id="refresh_btn"> ' + (main && postform ? txt+'Створити тред"> ' : '') + '<div><table class="reply" id="controls_div" style="display:none; overflow:hidden; width:370px; min-width:0; border:1px solid grey; margin:5px 0px 5px 20px; padding:5px; font-size:small"><tbody></tbody></table></div> <div id="hiddenposts_div"></div> <div id="favorities_div"></div>'});
	var btn = $X('.//input', tools);
	$event(btn.snapshotItem(0), {'click': function() {
		delChilds($id('hiddenposts_div'));
		delChilds($id('favorities_div'));
		toggleDisp($id('controls_div'));
	}});
	$event(btn.snapshotItem(1), {'click': hiddenPostsPreview});
	$event(btn.snapshotItem(2), {'click': favorThrdsPreview});
	$event(btn.snapshotItem(3), {'click': function(e) {
		window.location.reload();
		e.stopPropagation();
		e.preventDefault();
	}});
	if(main) eventSelMenu(btn.snapshotItem(3), selectAjaxPages);
	if(main && postform) $event(btn.snapshotItem(4), {'click': function() {
		toggleDisp($x('.//div[@class="postarea"]', $up(delform)));
		toggleDisp($prev(delform));
	}});
	$before(postarea, [tools, $new('div', {'class': 'logo'}), $new('hr')]);
	
	$append($x('.//tbody', tools), [
		$new('tr', {'text': 'Dollchan Extension Tools', 'style': 'width:100%; text-align:center; font-weight:bold; font-family:sans-serif'}),
		$New('tr', [
			chkBox(0),
			$txt('Анти-вайп детектори '),
			$new('span', {
				'html': '[<a>&gt;&gt;</a>]',
				'style': 'cursor:pointer'}, {
				'click': function() {toggleDisp($id('antiwipecfg'))}})
		]),
		$New('div', [
			trBox(42, 'Same lines'),
			trBox(43, 'Same words'),
			trBox(44, 'Specsymbols'),
			trBox(45, 'Long columns'),
			trBox(46, 'Long words'),
			trBox(47, 'Numbers'),
			trBox(48, 'CaSe/CAPS')
			], {
			'id': 'antiwipecfg',
			'style': 'display:none; padding-left:15px'
		}),
		$if(!(ch.iich || ch.sib), trBox(1, 'Приховувати sage пости', toggleSage, 'sage_hider')),
		$if(!ch.sib, trBox(2, 'Приховувати пости з полем "Тема"', toggleTitle)),
		trBox(3, 'Приховувати пости без тексту', toggleNotext, 'notext_hider'),
		trBox(4, 'Приховувати пости без зображень', toggleNoimage, 'noimage_hider'),
		$New('tr', [
			chkBox(8, toggleMaxtext, 'maxtext_hider'),
			$txt(' Приховувати з текстом більше '),
			$new('input', {
				'type': 'text',
				'id': 'maxtext_field',
				'value': Cfg[9],
				'size': 4}, {
				'keypress': function(e) {if(e.which == 13) {e.preventDefault(); e.stopPropagation()}}}),
			$txt(' символів')
		]),
		$New('tr', [
			chkBox(10, toggleRegexp, 'regexp_hider'),
			$txt('Приховувати за виразом '),
			$new('span', {
				'html': '[<a>?</a>]',
				'style': 'cursor:pointer'}, {
				'click': function() {alert('Пошук в тексті/темі поста:\nвираз.1\nвираз.2\n...\n\nРегулярні вирази: $exp вираз.\n$exp /[bб].[tт]+[hх].[rр][tт]/i\n$exp /кукл[оа]([её]б|бляд|быдл)/i\n\nФайл: $img [<,>,=][розмір][@ширxвис]\n$img <35@640x480\n$img >@640x480\n$img =35\n\nПсевдо: $name [им\'я][!тріпкод][!!тріпкод]\n$name Sthephan!ihLBsDA91M\n$name !!PCb++jGu\nБудь-який тріпкод: $alltrip')}}),
			$new('input', {
				'type': 'button',
				'value': 'Застосувати',
				'style': 'float:right'}, {
				'click': applyRegExp}),
			$new('br'),
			$new('textarea', {
				'id': 'regexp_field',
				'value': getStored(ID('RegExpr')),
				'rows': 5,
				'cols': nav.Opera ? 47 : 41})
		]),
		$New('tr', [
			optSel('prochidden_sel', ['Не змінювати', 'Об\'єнати', 'Видалити'], 12,
				function() {processHidden(this.selectedIndex, Cfg[12])}),
			$txt(' приховані пости')
		]),
		trBox(14, 'Швидкий перегляд прихованих постів'),
		trBox(11, 'Додаткове меню на кнопці Приховати'),
		trBox(13, 'Застоcувати фільтри до тредів'),
		$new('hr'),
		$New('tr', [
			optSel('upload_sel', ['Відключена', 'За кліком', 'Авто'], 37,
				function() {saveCfg(37, this.selectedIndex)}),
			$txt(' отримання нових постів в треді*')
		]),
		trBox(38, 'Постити без перезавантаження (перевіряти відповідь)*'),
		trBox(15, 'Мапа >>посилань на пости*'),
		trBox(26, 'Перегляд тредів за >>посиланнями*'),
		$if(postform, trBox(16, 'Кнопки швидкої відповіді*')),
		trBox(17, 'Кнопки додавання у вибране*'),
		$if(!(ch.iich || ch.sib || ch.dc),
			trBox(19, 'Індикатор сажі в постах*')),
		trBox(18, 'Відображати кнопки як текст*'),
		trBox(7, 'Кнопки форматування тексту', function() {
			toggleCfg(7);
			$each($X('.//span[@id="txt_btns"]'), function(div) {toggleDisp(div)});
		}),
		$if(wk, $New('tr', [
			optSel('imgexpand_sel', ['Ні', 'Звичайно', 'З попер.перег.'], 23,
				function() {saveCfg(23, this.selectedIndex)}),
			$txt(' розкривати зображення')
		])),
		$if(wk, trBox(24, 'Розкривати скорочені пости*')),
		$if(ch._2ch, trBox(25, 'Прибрати прокручування в постах', function() {toggleCfg(25); scriptStyles()})),
		trBox(6, 'Приховати імена в постах', function() {toggleCfg(6); scriptStyles()}),
		trBox(39, 'Розкривати спойлери', function() {toggleCfg(39); scriptStyles()}),
		trBox(28, 'Плеєр до  mp3 посилань*'),
		$if(Rmail, trBox(41, 'Sage замість поля Псевдо*')),
		$if(postform, trBox(29, 'Форма відповіді знизу*')),
		$if(Rname, $New('tr', [
			$new('input', {
				'type': 'text',
				'id': 'usrname_field',
				'value': Cfg[36],
				'size': 20}),
			chkBox(35, toggleUserName, 'usrname_box'),
			$txt(' Постійне ім\'я')
		])),
		$if(Rpass, $New('tr', [
			$new('input', {
				'type': 'text',
				'id': 'usrpass_field',
				'value': Cfg[34],
				'size': 20}),
			chkBox(33, toggleUserPassw, 'usrpass_box'),
			$txt(' Постійний пароль')
		])),
		$New('tr', [
			$txt('Не відображати: '),
			$if(Rrules, chkBox(21, function() {toggleCfg(21); toggleDisp(Rrules)})),
			$if(Rrules, $txt(' правила ')),
			$if(Rgoto_tr, chkBox(22, function() {toggleCfg(22); toggleDisp(Rgoto_tr)})),
			$if(Rgoto_tr, $txt(' поле goto ')),
			$if(Rpass, chkBox(40, function() {toggleCfg(40); toggleDisp($up(Rpass, 2))})),
			$if(Rpass, $txt(' пароль '))
		]),
		$if(ch._2ch, $New('tr', [
			$txt(' Кількість капч що показуються* '),
			optSel('capnum_sel', [0, 1, 2], 20, function() {saveCfg(20, this.selectedIndex)})
		])),
		$new('hr'),
		$New('tr', [
			$new('span', {
				'id': 'process_time',
				'title': 'v.2010-06-21, storage: ' + (sav.GM ? 'greasemonkey' : (sav.local ? 'localstorage' : 'cookies')),
				'style': 'font-style:italic; cursor:pointer'}, {
				'click': function() {alert(timeLog)}}),
			$new('input', {
				'type': 'button',
				'value': 'Скидання налаштувань',
				'style': 'float:right'}, {
				'click': function() {setDefaultCfg(); window.location.reload()}})
		])
	]);
}
5
function hiddenPostsPreview() {
	delChilds($id('favorities_div'));
	$id('controls_div').style.display = 'none';
	var div = $id('hiddenposts_div');
	if(div.hasChildNodes()) {delChilds(div); return}
	div.innerHTML = '<table style="margin:5px 0px 5px 20px"><tbody></tbody></table>';
	var table = $x('.//tbody', div);
	var clones = [], tcnt = 0, pcnt = 0;
	forAll(function(post) {if(post.Vis == HIDE) {
		var pp = !post.isOp;
		var clone = $attr(($x('.//span[@id="hiddenthr_' + post.Num + '"]') || post).cloneNode(true), {'id': '', 'style': 'cursor:default'});
		clones[clones.length] = clone;
		clone.pst = post;
		clone.vis = HIDE;
		$event(pp ? $attr($x('.//span[@id="phide_' + post.Num + '"]', clone), {'id': ''}) : $x('.//a', clone), {
			'click': function(node) {return function() {
				node.vis = (node.vis == HIDE) ? UNHIDE : HIDE;
				if(pp) modPostDisp(node, node.vis);
				else if(node.vis == HIDE) toggleDisp($next(node));
			}}(clone)});
		$event($x('.//span[@class="reflink"]', clone) || $x('.//a', clone), {
			'mouseover': function(node) {return function() {
				if(node.vis == HIDE) {
					if(pp) modPostDisp(node, UNHIDE);
					else $next(node).style.display = 'block';
				}
			}}(clone),
			'mouseout': function(node) {return function() {
				if(node.vis == HIDE) {
					if(pp) modPostDisp(node, HIDE);
					else $next(node).style.display = 'none';
				}
			}}(clone)
		});
		$append(table, [
			$if(!pp && tcnt == 0, $new('tr', {'html': '<th align="left"><b>Приховані треди:</b></th>'})),
			$if(pp && pcnt == 0, $new('tr', {'html': '<th align="left"><b>Приховані пости:</b></th>'})),
			$New('tr', [clone, $if(!pp, $attr(post.cloneNode(true), {'class': 'reply', 'style': 'display:none'}))])
		]);
		if(!pp) {modPostDisp($next(clone), UNHIDE); tcnt++}
		else pcnt++;
		refPreview(clone);
	}});
	if(!table.hasChildNodes()) {table.innerHTML = '<tr><th>Приховане відсутнє...</th></tr>'; return}
	$append(table.insertRow(-1), [
		$new('input', {
			'type': 'button',
			'value': 'Розгорнути все'}, {
			'click': function() {
				if(/все/.test(this.value)) {
					this.value = 'Повернути назад';
					for(var clone, i = 0; clone = clones[i++];)
						setPostVisib(clone.pst, UNHIDE);
				} else {
					this.value = 'Розгорнути все';
					for(var clone, i = 0; clone = clones[i++];)
						setPostVisib(clone.pst, clone.vis);
				}
			}}),
		$new('input', {
			'type': 'button',
			'value': 'OK'}, {
			'click': function() {
				for(var clone, i = 0; clone = clones[i++];)
					if(clone.vis != HIDE) setPostVisib(clone.pst, UNHIDE);
				storePostsVisib();
				delChilds(div);
			}})
	]);
}

function favorThrdsPreview() {
	delChilds($id('hiddenposts_div'));
	$id('controls_div').style.display = 'none';
	var div = $id('favorities_div');
	if(div.hasChildNodes()) {delChilds(div); return}
	div.innerHTML = '<table style="margin:5px 0px 5px 20px"><tbody></tbody></table>';
	var table = $x('.//tbody', div);
	var data = getStored('DESU_Favorities');
	if(!data) {table.innerHTML = '<tr><th>Вибрані треди відсутні...</th></tr>'; return}
	else $append(table, [$new('tr', {'html': '<th align="left"><b>Вибрані треди:</b></th>'})]);
	var arr = data.split('|');
	for(var i = 0; i < arr.length/4; i++) {
		var dm = arr[i*4];
		var b = arr[i*4 + 1];
		var tNum = arr[i*4 + 2];
		var title = arr[i*4 + 3];
		var url = dm + '/' + b + '/res/' + tNum;
		if((!sav.cookie && title.length >= 70) || (sav.cookie && title.length >= 25)) title += '..';
		$append(table, [$New('tr', [
			$New('div', [
				$new('span', {
					'class': 'hide_icn'}, {
					'click': function() {removeFavorities($next($next(this)))}}),
				$new('span', {
					'class': 'expthr_icn'}, {
					'click': function(b, tNum) {return function() {
						var tr = $up(this, 2);
						var thread = $x('.//div[@class="thread"]', tr);
						if(thread) {$del(thread); return}
						ajaxGetThread(tr.appendChild(
							$new('div', {
								'class': 'thread',
								'id': tNum,
								'style': 'padding-left:15px',
								'text': 'Завантаження...'})
						), b, tNum, 5); 
					}}(b, tNum)}),
				$new('a', {
					'href': 'http://' + url + (dm != 'dobrochan.ru' ? '.html' : '.xhtml'),
					'html': dm + '/' + b + '/' + tNum}),
				$txt(' - ' + title)
				], {
				'class': 'reply',
				'style': 'cursor:default',
				'html': '&nbsp'
			})], {
			'id': 'favnote_' + i
		})]);
	}
	refPreview(div);
}

/*-----------------------------Dropdown select menus-------------------------*/

function removeSelMenu(x) {
	if(!$x('ancestor-or-self::*[@id="sel_menu"]', x)) $del($id('sel_menu'));
}

function addSelMenu(id, dx, dy, arr) {
	$before(delform, [$new('div', {
		'class': 'reply',
		'id': 'sel_menu',
		'style': 'position:absolute; left:' + (getOffset($id(id), 'offsetLeft') + dx).toString() + 'px; top:' + (getOffset($id(id), 'offsetTop') + dy).toString() + 'px; z-index:250; cursor:pointer; width:auto; min-width:0; border:solid 1px #575763; padding:0 5px 0 5px',
		'html': '<a>' + arr.join('</a><br><a>') + '</a>'}, {
		'mouseout': function(e) {removeSelMenu(e.relatedTarget)}})]);
	return $X('.//a', $id('sel_menu'));
}

function eventSelMenu(el, fn) {
	$event(el, {'mouseover': fn, 'mouseout': function(e) {removeSelMenu(e.relatedTarget)}});
}

function selectPostHider(post) {
	if(Cfg[11] == 0 || (Cfg[13] == 0 && post.isOp)) return;
	var a = addSelMenu('phide_' + post.Num, 0, 14, ['Приховати виділене', 'Приховати зображення', 'Приховати схожий текст']);
	$event(a.snapshotItem(0), {
			'mouseover': function() {quotetxt = txtSelection().trim()},
			'click': function() {applyRegExp(quotetxt)}});
	$event(a.snapshotItem(1), {'click': function() {regExpImage(post)}});
	$event(a.snapshotItem(2), {'click': function() {hideBySameText(post)}});
}

function selectExpandThread(post) {
	var p = ' постів';
	$each(addSelMenu('expthrd_' + post.Num, 0, 14, [5+p, 15+p, 30+p, 50+p, 100+p]),
		function(a) {$event(a, {'click': function() {ajaxExpandThread(post, parseInt(this.textContent))}})});
}

function selectAjaxPages() {
	var p = ' сторін';
	$each(addSelMenu('refresh_btn', 2, 21, [1+p+'ка', 2+p+'ки', 3+p+'ки', 4+p+'ки', 5+p+'ок']),
		function(a, i) {$event(a, {'click': function() {ajaxPages(i + 1)}})});
}

/*-------------------------------Changes in postform-------------------------*/

function capRefresh(img) {
	img.src = img.src.replace(/dummy=\d*/, 'dummy=' + rand10());
}

function capRefresh_2ch(img) {
	$each($X('.//img', $up(img)), function(cap) {capRefresh(cap)});
}

function getCaptcha(isMain, tNum) {
	if(!isMain && !tNum) tNum = oPosts[0].Num;
	return $new('img', {
		'id': 'imgcaptcha',
		'style': 'display:block',
		'alt': 'завантаження...',
		'src': (!isMain
			? '/' + board + '/captcha.pl?key=res' + tNum + '&amp;dummy=' + rand10()
			: '/' + board + '/captcha.pl?key=mainpage&amp;dummy=' + rand10())}, {
		'click': function() {capRefresh_2ch(this)}});
}

function forceCaptcha(e) {
	if(e.which == 0 || ch.dc) return;
	var code = e.charCode || e.keyCode;
	var ru = 'йцукенгшщзхъфывапролджэячсмитьбюё';
	var en = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,.`';
	var chr = String.fromCharCode(code).toLowerCase();
	var i = en.length;
	if(wk) {
		if(code < 0x0410 || code > 0x04FF) return;
		while(i--) if(chr == ru[i]) chr = en[i];
	}
	if(ch._0ch) {
		if(code < 0x0021 || code > 0x007A) return;
		while(i--) if(chr == en[i]) chr = ru[i];
	}
	e.preventDefault();
	InsertInto(e.target, chr);
}

function sageBtnFunc(mail, form) {
	var s = Cfg[32] == 1;
	var sage = $x('.//span[@id="sage_btn"]', form);
	sage.innerHTML = s ? '&nbsp;<span class="sage_icn"></span><b>SAGE</b>' : '<i>(без sage)</i>';
	sage.style.color = s ? 'red' : '';
	if(mail.type == 'text') mail.value = s ? 'sage' : '';
	else mail.checked = s ? true : false;
}

function sageBtnEvent(e) {
	toggleCfg(32);
	sageBtnFunc(Rmail, postform);
	if(QR) sageBtnFunc($prev($x('.//span[@id="sage_btn"]', QR)), QR);
	e.preventDefault();
	e.stopPropagation();
}

function textareaResizer(form) {
	$del($x('.//img[@id="resizer"]', form));
	var node = $x('.//textarea', form);
	$event(node, {'keypress': function(e) {
		var code = e.charCode || e.keyCode;
		if((code == 33 || code == 34) && e.which == 0) {e.target.blur(); window.focus()}
	}});
	var resmove = function(e) {
		node.style.width = e.pageX - getOffset(node, 'offsetLeft') + 'px';
		node.style.height = e.pageY - getOffset(node, 'offsetTop') + 'px';
	};
	var resstop = function() {
		$revent(doc.body, {'mousemove': resmove, 'mouseup': resstop});
		saveCfg(30, parseInt(node.style.width));
		saveCfg(31, parseInt(node.style.height));
	};
	var x = !(ch._0ch || ks) ? 14 : 19;
	var y = (nav.Opera) ? 9 : (nav.Chrome ? 2 : 6);
	node.style.cssText = 'width:' + Cfg[30] + 'px; height:' + Cfg[31] + 'px';
	$up(node).appendChild($new('img', {
		'id': 'resizer',
		'src': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABlBMVEUAAAAAAAClZ7nPAAAAAWJLR0QAiAUdSAAAAAF0Uk5TAEDm2GYAAAAWSURBVHjaY2BAAYyMDMNagBENYAgAABMoAD3fBUDWAAAAAElFTkSuQmCC',
		'style': 'position:relative;left:-' + x + 'px;top:' + y + 'px;cursor:se-resize'}, {
		'mousedown': function(e) {
			e.preventDefault();
			$event(doc.body, {'mousemove': resmove, 'mouseup': resstop});
		}}));
}

function toggleUserName() {
	toggleCfg(35);
	saveCfg(36, $id('usrname_field').value.replace(/\|/g, ''));
	var val = ($id('usrname_box').checked) ? Cfg[36] : '';
	Rname.value = val;
	if(QR) ($x('.//input[@name="nya1" or @name="akane" or @name="field1"]', QR) || $x('.//input[@name="name"]', QR)).value = val;
}

function toggleUserPassw() {
	toggleCfg(33);
	saveCfg(34, $id('usrpass_field').value.replace(/\|/g, ''));
	var val = $id('usrpass_box').checked ? Cfg[34] : rand10().substring(0, 8);
	Rpass.value = val;
	del_passw.value = val;
	if(QR) $x('.//input[@type="password"]', QR).value = val;
}

function doChanges() {

	if(ch.ua) toggleDisp($up($x('.//div[@class="gbBlock"]')));
	if(!main) {
		if(wakaba) allImgExpander();
		$before($x('.//div[@class="theader" or @class="replymode"]'), [
			$if(!ch._0ch, $new('span', {
				'html': '[<a href="' + window.location + '" target="_blank">В новій вкладці</a>]'})),
			$if(Posts.length > 50 && !ks, $new('span', {
				'html': ' [<a href="#">Останні 50</a>]'}, {
				'click': showLast50}))]);
	}
	if(ch.iich || ch.sib || ch.dc) Cfg[19] = 0;
	if(!postform) return;
	textFormatPanel(postform);
	textareaResizer(postform);
	$each($X('.//input[@type="text"]', postform), function(el) {el.size = 35});
	if(captcha) {
		if(Cfg[20] == 0) toggleDisp($up(captcha, 2));
		$event($attr(captcha, {'autocomplete': 'off'}), {'keypress': forceCaptcha});
	}
	if(Cfg[21] == 1) toggleDisp(Rrules);
	if(Cfg[40] == 1 && Rpass) toggleDisp($up(Rpass, 2));
	if(Cfg[35] == 1 && Rname) setTimeout(function() {Rname.value = Cfg[36]} , 10);
	if(Cfg[22] == 1 && Rgoto_tr) toggleDisp(Rgoto_tr);
	del_passw = $X('.//input[@type="password"]').snapshotItem(1);
	if(del_passw) setTimeout(function() {
		if(Cfg[33] == 1) {
			Rpass.value = Cfg[34];
			del_passw.value = Cfg[34];
		} else del_passw.value = Rpass.value;
	}, 10);
	var hr = $prev(delform);
	var b = $up(delform);
	var postarea = $x('.//div[@class="postarea"]', b);
	if(main) {
		toggleDisp(postarea);
		toggleDisp(postarea);
	}
	if(Cfg[29] == 1 && !main)
		$after(delform, [$x('.//div[@class="theader" or @class="replymode"]', b), postarea, hr]);
	if(captcha && wakaba) {
		var td = $x('./ancestor::td', captcha);
		var img = $x('.//img', td);
		if(ch._2ch) {
			var div = $id('captchadiv');
			if(div) {
				captcha.removeAttribute('onfocus');
				$del($prev(captcha));
				$del(div);
			} else $del($id('imgcaptcha'));
			for(var i = 0; i < Cfg[20]; i++)
				td.appendChild(getCaptcha(main));
		} else {
			$event(img, {'click': function() {capRefresh(this)}});
			img.style.display = 'block';
		}
	}
	if(Cfg[41] == 1 && Rmail) {
		toggleDisp(Rmail);
		if(Rname && $up(Rname).className != 'trap' && Rname.type != 'hidden') {
			delNexts(Rname);
			var mail_tr = !ch._0ch ? $up(Rmail, 2) : $up(Rmail, 3);
			$up(Rname).appendChild(Rmail);
			$del(mail_tr);
		}
		delNexts(Rmail);
		$append($up(Rmail), [$txt(' '), $new('span', {'id': 'sage_btn', 'style': 'cursor:pointer'}, {'click': sageBtnEvent})]);
		sageBtnFunc(Rmail, postform);
	}
	if(Cfg[38] == 1) {
		$x('.//body').appendChild($new('div', {'html': '<iframe name="submitcheck" id="submitcheck" src="about:blank" style="visibility:hidden; width:0px; height:0px; border:none"></iframe>'}));
		$attr(postform, {'target': 'submitcheck'});
		if(nav.Opera) $event(window, {'DOMFrameContentLoaded': iframeLoad});
		else $event($id('submitcheck'), {'load': iframeLoad});
	}
}

/*----------------------------Text formatting buttons------------------------*/

function insertTags(node, tag1, tag2) {
	var x = $x('ancestor::form//textarea', node);
	var start = x.selectionStart, end = x.selectionEnd;
	if(tag1 == '' && tag2 == '') {
		var i = (end - start);
		while(i--) tag2 += '^H';
	}
	var text = x.value.substring(start, end);
	x.value = (text != '')
		? x.value.substr(0, start) + tag1 + text + tag2 + x.value.substr(end)
		: tag1 + x.value + tag2;
}

function tfBtn(title, tag, bb, txt, src) {
	return $new('span', {
		'title': title,
		'style': (Cfg[18] == 0 ? 'padding:0 27px 27px 0; background:url(data:image/gif;base64,' + src + ') no-repeat' : ''),
		'html': (Cfg[18] == 1 ? '<b>|<a>' + txt + '</a>|</b>' : '')}, {
		'click': function() {
			if(ch._0ch || ch.sib) insertTags(this, '[' + bb + ']', '[/' + bb + ']');
			else insertTags(this, tag, tag);
		}});
}

function textFormatPanel(form) {
	var pre = 'R0lGODlhFwAWAMQAAP//////AP8A//8AAAD//wD/AAAA/wAAAPb2+Onq7Bc/e053qitemNXZ3Wmdypm92';
	$after($x('.//input[@type="submit"]', form), [$New('span', [
		tfBtn('Жирний', '**', 'b', 'B', pre +'2hoaP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABEALAAAAAAXABYAAAWTYBQtZGmepjg+bOu+7hIxD2LfeI4/DK3/Op4PSEQIazjIYbmEQII95E3JZD530ZzyajtwbUJHYjzekhPLc8LRE5/NZa+azXCTqdWDet1W46sQc20NhIRbhQ2HhXQOiIleiFSIdAuOioaQhQs9lZF5TI6bDJ2Ff02ODaKkqKyanK2whKqxsJsjKLi4Kgq8vb6/viIhADs='),
		tfBtn('Курсив', '*', 'i', '<i>i</i>', pre +'2hoaP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABEALAAAAAAXABYAAAV5YBQtZGmepjg+bOu+7hIxD2LfeI4/DK3/Op4PSEQIa0TI4XcsKpk9ZBHKcCSuWKwym3X0rFztIXz1VskJJQRtBofV7G9jTp8r6/g2nn7fz80Lfmp+cws9gXt9hIYMiHiKfoyOhIuHlJeSl5SGIyienioKoqOkpaQiIQA7'),
		tfBtn('Закреслений', 'DEL', 's', 'S', pre +'2hoaE1NTf///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABIALAAAAAAXABYAAAWNoCQtZGmepjg+bOu+7iIxD2LfeI4/DK3/Op4PSEQIazrIYQn5HXXL6KGZe+KUkIQWW+05tOAlWCseO7zjBDbNPjO+aog8Kq/XtW54en5g470NgYKDWIOBeYNLhoqGbguEU4KFhgs9j4lSBxGGgZUMl5BMnJ2Wo6aDnqCno6mrp5UjKLKyKgq2t7i5uCIhADs='),
		tfBtn('Спойлер', '%%', 'spoiler', '%', pre +'2hoaP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABEALAAAAAAXABYAAAV7YBQtZGmepjg+bOu+7hIxD2LfeI4/DK3/Op4PSEQIa0Xg0XZoOp9Q2xIBqVqvWGnPkUhgv9euY9sFm8Vkr/mLZnDV63Bi7G404lg73WGH+p96PQt2hIWGhguCh4uHiQyDjJENjpCSi5SWjJiZjQwjKKCgKgqkpaanpiIhADs='),
		$new('span', {
			'title': 'Цитувати',
			'style': (Cfg[18] == 0 ? 'padding:0 27px 27px 0; background:url(data:image/gif;base64,' + pre +'2hoaP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABEALAAAAAAXABYAAAWEYBQtZGmepjg+bOu+7hIxD2LfeI4/DK3/Op4PSEQIa7jDoWg75iAQZdGpg0p/Qkdiy+VaD92to6cNh7/dMaNsPke5anabq4TAyY28ft+oQ/ZxfHt+gmoLgn0HUIgNCz2Hg4p/jI2PfIuUeY4MkJmIm52efKCinwwjKKmpKgqtrq+wryIhADs=) no-repeat' : ''),
			'html': (Cfg[18] == 1 ? '<b>|<a>&gt;</a>|</b>' : '')}, {
			'mouseover': function() {quotetxt = txtSelection()},
			'click': function() {InsertInto($x('.//textarea', form), '>' + quotetxt.replace(/\n/gm, '\n>') + '\n')}})
		], {
		'id': 'txt_btns',
		'html': '&nbsp;',
		'style': 'padding:0 0 2px 0; cursor:pointer; width:195px;' + (Cfg[7] == 0 ? 'display:none' : '')}
	)]);
}

/*-----------------------------Quick Reply under post------------------------*/

function quickReply(post) {
	var tNum = getThread(post).id.match(/\d+/);
	var pNum = post.Num;
	if(!QR) {
		var first = true;
		QR = $attr(postform.cloneNode(true), {'class': 'reply'});
		$del($x('.//span[@id="txt_btns"]', QR));
		textareaResizer(QR);
		textFormatPanel(QR);
		$x('.//textarea', QR).value = '';
		var sage = $x('.//span[@id="sage_btn"]', QR);
		if(sage) $event(sage, {'click': sageBtnEvent});
		if(ch.ua || ch._410 || ch._0ch) $del($x('.//small', QR));
		if(captcha && (ch._0ch || ks)) {
			captcha.value = ' ';
			var a = $up($x('.//img[@id="captchaimage" or @id="faptchaimage"]', QR));
			$before(a, [$new('img', {'src': 'http://' + domain + (!ch._410 ? '/captcha.php?' + Math.random() : '/faptcha.php?board=' + board), 'style': 'cursor:pointer'}, {'click': function(e) {this.src = this.src.replace(/\?[^?]+$|$/, (!ch._410 ? '?' : '?board=' + board + '&') + Math.random())}})]);
			$del(a);
		}
	}
	if($next(post) == QR) {toggleDisp(QR); return}
	$after(post, [QR]);
	QR.style.display = 'block';
	if(main) {
		if(wakaba) {
			if(first) $before(
				$x('.//div[@class="trap" or @class="its_a_tarp"]|.//input[@name="name" or @name="akane"]', QR),
				[$new('input', {'type': 'hidden', 'id': 'thr_id', 'name': 'parent', 'value': tNum})]);
			else $id('thr_id').value = tNum;
		} else $x('.//input[@name="thread_id"]|.//input[@name="replythread"]', QR).value = tNum;
	}
	var cap = $x('.//input[@name="captcha"]', QR);
	if(cap) $event(cap, {'keypress': forceCaptcha});
	if(cap && wk) {
		if(ch._2ch) {
			$each($X('.//img[@id="imgcaptcha"]', QR), function(img) {$del(img)});
			for(var i = 0; i < Cfg[20]; i++)
				$up(cap).appendChild(getCaptcha(false, tNum));
		} else {
			var img = $x('.//img', $up(cap));
			var key = '?key=res' + tNum + '&amp;dummy=' + rand10();
			$event(img, {'click': function(e) {capRefresh(this)}});
			img.src = (ch.iich ? '/cgi-bin/captcha.pl/' + board + '/' : '/' + board + '/captcha.pl') + key;
		}
	}
	var ms = Rmess.value.trim();
	InsertInto($x('.//textarea', QR), (first && ms != '' ? ms + '\n' : '') + '>>' + pNum + '\n' + (quotetxt != '' ? '>' + quotetxt.replace(/\n/gm, '\n>') + '\n' : ''));
	$event($x('.//input[@type="submit"]', QR), {'click': function() {Rmess.value = $x('.//textarea', QR).value}});
}

/*----------------------Check for correct reply submit-----------------------*/

function iframeLoad(e) {
	var frame = (e.srcElement || e.originalTarget).contentDocument;
	if(!frame.body || frame.location == 'about:blank' || !frame.body.innerHTML) return;
	var err = frame.getElementsByTagName('h2')[0] || frame.getElementsByTagName('h1')[0];
	if(!ch.dc && (err || !frame.getElementById('delform'))) {
		alert(!err ? 'Помилка:\n' + frame.innerHTML : (err.firstChild || err).textContent);
		frame.location.replace('about:blank');
		return;
	}
	if(/error/.test(frame.location.pathname)) {
		var nodes = frame.getElementsByTagName('td');
		for(var node, i = 0; node = nodes[i++];)
			if(node.className == 'post-error') alert('Помилка: ' + node.textContent);
		frame.location.replace('about:blank');
		return;
	}
	Rmess.value = '';
	if(Rfile) Rfile.value = '';
	if(QR || !main) {
		if(main) ajaxExpandThread(postByNum[getThread(QR).id.match(/\d+/)], 8);
		else {$del(QR); ajaxNewPosts()}
		QR = undefined;
		if(captcha) captcha.value = '';
		if(wk && captcha) {
			var img = $x('.//img', $x('./ancestor::td', captcha));
			if(ch._2ch) capRefresh_2ch(img);
			else capRefresh(img);
		}
	} else window.location = frame.location;
	frame.location.replace('about:blank');
}

/*---------------------------Append styles for elements----------------------*/

function scriptStyles() {
	var icn = function(nm, src) {return nm + ' {vertical-align:middle; padding-left:18px; cursor:pointer; background:url(data:image/gif;base64,' + src + ') no-repeat} '};
	var pre = 'R0lGODlhDgAPALMAAP//////AP8A//8AAAD//wD/AAAA/wAAAN3d3cDAwJmZmYCAgGBgYEtLS////wAAACH5BAEAAA4ALAAAAAAOAA8AAAR';
	var txt =
		icn('.hide_icn', pre + 'U0MlJq7o4X7dQ+mCILAuohOdHfgpQJguQLowSA+7tKkxt4wgEbnHpkWhCAIJxNJIYyWWTSQMmqUYGDtBobJmMxhOAJZO6LM3l0/WE3oiGo0uv0x0RADs=') +
		icn('.unhide_icn', pre + 'N0MlJq7o4X7dQ+mCILEuYMIxJfheDIMz1LTHGAEDd1uidozsaAvciMmhHF3EIgCFJPVwPeiTRpFZaI+tyWhsN1g7zAXtMooYDzG6zHREAOw==') +
		icn('.rep_icn', pre + 'O0MlJq7o4X7dQ+mCILAt4hSD5LQCghgtzsa27YIys0LV75SRGr4VgxIyxIaB4DPYQiEYQ2SBGpUFsA9rAkhZdUFejSHQ9KFHD0W27244IADs=') +
		icn('.sage_icn','R0lGODlhDgAPALMAAP//////AP8A//8AAAD//wD/AAAA/wAAAO7u7oCAgGBgYEtLS////wAAAAAAAAAAACH5BAEAAAwALAAAAAAOAA8AAARBkMlJq7o4X6aS/6B3fVonmomCrAiqLNiyeHIMXwuL3K/sz4mfUKYbCmnGxUG3OvwwS9bBlolObSfF4WpaMJI/RgQAOw==')+
		icn('.expthr_icn', pre + 'P0MlJq7o4X7dQ+gsALF+CLCSIiGeJqiKbLkzGIEiNMfp15zYGCtXANYY04bCIOA55SKYTBV0akQxnMQZoEhulbRf8aRTDIrKp4TC7325HBAA7') +
		icn('.fav_icn', pre + 'T0MlJq7o4X7dQ+skFJsiyjAqCKKOJAgALLoxpInBpMzUM4D8frcbwGQHEGi1hTCh5puLxWWswAY0GLNGgdbVYE/hr5ZY/WXTDM2ojGo6sfC53RAAAOw==') +
	'td.reply {width:auto} .pcount {font-size:13px;font-weight:bold;cursor:default;color:#4f7942} .pcountb {font-size:13px;font-weight:bold;cursor:default;color:#c41e3a} ';
	if((ch._2ch && getCookie('wakabastyle') != 'Futaba') || ch._0ch) txt += '.postblock {background:#bbb} '; // gray postform color
	if(Cfg[39] == 1) txt += '.spoiler {background:#888 !important; color:#CCC !important} '; // open spoilers
	if(Cfg[25] == 1) txt += 'blockquote {max-height:100% !important; overflow:visible !important} '; // no scroller
	if(Cfg[6] == 1) txt += '.commentpostername, .postername, .postertrip {display:none}'; // no post names
	if(!$id('desustyle')) {
		$x('.//head').appendChild($new('style', {'id': 'desustyle', 'type': 'text/css', 'text': txt}));
		if(nav.Chrome) toggleDisp(delform);
	} else $id('desustyle').textContent = txt;
}


/*=============================================================================
							FOR POSTS AND THREADS
=============================================================================*/

function forPosts(fn) {
	for(var post, i = 0; post = Posts[i++];)
		fn(post);
}

function forOP(fn) {
	for(var post, i = 0; post = oPosts[i++];)
		fn(post);
}

function forAll(fn) {
	forOP(fn); forPosts(fn);
}

function getThread(node) {
	return $x('ancestor::div[@class="thread"]', node);
}

function getPost(node) {
	return !ch._0ch
		? $x('./ancestor::table[@class="replypost"]', node)
		: $x('./ancestor::div[@class="postnode"]|./ancestor::table[@class="replypost"]', node);
}

function getTitle(post) {
	var t = $x('.//span[@class="filetitle" or @class="replytitle"]', post);
	if(t) t = t.textContent.trim();
	if(!t || t == '') t = post.Text.trim();
	return t.replace(/\s/g, ' ');
}

function getPostMsg(post) {
	return wk ? $x('.//blockquote', post) 
		: (ch._0ch ? $x('.//div[@class="postmessage"]', post)
		: (ch.dc ? $x('.//div[@class="message"]|.//div[@class="postbody"]', post)
		: null));
}

function getText(node) {
	var n = node.nodeName;
	if(n == '#text') return node.data;
	if(n == 'BR' && !ch.dc) return '\n';
	var t = [];
	if(n == 'P' || n == 'BLOCKQUOTE') t[t.length] = '\n';
	var arr = node.childNodes;
	for(var x, i = 0; x = arr[i++];)
		t[t.length] = getText(x);
	return t.join('');
}

function isSagePost(post) {
	if(ch.iich || ch.sib) return false;
	if(wk) {
		var a = $x('.//a[starts-with(@href,"mailto")]', post);
		return a && /mailto:sage/i.test(a.href);
	}
	if(ch.dc && $x('.//img[@alt="Sage"]', post)) return true;
	if(ch._0ch && $x('.//a[@href="mailto:sage"]', post)) return true;
	return false;
}

/*----------------------------------Posts buttons----------------------------*/

function addHideThreadBtn(post) {
	var x = $new('span', {
		'id': 'phide_' + post.Num}, {
		'click': function() {hideThread(post); storeThreadVisib(post, HIDE)}});
	eventSelMenu(x, function() {selectPostHider(post)});
	if(Cfg[18] == 0) x.className = 'hide_icn';
	else {x.innerHTML = '[<a>Приховати</a>] '; x.style.cursor = 'pointer'};
	return x;
}

function addExpandThreadBtn(post) {
	var x = $new('span', {
		'id': 'expthrd_' + post.Num}, {
		'click': function() {ajaxExpandThread(post, 1)}});
	eventSelMenu(x, function() {selectExpandThread(post)});
	if(Cfg[18] == 0) x.className = 'expthr_icn';
	else {x.innerHTML = '[<a>Розгорнути</a>] '; x.style.cursor = 'pointer'};
	return x;
}

function addFavorBtn(post) {
	var x = $new('span', {
		'title': 'У вибране'}, {
		'click': function() {storeFavorities(post)}});
	if(Cfg[18] == 0) x.className = 'fav_icn';
	else {x.innerHTML = '[<a>У вибране</a>] '; x.style.cursor = 'pointer'};
	return x;
}

function addHidePostBtn(post) {
	var x = $new('span', {
		'id': 'phide_' + post.Num,
		'class': 'hide_icn'}, {
		'click': function() {togglePostVisib(post)}});
	eventSelMenu(x, function() {selectPostHider(post)});
	return x;
}

function addQuickRepBtn(post) {
	if(ch.dc) $del($x('.//a[@class="reply_ icon"]', post));
	var x = $new('span', {
		'title': 'Швидка відповідь'}, {
		'mouseover': function() {quotetxt = txtSelection()},
		'click': function() {quickReply(post)}});
	if(!(Cfg[18] == 1 && post.isOp)) x.className = 'rep_icn';
	else {x.innerHTML = '[<a>Швидка відповідь</a>] '; x.style.cursor = 'pointer'}
	return x;
}

function addSageMarker() {
	return $new('span', {
		'class': 'sage_icn',
		'title': 'SAGE'}, {
		'click': function() {toggleSage(); toggleChk($id('sage_hider'))}});
}

function addPostCounter(post) {
	return $new('i', {
		'class': (post.Count < 500 ? 'pcount' : 'pcountb'),
		'text': post.Count});
}

function addNote(post, text) {
	post.Btns.appendChild($new('a', {
		'id': 'note_' + post.Num,
		'style': 'font-size:12px; font-style:italic',
		'text': text}, {
		'click': function() {$del(this)}}));
}

function addPostButtons(post) {
	var div = $new('span');
	var x = [], i = 0, C = Cfg;
	if(ch.dc || ks) div.innerHTML = '&nbsp;';
	if(ch._0ch || ks) $del($x('.//span[@class="extrabtns"]', post));
	if(!post.isOp) {
		div.className = 'reflink';
		if(!main || post.isLoad) x[i++] = addPostCounter(post);
		if(C[19] == 1 && post.isSage) x[i++] = addSageMarker();
		if(C[16] == 1 && postform) x[i++] = addQuickRepBtn(post);
		x[i++] = addHidePostBtn(post);
	} else {
		if(C[18] == 0) div.className = 'reflink';
		if(C[19] == 1 && post.isSage) x[i++] = addSageMarker();
		if(C[17] == 1) x[i++] = addFavorBtn(post);
		if(C[16] == 1 && postform) x[i++] = addQuickRepBtn(post);
		if(main) x[i++] = addExpandThreadBtn(post);
		x[i++] = addHideThreadBtn(post);
	}
	var i = x.length;
	while(i--) div.appendChild(x[i]);
	$after($x('.//span[@class="reflink"]', post), [div]);
	post.Btns = div;
}

/*------------------------------------Players---------------------------------*/

function addMP3(post) {
	var links = $X('.//a[contains(@href,".mp3") or contains(@href,".wav")]', post);
	if(links.snapshotLength == 0) return;
	var msg = post.Msg;
	var mp3 = $new('div');
	$before(msg.firstChild, [mp3]);
	$each(links, function(link) {
	
	var re = new RegExp("^http\:\/\/uchan\.to", "ig");
  if (link.match(re)) 
  {
  
       var re = new RegExp("^http\:\/\/uchan\.to\/link\.php", "ig");
      if (link.match(re)) 
      {
      }
      else
      {
       if(!$x('.//param[contains(@value,"' + link.href + '")]', mp3))
       mp3 = $html(mp3, '<object type="application/x-shockwave-flash" data="https://web.archive.org/web/20160427055629/http://uchan.to/muz/mediaplayer.swf" width="240" height="24">    <param name="movie" value="https://web.archive.org/web/20160427055629/http://uchan.to/muz/mediaplayer.swf" /> <param name="bgcolor" value="#DDDDDD" /> <param name="allowscriptaccess" value="always"> <param name="volume" value="50"> <param name="repeat" value="always"> <param name="FlashVars" value="file='+ link.href +'&amp;repeat=always&amp;volume=50&amp;allowscriptaccess=always&amp;showinfo=1" /></object><br>  ');
      }
  
  } 



	});
}

function addFLV(post) {
	var links = $X('.//a[contains(@href,".flv")]', post);
	if(links.snapshotLength == 0) return;
	var msg = post.Msg;
	var flv = $new('div');
	$before(msg.firstChild, [flv]);
	$each(links, function(link) {
	
		var re = new RegExp("^http\:\/\/uchan\.to", "ig");
  if (link.match(re)) 
  {
  
       var re = new RegExp("^http\:\/\/uchan\.to\/link\.php", "ig");
      if (link.match(re)) 
      {
      }
      else
      {
		if(!$x('.//param[contains(@value,"' + link.href + '")]', flv))
		
		   mythumbflv = link.href;
           mythumbflv =  mythumbflv.replace(/src/,"thumb");
		   mythumbflv =  mythumbflv.replace(/\.flv/,"s.jpg");

			flv = $html(flv, '<object type="application/x-shockwave-flash" data="https://web.archive.org/web/20160427055629/http://uchan.to/muz/mediaplayer.swf" width="270" height="230">    <param name="movie" value="https://web.archive.org/web/20160427055629/http://uchan.to/muz/mediaplayer.swf" /> <param name="allowfullscreen" value="true" /> <param name="allowscriptaccess" value="always"> <param name="volume" value="50"> <param name="repeat" value="always"> <param name="FlashVars" value="file='+ link.href +'&amp;repeat=always&amp;volume=50&amp;allowfullscreen=true&amp;allowscriptaccess=always&amp;showinfo=1&amp;image='+ mythumbflv +'" /></object><br>  ');
      }
  
  } 
	
	
	
	
	
	

	});
}


function addOGG(post) {
	var links = $X('.//a[contains(@href,".ogg")]', post);
	if(links.snapshotLength == 0) return;
	var msg = post.Msg;
	var ogg = $new('div');
	$before(msg.firstChild, [ogg]);
	$each(links, function(link) {
	
	
		var re = new RegExp("^http\:\/\/uchan\.to", "ig");
  if (link.match(re)) 
  {
  
       var re = new RegExp("^http\:\/\/uchan\.to\/link\.php", "ig");
      if (link.match(re)) 
      {
      }
      else
      {
		if(!$x('.//param[contains(@value,"' + link.href + '")]', ogg))
		
			ogg = $html(ogg, '<object type="application/x-shockwave-flash" data="https://web.archive.org/web/20160427055629/http://uchan.to/muz/FOggPlayer.swf" width="240" height="21">    <param name="movie" value="https://web.archive.org/web/20160427055629/http://uchan.to/muz/FOggPlayer.swf" /> <param name="wmode" value="transparent" /> <param name="allowfullscreen" value="true" /> <param name="allowscriptaccess" value="always"> <param name="volume" value="50"> <param name="FlashVars" value="url='+ link.href +'&codec=ogg&volume=50&tracking=true&title=&width=200&height=21&repeat=true&loop=true" /></object><br>  ');
      }
  
  } 
	

	});
}


function searchMP3() {
	if($X('.//a[contains(@href,".mp3") or contains(@href,".wav")]', delform).snapshotLength > 0) forAll(addMP3);
	if($X('.//a[contains(@href,".flv")]', delform).snapshotLength > 0) forAll(addFLV);
	if($X('.//a[contains(@href,".ogg")]', delform).snapshotLength > 0) forAll(addOGG);
}

/*--------------------------------Expand images------------------------------*/

function expandImg(a, post) {
	var img = $x('.//img[@class="thumb"]', a);
	var pre = $x('.//img[@id="pre_img"]', a);
	var full = $x('.//img[@id="full_img"]', a);
	toggleDisp(img);
	if(pre) {toggleDisp(pre); return}
	if(full) {toggleDisp(full); return}
	var maxw = doc.body.clientWidth - getOffset(a, 'offsetLeft') - 20;
	var sz = getImgSize(post).split(/[x|×]/);
	var r = sz[0]/sz[1];
	var w = sz[0] < maxw ? sz[0] : maxw;
	var h = w/r;
	$append(a, [
		$if(Cfg[23] == 2, $attr(img.cloneNode(false), {
			'id': 'pre_img',
			'width': w,
			'height': h,
			'style': 'display:block'})),
		$new('img', {
			'class': 'thumb',
			'id': 'full_img',
			'alt': 'Завантаження...',
			'src': a.href,
			'width': w,
			'height': h,
			'style': 'display:' + (Cfg[23] == 2 ? 'none' : 'block')}, {
			'load': function() {
				$del($x('.//img[@id="pre_img"]', $up(this)));
				if(img.style.display == 'none') this.style.display = 'block';
			}})
	]);
}

function expandHandleImg(post) {
	if(post.Img) $event($up(post.Img, (ks ? 2 : 1)), {'click': function(e) {
		if(Cfg[23] != 0) {e.preventDefault(); expandImg(this, post);
	}}});
}

function allImgExpander() {
	if($X('.//img[@class="thumb"]', delform).snapshotLength <= 1) return;
	var txt = '[<a>Розгорнути зображення</a>]';
	oPosts[0].appendChild($new('div', {
		'id': 'expimgs_btn',
		'style': 'cursor:pointer',
		'html': txt}, {
		'click': function() {
			forPosts(function(post) {if(post.Img && post.Vis != HIDE) expandImg($up(post.Img), post)});
			var btn = $id('expimgs_btn');
			btn.innerHTML = /Розгорнути/.test(btn.innerHTML) ? '[<a>Згорнути зображення</a>]' : txt;
		}}));
}

/*--------------------------Add map of answers to post-----------------------*/

function refMap(post) {
	var arr = [];
	$each($X('.//a[starts-with(text(),">>")]', (post ? post.Msg : delform)), function(link) {
		if(!/\//.test(link.textContent)) {
			var rNum = link.hash.match(/\d+/) || link.pathname.substring(link.pathname.lastIndexOf('/')).match(/\d+/);
			var pst = getPost(link);
			if(postByNum[rNum] && pst) {
				var pNum = pst.id.match(/\d+/);
				if(!arr[rNum]) arr[rNum] = pNum;
				else if(arr[rNum].indexOf(pNum) == -1) arr[rNum] = pNum + ', ' + arr[rNum];
			}
		}
	});
	for(var rNum in arr) {
		var ref = arr[rNum].toString().replace(/(\d+)/g, '<a href="#$1">&gt;&gt;$1</a>');
		var map = post ? $id('rfmap_' + rNum) : undefined;
		if(!map) {
			map = $new('small', {'id': 'rfmap_' + rNum, 'html': '<i><br>Відповіді: ' + ref + '</i>'});
			refPreview(map);
			var msg = postByNum[rNum].Msg;
			if(msg) $up(msg).appendChild(map);
		} else refPreview($html(map.firstChild, map.firstChild.innerHTML + ', ' + ref));
	}
}

/*---------------------------Posts preview by reflinks-----------------------*/

function doPostPreview(e) {
	setTimeout(function() {$del($x('.//div[starts-with(@id,"preview")]'))}, 5);
	var tNum = this.pathname.substring(this.pathname.lastIndexOf('/')).match(/\d+/);
	var pNum = this.hash.match(/\d+/) || tNum;
	var b = this.pathname;
	if(/\//.test(b.substr(0, 1))) b = b.substr(1);
	b = b.split('/')[0];
	$del($id('pstprew_' + pNum));
	var x = e.clientX + (doc.documentElement.scrollLeft || doc.body.scrollLeft) - doc.documentElement.clientLeft + 1;
	var y = e.clientY + (doc.documentElement.scrollTop || doc.body.scrollTop) - doc.documentElement.clientTop;
	var clone = $new('div', {
		'class': 'reply',
		'id': 'pstprew_' + pNum,
		'style': 'width:auto; min-width:0; position:absolute; padding: 10px; z-index:900; border:dashed 2px #000000; ' +
			((x < doc.body.clientWidth/2)
				? 'left:' + x + 'px;'
				: 'right:' + parseInt(doc.body.clientWidth - x - 80) + 'px;') +
			' top:' + y + 'px;'}, {
		'mouseout': function(e) {
			var el = $x('ancestor-or-self::*[starts-with(@id,"pstprew")]', e.relatedTarget);
			if(!el) delPreviewClones();
			else while(/pstprew/.test($next(el).id)) $del($next(el));
		}});
	var functor = function(clone, html) {
		clone.innerHTML = html;
		clone.Img = $x('.//img[@class="thumb"]', clone);
		refPreview(clone);
		expandHandleImg(clone);
	};
	if(b == board) var post = postByNum[pNum];
	var aj = ajaxPosts[tNum];
	if(post) {
		functor(clone, ($x('.//td[@class="reply"]', post) || post).innerHTML);
		if(post.Vis == HIDE) modPostDisp(clone);
	} else if(aj && aj[pNum]) functor(clone, aj[pNum]);
	else {
		clone.innerHTML = 'Завантаження...';
		AJAX('thr', b, tNum, function(err) {
			var p = ajaxPosts[tNum][pNum];
			if(p) functor(clone, p);
			else clone.textContent = err ? err : 'Пост не знайдено';
		});
	}
	$before(ndelform, [clone]);
}

function refPreview(node) {
	$each($X('.//a[starts-with(text(),">>")]', node || delform), function(link) {
		if(ch.dc) {
			if(!nav.Opera) {if(link.getAttribute('onmouseover')) link.removeAttribute('onmouseover')}
			else if(link.onmouseover) link.onmouseover = '';
		}
		$event(link, {
			'mouseover': doPostPreview,
			'mouseout': function(e) {
				if(!$x('ancestor-or-self::*[starts-with(@id,"pstprew")]', e.relatedTarget))
					delPreviewClones();
			}});
	});
}

function delPreviewClones() {
	$each($X('.//div[starts-with(@id,"pstprew")]'), function(clone) {$del(clone)});
}


/*=============================================================================
								AJAX FUNCTIONS
=============================================================================*/

function parseHTMLdata(x) {
	var threads = x.substring(x.search(/<form[^>]+del/) + x.match(/<form[^>]+del[^>]+>/).toString().length, /userdelete">/.test(x) ? x.indexOf('userdelete">') - 13 : (/deletebuttons/.test(x) ? x.indexOf('deletebuttons') - 70 : x.lastIndexOf('<form') - 5)).split(/<br clear="left"[\s<\/p>]*<h[r\s\/]*>/i);
	for(var i = 0, tLen = threads.length - 1; i < tLen; i++) {
		var tNum = parseInt(threads[i].match(/(?:<input type="ch[^\d]+)(\d+)(?:[^>]+>)/)[1]);
		var posts = threads[i].split(/<table[^>]*>/);
		ajaxThrds[i] = tNum;
		ajaxPosts[tNum] = {keys: []};
		for(var j = 0, pLen = posts.length; j < pLen; j++) {
			var x = posts[j];
			var pNum = parseInt(x.match(/(?:<input type="ch[^\d]+)(\d+)(?:[^>]+>)/)[1]);
			ajaxPosts[tNum].keys.push(pNum);
			ajaxPosts[tNum][pNum] = x.substring((!/<\/td/.test(x) && /filesize">/.test(x)) ? x.indexOf('filesize">') - 13 : x.indexOf('<label'), /<\/td/.test(x) ? x.lastIndexOf('</td') : (/omittedposts">/.test(x) ? x.lastIndexOf('</span') + 7 : (/<\/div/.test(x) && !ks ? x.lastIndexOf('</div') + 6 : x.lastIndexOf('</blockquote') + 13)));
		}
	}
}

function parseJSONdata(x) {
	var threads = jsonParse(x.substring(x.indexOf('threads') - 2, x.lastIndexOf('events') - 3)).threads;
	for(var i = 0, tLen = threads.length; i < tLen; i++) {
		var tNum = threads[i].display_id;
		var posts = threads[i].posts;
		ajaxThrds[i] = tNum;
		ajaxPosts[tNum] = {keys: []};
		for(var j = 0, pLen = posts.length; j < pLen; j++) {
			var x = posts[j];
			var pNum = x.display_id;
			ajaxPosts[tNum].keys.push(pNum);
			var farr = [];
			for(var f = 0, fLen = x.files.length; f < fLen; f++) {
				var fl = x.files[f];
				farr[farr.length] = '<div class="file"><div class="fileinfo">Файл: <a href="/' + fl.src + '" target="_blank">' + fl.thumb.substr(fl.thumb.lastIndexOf('/') + 1) + '</a><br><em>' + fl.src.substr(fl.src.indexOf('.') + 1) + ', ' + (fl.size/1024).toFixed(2) + ' KB</em><br></div><a href="/' + fl.src + '" target="_blank"><img src="/' + fl.thumb + '" class="thumb" alt="/' + fl.src + '"></a></div>';
			}
			ajaxPosts[tNum][pNum] = '<label><a class="delete icon"><img src="/images/blank.png"></a>' + (x.sage ? '<img src="/images/sage-carbon.png" alt="Sage" title="Sage">' : '') + (x.subject ? '<span class="replytitle">' + x.subject + '</span>' : '') + '<span class="postername">' + x.name + '</span> ' + x.date + ' </label><span class="reflink"><a href="/' + board + '/res/' + tNum + '.xhtml#i' + pNum + '">No.' + pNum + '</a></span>' + (j == 0 ? '<span class="cpanel">[<a href="/' + board + '/res/' + tNum + '.xhtml">Відкрити тред</a>]</span>' : '') + '<br>' + (x.files.length > 0 ? farr.join('') + (x.files.length > 1 ? '<br style="clear: both">' : '') : '') + '<div class="postbody"><div class="message">' + x.message.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/\n/g, '<br>').replace(/(&gt;&gt;)(\d+)/g, '<a href="/' + board + '/res/' + tNum + '.xhtml#i$2">&gt;&gt;$2</a>').replace(/(http:\/\/.*?)(\s)/ig, '<a href="$1">$1</a>$2').replace(/(\*\*)(.*?)(\*\*)/g, '<b>$2</b>').replace(/(\*)(.*?)(\*)/g, '<i>$2</i>').replace(/(%%)(.*?)(%%)/g, '<span class="spoiler">$2</span>') + '</div></div>';
		}
	}
}

function AJAX(mod, b, id, callback) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if(xhr.readyState != 4) return;
		if(xhr.status == 200) {
			if(ch.dc) parseJSONdata(xhr.responseText);
			else parseHTMLdata(xhr.responseText);
			callback(null);
		} else callback('HTTP ' + xhr.status + ' ' + xhr.statusText);
	};
	xhr.open('GET', (mod == 'thr'
		? (ch.dc 
			? '/api/thread/new/' + b + '/' + id + '.json?last_post=0'
			: '/' + b + '/res/' + id + '.html')
		: ('/' + b + '/' + (ch.dc
			? ((id != '' ? id : 'index') + '.json?last_post=0')
			: (id != '' ? id + '.html' : ''))))
	, true);
	xhr.setRequestHeader('Cookie','js_bot=bot;');
	xhr.send(false);
}

function getNewPost(pNum, html, i) {
	return $new(i > 0 ? 'table' : 'div', {
		'class': (i > 0 ? 'replypost' : 'oppost'),
		'id': 'post_' + pNum,
		'html': (i > 0 ? '<tbody><tr><td class="doubledash">&gt;&gt;</td><td class="reply" id="reply' + pNum + '">' + html + '</td></tr></tbody>' : html)});
}

function addPostFunc(post, pNum, count, isLoad) {
	if(count == 1) oPosts[oPosts.length] = post;
	else Posts[Posts.length] = post;
	postByNum[pNum] = post;
	post.Num = pNum;
	post.Count = count;
	if(!(sav.cookie && main)) post.Vis = getVisib(pNum);
	post.Msg = getPostMsg(post);
	post.Text = getText(post.Msg).trim();
	post.Img = $x('.//img[@class="thumb"]', post);
	post.isSage = isSagePost(post);
	post.isLoad = isLoad;
	post.isOp = count == 1;
	addPostButtons(post);
	doPostFilters(post);
	if(post.Vis == HIDE) setPostVisib(post, HIDE);
	if(Cfg[12] == 1) mergeHidden(post);
	if(Cfg[15] == 1) refMap(post);
	if(Cfg[23] != 0 && wk) expandHandleImg(post);
	if(Cfg[26] == 1) refPreview(post.Msg);
	if(Cfg[28] == 1) addMP3(post);
}

function ajaxExpandPost(post) {
	if(post.Vis == HIDE || !$x('.//div[@class="abbrev"]', post)) return;
	var tNum = getThread(post).id.match(/\d+/);
	AJAX('thr', board, tNum, function() {
		var txt = ajaxPosts[tNum][post.Num];
		post.Msg = $html(post.Msg, txt.substring(txt.indexOf('<blockquote') + 12, txt.lastIndexOf('</blockquote>')));
		post.Text = getText(post.Msg);
		if(Cfg[26] == 1) refPreview(post.Msg);
		if(Cfg[28] == 1) addMP3(post);
	});
}

function ajaxExpandThread(post, last) {
	var thread = getThread(post);
	var tNum = post.Num;
	$del($x('.//span[@class="omittedposts"]|.//div[@class="abbrev"]', thread));
	$del($id('rfmap_' + tNum));
	if(Cfg[24] == 1 && wk) ajaxExpandPost(post);
	delNexts(post);
	AJAX('thr', board, tNum, function() {
		var len = ajaxPosts[tNum].keys.length;
		if(last != 1) last = len - last;
		if(last <= 0) last = 1;
		for(var i = last; i < len; i++) {
			var pNum = ajaxPosts[tNum].keys[i];
			addPostFunc(thread.appendChild(getNewPost(pNum, ajaxPosts[tNum][pNum], i)), pNum, i + 1, true);
		}
		if(!sav.cookie) storeHiddenPosts();
	});
}

function ajaxGetThread(parent, b, tNum, last) {
	AJAX('thr', b, tNum, function() {
		delChilds(parent);
		if(!ajaxPosts[tNum]) {alert('Заборонено в Учані'); return}
		addPostFunc(parent.appendChild(getNewPost(tNum, ajaxPosts[tNum][tNum], i)), tNum, 0, true);
		var len = ajaxPosts[tNum].keys.length;
		if(last != 1) last = len - last;
		if(last <= 0) last = 1;
		for(var i = last; i < len; i++) {
			var pNum = ajaxPosts[tNum].keys[i];
			addPostFunc(parent.appendChild(getNewPost(pNum, ajaxPosts[tNum][pNum], i)), pNum, i + 1, true);
		}
		if(!sav.cookie) storeHiddenPosts();
	});
}

function ajaxNewPosts() {
	var thread = $x('.//div[@class="thread"]');
	var tNum = oPosts[0].Num;
	AJAX('thr', board, tNum, function() {
		for(var i = Posts.length + 1, len = ajaxPosts[tNum].keys.length; i < len; i++) {
			var pNum = ajaxPosts[tNum].keys[i];
			var post = getNewPost(pNum, ajaxPosts[tNum][pNum], i);
			if(Cfg[37] == 1) $before($id('newpst_btn'), [post]);
			else {if(ch._0ch) $before($x('.//span[@style="float: right;"]', thread), [post]);
			else thread.appendChild(post)}
			addPostFunc(post, pNum, i + 1, true);
		}
		storeHiddenPosts();
	});
	if(Cfg[37] == 1) $id('newpst_btn').innerHTML = '[<i><a>Нові пости:</a></i> 0]';
}

function initNewPosts() {
	if(Cfg[37] == 1) {
		var thread = $x('.//div[@class="thread"]');
		var tNum = oPosts[0].Num;
		var txt = '[<i><a>Нові пости:</a></i> ';
		var x = $new('span', {
			'id': 'newpst_btn',
			'style': 'cursor:pointer',
			'html': txt + '0]'}, {
			'click': ajaxNewPosts});
		if(ch._0ch) $before($x('.//span[@style="float: right;"]', thread), [x]);
		else thread.appendChild(x);
		setInterval(function() {AJAX('thr', board, tNum, function() {$id('newpst_btn').innerHTML = txt + parseInt(ajaxPosts[tNum].keys.length - Posts.length - 1) + ']'})}, 60000);
	}
	if(Cfg[37] == 2) setInterval(ajaxNewPosts, 60000);
}

function ajaxPages(len) {
	delChilds(delform);
	Posts = []; oPosts = [];
	for(var p = 0; p < len; p++) {
		AJAX('brd', board, p == 0 ? '' : p, function() {
			for(var i = 0, tLen = ajaxThrds.length; i < tLen; i++) {
				var tNum = ajaxThrds[i];
				var thread = $new('div', {'class': 'thread', 'id': tNum});
				$append(delform, [thread, $new('br', {'clear': 'left'}), $new('hr')]);
				for(var j = 0, pLen = ajaxPosts[tNum].keys.length; j < pLen; j++) {
					var pNum = ajaxPosts[tNum].keys[j];
					var post = getNewPost(pNum, ajaxPosts[tNum][pNum], j);
					thread.appendChild(post);
					addPostFunc(post, pNum, j + 1, false);
					if(Cfg[24] == 1 && wk) ajaxExpandPost(post);
				}
			}
			if(!sav.cookie) storeHiddenPosts();
		})
	}
}


/*=============================================================================
								HIDERS / FILTERS
=============================================================================*/

function hideThread(post, note) {
	if(post.Vis == HIDE) return;
	modPostDisp(post, HIDE);
	var x = $new('span', {
		'class': 'reply',
		'id': 'hiddenthr_' + post.Num,
		'style': 'display:inline; cursor:default',
		'html': 'Тред <a style="cursor:pointer">№' + post.Num + '</a> приховано <i>(' + (!note ? getTitle(post).substring(0, 50) : 'autohide: ' + note) + ')' + '</i>'});
	$event($x('.//a', x), {'click': function() {unhideThread(post)}});
	$after($up(post), [x]);
	if(Cfg[12] == 2) {toggleDisp(x); toggleDisp($next(x)); toggleDisp($next($next(x)))}
}

function unhideThread(post) {
	if(post.Vis == UNHIDE) return;
	modPostDisp(post, UNHIDE);
	$del($id('hiddenthr_' + post.Num));
	storeThreadVisib(post, UNHIDE);
}

function prevHidden(e) {modPostDisp(getPost(this), UNHIDE)}
function unprevHidden(e) {modPostDisp(getPost(this), HIDE)}

function applyPostVisib(post, vis) {
	if(post.isOp) return;
	if(!sav.cookie) {
		Visib[board + post.Num] = vis;
		Expires[board + post.Num] = (new Date()).getTime() + STORAGE_LIFE;
	} else Visib[post.Count] = vis;
	post.Vis = vis;
	if(Cfg[12] == 2) post.style.display = (vis == HIDE) ? 'none' : '';
}

function setPostVisib(post, vis) {
	if(post.isOp) {
		if(vis == HIDE) hideThread(post);
		else unhideThread(post);
		return;
	}
	var reflink = post.Btns.previousSibling;
	post.Btns.firstChild.className = (vis == HIDE) ? 'unhide_icn' : 'hide_icn';
	modPostDisp(post, vis);
	applyPostVisib(post, vis);
	if(Cfg[14] == 0) return;
	if(vis == HIDE) $event(reflink, {'mouseover': prevHidden, 'mouseout': unprevHidden});
	else $revent(reflink, {'mouseover': prevHidden, 'mouseout': unprevHidden});
}

function togglePostVisib(post) {
	post.Vis = (post.Vis == UNHIDE) ? HIDE : UNHIDE;
	setPostVisib(post, post.Vis);
	storePostsVisib();
}

function hidePost(post, note) {
	if(!post.isOp) {
		if(post.Vis != HIDE) addNote(post, ' autohide: ' + note + ' ');
		applyPostVisib(post, HIDE);
	} else if(Cfg[13] == 1) {
		hideThread(post, note);
		storeThreadVisib(post, HIDE);
	}
}

function unhidePost(post) {
	if(!post.isOp) {
		if(detectWipe(post) != null) return;
		setPostVisib(post, UNHIDE);
		$del($id('note_' + post.Num));
		hideByWipe(post);
	} else if(Cfg[13] == 1) unhideThread(post);
}

function storeHiddenPosts() {
	forPosts(function(post) {if(post.Vis == HIDE) setPostVisib(post, HIDE)});
	storePostsVisib();
}

function modPostDisp(post, vis) {
	var x = [], i = 0;
	x[i++] = 'br';
	x[i++] = 'small';
	if(!ch.dc) {
		x[i++] = 'blockquote';
		x[i++] = 'img[starts-with(@class,"thumb")]';
		x[i++] = 'span[@class="filesize"]';
		x[i++] = 'div[@class="nothumb"]'; 
	} else {
		x[i++] = 'div[@class="postbody"]';
		x[i++] = 'div[@class="file"]';
		x[i++] = 'div[@class="fileinfo"]';
	}
	if(wk) {
		$del($x('.//img[@id="full_img"]', post));
		x[i++] = 'span[@class="thumbnailmsg"]';
	}
	if(post.isOp) {
		x[i++] = 'span[@class="omittedposts"]';
		x[i++] = 'div[@class="abbrev"]';
		toggleDisp($up(post));
	}
	while(i--) $each($X('.//' + x[i], post),
		function(node) {node.style.display = (vis == HIDE) ? 'none' : ''});
}

function mergeHidden(post) {
	if(post.Vis != HIDE) return;
	var div = $prev(post);
	var next = $next(post);
	if(!/merged/.test(div.id)) {
		div = $new('div', {'id': 'merged_' + post.Num, 'style': 'display:none'});
		$before(post, [$new('span', {
			'style': 'display:block; cursor:pointer'}, {
			'click': function() {
				var hDiv = $id('merged_' + post.Num);
				$prev(hDiv).innerHTML = (hDiv.style.display == 'none' ? unescape('%u25BC') : unescape('%u25B2')) + '[<i><a>Приховано:</a> ' + hDiv.childNodes.length + '</i>]';
				toggleDisp(hDiv)}}
		), div]);
	}
	div.appendChild(post);
	if(!next || getVisib(next.id.match(/\d+/)) == UNHIDE)
		$prev(div).innerHTML = unescape('%u25B2') + '[<i><a>Приховано:</a> ' + div.childNodes.length + '</i>]';
}

function processHidden(newCfg, oldCfg) {
	if(newCfg == 2 || oldCfg == 2) {
		forPosts(function(post) {if(post.Vis == HIDE) toggleDisp(post)});
		if(Cfg[13] == 1) $each($X('.//span[starts-with(@id,"hiddenthr_")]'), function(x) {
			toggleDisp(x); toggleDisp($next(x)); toggleDisp($next($next(x)))});
	}
	if(oldCfg == 1) 
		$each($X('.//div[starts-with(@id,"merged_")]'), function(div) {
			var px = div.childNodes;
			var i = px.length;
			while(i--) $after(div, [px[i]]);
			$del($prev(div));
			$del(div);
		});
	if(newCfg == 1) forAll(mergeHidden);
	saveCfg(12, newCfg);
}

function showLast50() {
	var div = $id('last50');
	if(!div) {
		div = $new('div', {'id': 'last50', 'style': 'display:none'});
		$before(Posts[0], [div]);
		for(var i = 0; i < Posts.length - 50; i++)
			div.appendChild(Posts[i]);
	} else toggleDisp(div);
}

/*-----------------------------------Filters---------------------------------*/

function doPostFilters(post) {
	if(post.Vis == HIDE) return;
	var C = Cfg;
	if(C[0] == 1) hideByWipe(post);
	if(C[1] == 1 && !ch.iich) hideBySage(post);
	if(C[2] == 1 && Rtitle && !post.isOp) hideByTitle(post);
	if(C[3] == 1) hideByNoText(post);
	if(C[4] == 1) hideByNoImage(post);
	if(C[8] == 1) hideByMaxtext(post);
	if(C[10] == 1) hideByRegexp(post);
}

function hideBySage(post) {
	if(post.isSage) hidePost(post, 'sage')
}
function toggleSage() {
	toggleCfg(1);
	if(Cfg[1] == 1) forAll(hideBySage);
	else forAll(function(post) {if(post.isSage) unhidePost(post)});
	storeHiddenPosts();
}

function hideByNoText(post) {
	if(post.Text == '') hidePost(post, 'no text')
}
function toggleNotext() {
	toggleCfg(3);
	if(Cfg[3] == 1) forAll(hideByNoText);
	else forAll(function(post) {if(post.Text == '') unhidePost(post)});
	storeHiddenPosts();
}

function hideByNoImage(post) {
	if(!post.Img) hidePost(post, 'no image')
}
function toggleNoimage() {
	toggleCfg(4);
	if(Cfg[4] == 1) forAll(hideByNoImage);
	else forAll(function(post) {if(!post.Img) unhidePost(post)});
	storeHiddenPosts();
}

function hideByTitle(post) {
	if(!ch._0ch && $x('.//span[@class="replytitle"]', post).textContent.trim() == '') return;
	if(ch._0ch && !$x('.//span[@class="filetitle"]', post)) return;
	hidePost(post, 'theme field');
}
function toggleTitle() {
	toggleCfg(2);
	if(Cfg[2] == 1) forPosts(hideByTitle);
	else forPosts(function(post) {
		if(!ch._0ch && $x('.//span[@class="replytitle"]', post).textContent == '') return;
		if(ch._0ch && !$x('.//span[@class="filetitle"]', post)) return;
		unhidePost(post)});
	storeHiddenPosts();
}

function hideByMaxtext(post) {
	var len = post.Text.replace(/\n/g, '').length;
	if(len >= parseInt(Cfg[9]))
		hidePost(post, 'text n=' + len + ' > max');
}
function toggleMaxtext() {
	var fld = $id('maxtext_field');
	if(isNaN(fld.value)) {
		$id('maxtext_hider').checked = false;
		saveCfg(8, 0);
		alert('введіть число знаків');
		return;
	}
	toggleCfg(8);
	saveCfg(9, fld.value);
	if(Cfg[8] == 1) forAll(hideByMaxtext);
	else forAll(function(post) {
		if(post.Text.replace(/\n/g, '').length >= parseInt(Cfg[9]))
		unhidePost(post);
	});
	storeHiddenPosts();
}

/*--------------------------Hide posts by expressions------------------------*/

function hideByRegexp(post) {
	var exp = doRegexp(post);
	if(exp) hidePost(post, 'match ' + exp.substring(0, 20) + '..');
}

function applyRegExp(txt) {
	var fld = $id('regexp_field');
	var val = fld.value.trim();
	if(txt) {
		if(txt.trim() == '') return;
		toggleRegexp();
		var nval = '\n' + val;
		var ntxt = '\n' + txt;
		val = (nval.indexOf(ntxt) > -1 ? nval.split(ntxt).join('') : val + ntxt).trim();
	}
	fld.value = val;
	setStored(ID('RegExpr'), val);
	$id('regexp_hider').checked = val != '';
	if(val != '') {
		saveCfg(10, 1);
		forAll(hideByRegexp);
		storeHiddenPosts();
	} else saveCfg(10, 0);
}

function toggleRegexp() {
	var val = $id('regexp_field').value.trim();
	setStored(ID('RegExpr'), val);
	if(val != '') {
		toggleCfg(10);
		if(Cfg[10] == 1) forAll(hideByRegexp);
		else forAll(function(post) {if(doRegexp(post)) unhidePost(post)})
		storeHiddenPosts();
	} else {
		$id('regexp_hider').checked = false;
		saveCfg(10, 0);
	}
}

function doRegexp(post) {
	var expr = getStored(ID('RegExpr')).split('\n');
	var pname = $x('.//span[@class="commentpostername" or @class="postername"]', post);
	var ptrip = $x('.//span[@class="postertrip"]', post);
	var ptitle = $x('.//span[@class="replytitle" or @class="filetitle"]', post);
	var i = expr.length;
	while(i--) {
		var x = expr[i].trim();
		if(/\$img /.test(x)) {
			if(!post.Img) continue;
			var img = doImgRegExp(post, x.split(' ')[1]);
			if(img != null) return img; else continue;
		}
		if(/\$name /.test(x)) {
			x = x.split(' ')[1];
			var nm = x.split(/!+/)[0];
			var tr = x.split(/!+/)[1];
			if(pname && nm != '' && pname.textContent.indexOf(nm) > -1 ||
				ptrip && tr != '' && ptrip.textContent.indexOf(tr) > -1) return x;
		}
		if(/\$exp /.test(x)) {
			x = x.split(' ')[1];
			var l = x.lastIndexOf('/');
			var re = new RegExp(x.substr(1, l - 1), x.substr(l + 1));
			if(post.Text.match(re)) return x;
			if(ptitle && re.test(ptitle.textContent)) return x;
		}
		if(x == '$alltrip' && ptrip) return x;
		x = x.toLowerCase();
		if(ptitle && ptitle.textContent.toLowerCase().indexOf(x) > -1) return x;
		if(post.Text.toLowerCase().indexOf(x) > -1) return x;
	}
	return null;
}

function regExpImage(post) {
	if(!post.Img) {
		toggleNoimage();
		toggleChk($id('noimage_hider'));
	} else applyRegExp('$img =' + getImgWeight(post) + '@' + getImgSize(post));
}

function doImgRegExp(post, expr) {
	if(expr == '') return null;
	var s = expr.split('@');
	var stat = s[0].substring(0, 1);
	var expK = s[0].substring(1);
	if(expK != '') {
		var imgK = getImgWeight(post);
		if((stat == '<' && imgK < expK) ||
			(stat == '>' && imgK > expK) ||
			(stat == '=' && imgK == expK))
			{if(!s[1]) return('image ' + expr)}
		else return null;
	}
	if(s[1]) {
		var x = s[1].split(/[x|×]/);
		var expW = x[0], expH = x[1];
		var sz = getImgSize(post).split(/[x|×]/);
		var imgW = sz[0], imgH = sz[1];
		if((stat == '<' && imgW < expW && imgH < expH) ||
			(stat == '>' && imgW > expW && imgH > expH) ||
			(stat == '=' && (imgW == expW && imgH == expH)))
			return 'image ' + expr;
	}
	return null;
}

function getImgWeight(post) {
	var inf = $x('.//em|.//span[@class="filesize"]', post).textContent.match(/\d+[\.\d\s|m|k|к]*[b|б]/i)[0];
	var w = parseFloat(inf.match(/[\d|\.]+/));
	if(/MB/.test(inf)) w = w*1000;
	if(/\d[\s]*B/.test(inf)) w = (w/1000).toFixed(2);
	return w;
}

function getImgSize(post) {
	return $x('.//em|.//span[@class="filesize"]', post).textContent.match(/\d+[x|×]\d+/)[0];
}

/*-------------------------Hide posts with similar text----------------------*/

function getWrds(post)
	{return post.Text.replace(/\s+/g, ' ').replace(/[\?\.\\\/\+\*\$\^\(\)\|\{\}\[\]!@#%_=:;<,-]/g, '').substring(0, 1000).split(' ')}

function hideBySameText(post) {
	if(post.Text == '') {
		toggleNotext();
		toggleChk($id('notext_hider'));
		return;
	}
	var vis = post.Vis;
	forAll(function(target) {findSameText(target, post, vis, getWrds(post))});
	storeHiddenPosts();
}

function findSameText(post, origPost, origVis, origWords) {
	var words = getWrds(post);
	var origLen = origWords.length;
	if(words.length > origLen*2.5 || words.length < origLen*0.5) return;
	var matchCount = 0;
	var i = origWords.length;
	while (i--) {
		if(origWords.length > 6 && origWords[i].length < 3) {origLen--; continue}
		var j = words.length;
		while (j--) if((words[j] == origWords[i]) || (origWords[i].substring(0, 2) == '>>' && words[j].substring(0, 2) == '>>')) matchCount++;
	}
	if(!(matchCount >= origLen*0.5 && words.length < origLen*2.5)) return;
	$del($id('note_' + post.Num));
	if(origVis != HIDE) hidePost(post, ' same text as >>' + origPost.Num);
	else unhidePost(post);
}


/*=============================================================================
								WIPE DETECTORS
=============================================================================*/

function detectWipe(post) {
	var detectors = [
		detectWipe_sameLines,
		detectWipe_sameWords,
		detectWipe_specSymbols,
		detectWipe_longColumn,
		detectWipe_longWords,
		detectWipe_numbers,
		detectWipe_caseWords
	];
	for(var i = 0; i < detectors.length; i++) {
		var detect = detectors[i](post.Text);
		if(detect != null) return detect;
	}
	return null;
}

function hideByWipe(post) {
	if(post.Vis == HIDE || post.Vis == UNHIDE) return;
	var note = detectWipe(post);
	if(note != null) hidePost(post, note);
	else applyPostVisib(post, UNHIDE);
}

function detectWipe_sameLines(txt) {
	if(Cfg[42] == 0) return null;
	var lines = txt.replace(/(> )/g, '').split('\n');
	var len = lines.length;
	if(len < 5) return null;
	var arr = [], n = 0;
	for(var i = 0; i < len; i++)
		if(lines[i].length > 0) {n++; incc(arr, lines[i])}
	for(var x in arr)
		if(arr[x] > n/4 && arr[x] >= 5)
			return 'same lines: "' + x.substr(0, 20) + '" x' + parseInt(arr[x] + 1);
	return null;
}

function detectWipe_sameWords(txt) {
	if(Cfg[43] == 0) return null;
	txt = txt.replace(/[\.\?\!,>]/g, ' ').replace(/\s+/g, ' ').toUpperCase();
	var words = txt.split(' ');
	var len = words.length;
	if(len <= 13) return null;
	var arr = [], n = 0;
	for(var i = 0; i < len; i++)
		if(words[i].length > 1) {n++; incc(arr, words[i])}
	if(n <= 10) return null;
	var keys = 0, pop = '', mpop = -1;
	for(var x in arr) {
		keys++;
		if(arr[x] > mpop) {mpop = arr[x]; pop = x}
		if(n > 25 && arr[x] > n/3.5)
			return 'same words: "' + x.substr(0, 20) + '" x' + arr[x];
	}
	pop = pop.substr(0, 20);
	if((n > 80 && keys <= 20) || n/keys > 7)
		return 'same words: "' + pop + '" x' + mpop;
	return null;
}

function detectWipe_specSymbols(txt) {
	if(Cfg[44] == 0) return null;
	txt = txt.replace(/\s+/g, '');
	var all = txt; 
	txt = txt.replace(/[0-9A-Za-zА-Яа-я\.\?!,]/g, '');
	var proc = txt.length/all.length;
	if(all.length > 30 && proc > 0.40)
		return 'specsymbols: ' + parseInt(proc*100) + '%';
	return null;
}

function detectWipe_longColumn(txt) {
	if(Cfg[45] == 0) return null;
	var n = 0;
	var rows = txt.split('\n');
	var len = rows.length;
	for(var i = 0; i < len; i++) {
		if(rows[i].length < 9) n++;
		else return null;
	}
	if(len > 45) return 'long text x' + len;
	if(n > 5) return 'columns x' + n;
	return null;
}

function detectWipe_longWords(txt) {
	if(Cfg[46] == 0) return null;
	txt = txt.replace(/http:\/\/.*?(\s|$)/g, '').replace(/[\.\?!,>:;-]/g, ' ').replace(/\s+/g, ' ');
	var words = txt.split(' ');
	var n = 0, all = '', lng = '';
	for(var i = 0, len = words.length; i < len; i++)
		if(words[i].length > 1) {
			n++;
			all += words[i];
			lng = words[i].length > lng.length ? words[i] : lng;
		}
	if((n == 1 && lng.length > 70) || (n > 1 && all.length/n > 12))
		return 'long words: "' + lng.substr(0, 20) + '.."';
	return null;
}

function detectWipe_numbers(txt) {
	if(Cfg[47] == 0) return null;
	txt = txt.replace(/\s+/g, ' ').replace(/(>>)(\d+)/g, '').replace(/http:\/\/.*?(\s|$)/g, '');
	var len = txt.length;
	var proc = (len - txt.replace(/[0-9]/g, '').length)/len;
	if(len > 30 && proc > 0.4) return 'numbers: ' + parseInt(proc*100) + '%';
	return null;
}

function detectWipe_caseWords(txt) {
	if(Cfg[48] == 0) return null;
	txt = txt.replace(/[\.\?!,-]/g, ' ').replace(/\s+/g, ' ');
	var words = txt.split(' ');
	var len = words.length;
	if(len <= 4) return null;
	var n = 0, all = 0, caps = 0;
	for(var i = 0; i < len; i++) {
		if(words[i].length < 5) continue;
		all++;
		var word = words[i];
		var up = word.toUpperCase();
		var lw = word.toLowerCase();
		var upc = 0, lwc = 0;
		var cap = word.match(/[a-zа-я]/ig);
		if(cap) {
			cap = cap.toString().trim();
			if(cap != '' && cap.toUpperCase() == cap) caps++;
		}
		for(var j = 0; j < word.length; j++) {
			if(up.charAt(j) == lw.charAt(j)) continue;
			if(word.charAt(j) == up.charAt(j)) upc++;
			else if(word.charAt(j) == lw.charAt(j)) lwc++;
		}
		var min = upc < lwc ? upc : lwc;
		if(min >= 2 && lwc + upc >= 5) n++;
	}
	if(n/all >= 0.3 && all > 8) return 'cAsE words: ' + parseInt(n/len*100) + '%';
	if(caps/all >= 0.3 && all > 5) return 'CAPSLOCK';
	return null;
}


/*=============================================================================
								INITIALIZATION
=============================================================================*/

function initBoard() {
	var ua = navigator.userAgent;
	nav = {
		Firefox: /firefox|minefield/i.test(ua),
		Opera: /opera/i.test(ua),
		Chrome: /chrome/i.test(ua)
	};
	var ls = !nav.Firefox && typeof localStorage === 'object' && localStorage != null;
	sav = {
		GM: nav.Firefox,
		local: ls,
		cookie: !ls && !nav.Firefox
	};
	var dm = location.host.match(/(?:(?:[^.]+\.)(?=org\.))?[^.]+\.[^.]+$/)
	ch = {
		_0ch: dm == '0chan.ru',
		_2ch: dm == '2-ch.ru',
		iich: dm == 'iichan.ru',
		dc: dm == 'dobrochan.ru',
		unyl: dm == 'wakachan.org',
		nowr: dm == 'nowere.net',
		_410: dm == '410chan.ru',
		ua: dm == 'uchan.to',
		sib: dm == 'sibirchan.ru'
	};
	domain = dm;
	wk = !ch.dc && !ch._0ch;
	ks = ch._410 || ch.sib;
	wakaba = wk && !ks;
	var path = location.pathname;
	main = !/\/res\//.test(path);
	board = path.substr(1).split('/')[0];
	delform = !ch.dc ? $id('delform') : $x('.//form[contains(@action, "delete")]');
	if(!delform) throw 'stop';
	ndelform = $next(delform);
	Rname = Rmail = Rgoto_tr = Rpass = Rrules = QR = undefined;
	postform = $id('postform');
	if(!postform) return;
	captcha = $n('captcha') || $n('faptcha');
	Rsubm = $x('.//input[@type="submit"]', postform);
	Rrules = $x('.//div[@class="rules"]|.//td[@class="rules"]');
	Rgoto_tr = $id('trgetback');
	if(!ch.unyl) Rpass = $n('password') || $n('postpassword');
	if(ch._2ch) {
		Rname = $n('akane');
		Rmail = $n('nabiki');
		Rtitle = $n('kasumi');
		Rmess = $n('shampoo');
		Rfile = $n('file');
	}
	if(ch._0ch || ks) {
		Rname = $n('name');
		Rmail = $n('em');
		Rtitle = $n('subject');
		Rmess = $n('message');
		Rfile = $n('imagefile');
		if(ch._0ch) Rgoto_tr = $up($n('gotothread'), 3);
	}
	if(ch.iich) {
		Rname = $n('nya1');
		Rmail = $n('nya2');
		Rtitle = $n('nya3');
		Rmess = $n('nya4');
		Rfile = $n('file');
		Rgoto_tr = $up($n('postredir'), 3);
	}
	if(ch.dc) {
		Rname = $n('name');
		Rmail = $n('sage');
		Rtitle = $n('subject');
		Rmess = $n('message');
		Rfile = $n('file_1');
	}
	if(ch.unyl || ch.nowr || ch.ua) {
		Rname = $n('field1');
		Rmail = $n('dont_bump') || $n('field2');
		Rtitle = $n('field3');
		Rmess = $n('field4');
		Rfile = $n('file');
	}
}

function initDelform() {
	if(nav.Chrome) toggleDisp(delform);
	if(wakaba && !ch.iich || (ch.sib && !main)) {
		var thrd_re = /<br clear="left"[<\/p>\s]*<hr>/i;
		var tNum_re = /(?:<a name=")(\d+)(?:">)/i;
		var threads = delform.innerHTML.split(thrd_re);
		var i = threads.length - 1;
		while(i--) {
			var posts = threads[i].split(/<table[^>]*>/i);
			var j = posts.length;
			while(j-- > 1) posts[j] = '<table class="replypost" id="post_' + posts[j].match(tNum_re)[1] + '">' + posts[j];
			var tNum = posts[0].match(tNum_re)[1];
			posts[0] = '<div class="oppost" id="post_' + tNum + '">' + posts[0] + '</div>';
			threads[i] = '<div class="thread" id="thread_' + tNum + '">' + posts.join('') + '</div>';
		}
		if(!nav.Chrome) toggleDisp(delform);
		delform = $html(delform, threads.join('<br clear="left"><hr>'));
		if(!nav.Chrome) toggleDisp(delform);
	} 
	else $each($X('./div[starts-with(@id, "thread")]', delform), function(thread) {
			$attr(thread, {'id': $prev($x('.//label', thread)).name, 'class': 'thread'})})
	if(ch.iich || ch._410 || (ch.sib && main)) {
		$each($X('.//td[@class="reply"]', delform), function(reply) {
			$attr($up(reply, 3), {'class': 'replypost', 'id': 'post_' + reply.id.match(/\d+/)})});
		$each($X('.//div[@class="thread" or starts-with(@id, "thread")]', delform), function(thread) {
			var op = $new('div', {'class': 'oppost', 'id': 'post_' + thread.id.match(/\d+/)});
			var nodes = thread.childNodes;
			var arr = [], x = 0;
			for(var node, j = 1; node = nodes[j++];) {
				if(node.tagName == 'TABLE' || $x('self::div[starts-with(@id,"replies")]', node)) break;
				arr[x++] = node;
			}
			for(var node, j = 0; node = arr[j++];)
				op.appendChild(node);
			$before(thread.firstChild, [op]);
		});
	}
	if(ch._0ch)
		$each($X('.//div[@class="postnode"]'), function(post) {
			var reply = $x('.//td[@class="reply"]', post);
			post.id = reply ? 'post_' + reply.id.match(/\d+/) : 'oppost_' + $up(post).id.match(/\d+/);
		});

	var px, opx;
	if(wk) {
		px = './/table[@class="replypost"]';
		opx = './/div[@class="oppost"]';
	}
	if(ch._0ch) {
		px = './/div[starts-with(@id,"post")]';
		opx = './/div[starts-with(@id,"oppost")]';
	}
	if(ch.dc) {
		px = './/table[starts-with(@class,"replypost")]';
		opx = './/div[starts-with(@class,"oppost")]';
	}
	$each($X(px, delform), function(post, i) {
		Posts[i] = post;
		post.isOp = false;
		post.Count = i + 2;
	});
	$each($X(opx, delform), function(post, i) {
		oPosts[i] = post;
		post.isOp = true;
		post.Count = 1;
	});
	forAll(function(post) {
		var num = post.id.match(/\d+/);
		var msg = getPostMsg(post);
		postByNum[num] = post;
		post.Msg = msg;
		post.Num = num;
		post.Text = getText(msg).trim();
		post.Img = $x('.//img[@class="thumb"]', post);
		post.isSage = isSagePost(post);
	});
}


/*=============================================================================
									MAIN
=============================================================================*/

function doScript() {
	initTime = (new Date()).getTime();
	oldTime = initTime; timeLog = '';
	initBoard();					Log('initBoard');
	initDelform();					Log('initDelform');
	initCfg();						Log('initCfg');
	readPostsVisib();				Log('readPostsVisib');
	readThreadsVisib();				Log('readThreadsVisib');
	addControls();					Log('addControls');
	forAll(addPostButtons);			Log('addPostButtons');
	if(Cfg[26] == 1) {
		refPreview();				Log('refPreview')}
	if(Cfg[15] == 1) {
		refMap();					Log('refMap')}
	forAll(doPostFilters);			Log('doPostFilters');
	storeHiddenPosts();				Log('storeHiddenPosts');
	doChanges();					Log('doChanges');
	if(Cfg[37] != 0 && !main) {
		initNewPosts();				Log('initNewPosts')}
	if(Cfg[12] == 1) {
		forPosts(mergeHidden);		Log('mergeHidden')}
	if(Cfg[23] != 0 && wk) {
		forAll(expandHandleImg);	Log('expandHandleImg')}
	if(Cfg[24] == 1 && main && wk) {
		forAll(ajaxExpandPost);		Log('ajaxExpandPost')}
	if(Cfg[28] == 1) {
		searchMP3();				Log('addMP3')}
	scriptStyles();					Log('scriptStyles');
	var endTime = oldTime - initTime;
	timeLog += '\n\nTotal: ' + endTime + 'ms';
	document.getElementById('hidememenu').style.display =  'none';
	document.getElementById('showme').style.display =  'block';
	$id('process_time').textContent = 'Час виконання: ' + endTime + 'ms';
}

})();

}

/*
     FILE ARCHIVED ON 05:56:29 Apr 27, 2016 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 15:29:29 Apr 01, 2020.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  exclusion.robots: 0.26
  exclusion.robots.policy: 0.246
  LoadShardBlock: 75.688 (3)
  PetaboxLoader3.datanode: 145.828 (5)
  captures_list: 118.882
  RedisCDXSource: 26.93
  esindex: 0.01
  PetaboxLoader3.resolve: 1363.49 (2)
  CDXLines.iter: 13.161 (3)
  load_resource: 1464.438
*/