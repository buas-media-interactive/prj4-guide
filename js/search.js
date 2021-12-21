const resDiv = document.getElementById('searchResults');
const offcanvas = new bootstrap.Offcanvas(document.getElementById('searchOffcanvas'));
const ajax = new XMLHttpRequest();
const dataurl = `js/index.json`;
let index = [];
ajax.onload = function() {
	if (ajax.status === 200) {
		index = JSON.parse(ajax.response);
		index.forEach(function(page) {
			page.sections.forEach(function(section) {
				section.lines_lower = section.lines.map(l => l.toLowerCase());
			});
		});
	}
}
ajax.open('GET', dataurl);
ajax.send();

function indexMetadata() {
	return {
		'date': (new Date()).toISOString(),
		'browser': navigator.userAgent,
	}
}

function indexChapter() {
	return JSON.stringify({
		'page': document.location.pathname.split('/').slice(-1)[0],
		'sections': Array.from(document.querySelectorAll('section')).slice(1).map(section => ({
			'title': Array.from(section.querySelectorAll('h2')).map(h => h.textContent).join(' '),
			'id': `#${section.id}`,
			'lines': section.textContent.split('\n').map(l => l.trim()).filter(l => !!l)
		})),
		'meta': indexMetadata()
	});
}

function indexOtherPage() {
	return JSON.stringify({
		'page': document.location.pathname.split('/').slice(-1)[0],
		'sections': [{
			'title': document.querySelector('h1').textContent,
			'id': '',
			'lines': document.querySelector('main').textContent.split('\n').map(l => l.trim()).filter(l => !!l)
		}],
		'meta': indexMetadata()
	});
}

function closeOffCanvas() {
	window.setTimeout(function() {
		offcanvas.hide();
	}, 500);
}

function search(q) {
	let results = [], q_lower = q.toLowerCase(), q_length = q.length;
	if (q_length < 3) {
		resDiv.innerHTML = '<div class="alert alert-danger my-2">Please use a longer search term.</div>';
		return;
	}
	index.forEach(function(page) {
		page.sections.forEach(function(section) {
			let resScore = 0;
			let resStrings = [];
			section.lines_lower.forEach(function(ll, i) {
				let pos = ll.indexOf(q_lower);
				if (pos !== -1) {
					resScore++;
					let originalLine = section.lines[i];
					if (resStrings.length < 5) {
						let before = originalLine.substr(0,pos),
							during = originalLine.substr(pos, q_length),
							after = originalLine.substr(pos+q_length);
						if (before.length > 30) {
							before = '…' + before.substr(-30)
						}
						if (after.length > 30) {
							after = after.substr(0,30) + '…';
						}
						resStrings.push({
							'before': before,
							'during': during,
							'after': after,
						});
					}
				}
			});
			if (resScore) {
				results.push({
					'url': `${page.page}${section.id}`,
					'title': section.title,
					'score': resScore,
					'strings': resStrings
				})
			}
		})
	});
	results.sort(function(a,b) { return b.score - a.score });
	if (!results.length) {
		resDiv.innerHTML = '<div class="alert alert-danger my-2">No results found.</div>';
		return;
	}
	resDiv.innerHTML = '';
	results.forEach(function(result) {
		let div = document.createElement('div');
		div.className = 'my-2 p-2 bg-light border';
		let a = document.createElement('a');
		a.setAttribute('href', result.url);
		a.addEventListener('click', closeOffCanvas);
		let title = document.createElement('h5');
		title.textContent = result.title;
		a.appendChild(title);
		div.appendChild(a);
		result.strings.forEach(function(resstr) {
			let p = document.createElement('p'),
				before = document.createElement('em'),
				during = document.createElement('strong'),
				after = document.createElement('em');
			before.textContent = resstr.before;
			during.textContent = resstr.during;
			after.textContent = resstr.after;
			p.className = 'mb-1';
			p.appendChild(before);
			p.appendChild(during);
			p.appendChild(after);
			div.appendChild(p);
		});
		resDiv.appendChild(div);
	});
}

document.getElementById('searchForm').addEventListener('submit', function(evt) {
	evt.preventDefault();
	search(document.getElementById('searchField').value)
});
