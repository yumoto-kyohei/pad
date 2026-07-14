(function () {
	// TODO: fill in once the Google Sheet is created and shared as "Anyone with the link: Viewer"
	var SHEET_ID = '1Kexrx1Xav5MR3PUn27LTgjOWOdalwSpTHpuKxerMoM0';
	var GID = '0';
	var CSV_URL = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/export?format=csv&gid=' + GID;

	function parseCSV(text) {
		var rows = [];
		var row = [];
		var field = '';
		var inQuotes = false;
		for (var i = 0; i < text.length; i++) {
			var c = text[i];
			if (inQuotes) {
				if (c === '"') {
					if (text[i + 1] === '"') { field += '"'; i++; }
					else { inQuotes = false; }
				} else {
					field += c;
				}
			} else if (c === '"') {
				inQuotes = true;
			} else if (c === ',') {
				row.push(field); field = '';
			} else if (c === '\n') {
				row.push(field); rows.push(row); row = []; field = '';
			} else if (c === '\r') {
				// skip
			} else {
				field += c;
			}
		}
		if (field.length || row.length) { row.push(field); rows.push(row); }
		return rows;
	}

	function toRecords(rows) {
		var header = rows[0];
		return rows.slice(1)
			.filter(function (r) { return r.length > 1 || r[0]; })
			.map(function (r) {
				var obj = {};
				header.forEach(function (h, i) { obj[h] = r[i] || ''; });
				return obj;
			});
	}

	function render(records) {
		// walk chronologically (oldest No first) to compute each person's running
		// win count and their most recent win, then attach it back onto the record
		var ascending = records.slice().sort(function (a, b) { return Number(a.No) - Number(b.No); });
		var tally = {};
		var lastWin = {};
		var seenNames = {};
		var champCounter = 0;
		ascending.forEach(function (r) {
			if (!r['優勝者名']) return;
			var person = r['本人'] || r['優勝者名'];
			tally[person] = (tally[person] || 0) + 1;
			r._runningCount = tally[person];
			lastWin[person] = { no: r.No, dungeon: r['ダンジョン名'] };

			// a distinct display name shows up for the first time = a new champion,
			// even if it's an alt account of someone who has already won before
			var dispName = r['優勝者名'];
			if (!seenNames[dispName]) {
				seenNames[dispName] = true;
				champCounter++;
				r._champNumber = champCounter;
			}
		});

		var leaderboard = Object.keys(tally)
			.map(function (name) { return { name: name, count: tally[name], last: lastWin[name] }; })
			.sort(function (a, b) {
				if (b.count !== a.count) return b.count - a.count;
				// tie: whoever reached this win count first (i.e. their most
				// recent win happened earlier) ranks above
				return Number(a.last.no) - Number(b.last.no);
			});

		var RANK_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };
		var RANK_CLASS = { 1: 'rank-gold', 2: 'rank-silver', 3: 'rank-bronze' };
		var lbList = document.getElementById('leaderboardList');
		lbList.innerHTML = '';
		leaderboard.forEach(function (item, i) {
			// same win count = same rank (ties share a number, next rank skips
			// ahead by how many were tied, e.g. 1st, 2nd, 2nd, 4th)
			var rank = (i > 0 && leaderboard[i - 1].count === item.count) ? leaderboard[i - 1]._rank : i + 1;
			item._rank = rank;
			var li = document.createElement('li');
			li.value = rank;
			if (RANK_CLASS[rank]) li.className = RANK_CLASS[rank];
			var nameSpan = document.createElement('span');
			nameSpan.className = 'lbName';
			nameSpan.textContent = (RANK_MEDAL[rank] ? RANK_MEDAL[rank] + ' ' : '') + item.name + '（' + item.count + '回）';
			li.appendChild(nameSpan);
			var lastSpan = document.createElement('span');
			lastSpan.className = 'lastWin';
			lastSpan.textContent = '　最新: ' + item.last.dungeon;
			li.appendChild(lastSpan);
			lbList.appendChild(li);
		});

		// group by No so tied wins on the same dungeon share one row. Rows
		// that only carry 歴代最速 data (see below) have no No and are
		// skipped here, so they don't show up as a stray empty entry.
		var byNo = {};
		var order = [];
		records.forEach(function (r) {
			if (!r.No) return;
			if (!(r.No in byNo)) {
				byNo[r.No] = { no: r.No, dungeon: r['ダンジョン名'], winners: [] };
				order.push(r.No);
			}
			if (r['優勝者名']) {
				var label = r['優勝者名'] + (r['身元不明'] === 'TRUE' ? '？' : '');
				if (r._champNumber) {
					label += r._runningCount > 1
						? '（' + r._runningCount + '・' + r._champNumber + '人目の王者）'
						: '（' + r._champNumber + '人目の王者）';
				} else {
					label += '（' + r._runningCount + '）';
				}
				byNo[r.No].winners.push(label);
			}
		});
		var groups = order
			.map(function (no) { return byNo[no]; })
			.sort(function (a, b) { return Number(b.no) - Number(a.no); });

		var tbody = document.querySelector('#historyTable tbody');
		tbody.innerHTML = '';
		groups.forEach(function (g) {
			var tr = document.createElement('tr');
			var winnerText = g.winners.length ? g.winners.join(' ＆ ') : '王者なし';
			var tdNo = document.createElement('td');
			tdNo.textContent = g.no;
			var tdDungeon = document.createElement('td');
			tdDungeon.textContent = g.dungeon;
			var tdWinner = document.createElement('td');
			tdWinner.textContent = winnerText;
			tr.appendChild(tdNo);
			tr.appendChild(tdDungeon);
			tr.appendChild(tdWinner);
			tbody.appendChild(tr);
		});

		document.getElementById('dungeonCount').textContent = groups.length;
		document.getElementById('leaderboardSection').style.display = '';
		document.getElementById('historySection').style.display = '';
		document.getElementById('rankingsStatus').style.display = 'none';

		// 歴代最速: recorded in the same sheet as separate columns
		// (最速チャレンジ名 / 最速優勝者), independent of the No-keyed win
		// history above — a row here doesn't need a No or 優勝者名 at all.
		var speedruns = records.filter(function (r) {
			return r['最速チャレンジ名'] && r['最速優勝者'];
		});
		var speedTbody = document.querySelector('#speedrunTable tbody');
		if (speedTbody) {
			speedTbody.innerHTML = '';
			speedruns.forEach(function (r) {
				var tr = document.createElement('tr');
				var tdChallenge = document.createElement('td');
				tdChallenge.textContent = r['最速チャレンジ名'];
				var tdWinner = document.createElement('td');
				tdWinner.textContent = r['最速優勝者'];
				tr.appendChild(tdChallenge);
				tr.appendChild(tdWinner);
				speedTbody.appendChild(tr);
			});
			document.getElementById('speedrunSection').style.display = speedruns.length ? '' : 'none';
		}
	}

	fetch(CSV_URL)
		.then(function (res) {
			if (!res.ok) throw new Error('HTTP ' + res.status);
			return res.text();
		})
		.then(function (text) { render(toRecords(parseCSV(text))); })
		.catch(function (err) {
			document.getElementById('rankingsStatus').textContent =
				'データの読み込みに失敗しました（' + err.message + '）';
		});
})();
