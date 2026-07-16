(function () {
	function render(records) {
		// 歴代最速 rows are recorded in two columns (最速チャレンジ名 /
		// 最速優勝者) of the same sheet as 歴代王者's win history, so most
		// records here won't have those columns filled — keep only the ones
		// that do. There's no No/date column for these, so the sheet's row
		// order stands in for chronology — oldest at the top, newest at the
		// bottom (confirmed against the actual data: 新千手チャレンジ, the
		// topmost row, is the oldest; 大樹チャレンジ, the bottommost, is the
		// newest), i.e. new entries get appended below the existing ones.
		var speedruns = records.filter(function (r) {
			return r['最速チャレンジ名'] && r['最速優勝者'];
		});

		// walk oldest-to-newest to compute each person's running count of
		// 最速 titles and, the first time a name appears, their champion
		// number — mirrors 歴代王者's ascending pass for 優勝者名.
		var tally = {};
		var mostRecentIndex = {};
		var seenNames = {};
		var champCounter = 0;
		speedruns.forEach(function (r, i) {
			var person = r['最速優勝者'];
			tally[person] = (tally[person] || 0) + 1;
			r._runningCount = tally[person];
			// scanning oldest-to-newest, so the last time we see this person
			// (largest i, simply overwriting on each occurrence) is their most
			// recent occurrence
			mostRecentIndex[person] = i;
			if (!seenNames[person]) {
				seenNames[person] = true;
				champCounter++;
				r._champNumber = champCounter;
			}
		});

		var leaderboard = Object.keys(tally)
			.map(function (name) { return { name: name, count: tally[name], mostRecentIndex: mostRecentIndex[name] }; })
			.sort(function (a, b) {
				if (b.count !== a.count) return b.count - a.count;
				// tie: whoever reached this count first — i.e. their most recent
				// occurrence happened earlier in time (smaller index) — ranks above
				return a.mostRecentIndex - b.mostRecentIndex;
			});

		var RANK_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };
		var RANK_CLASS = { 1: 'rank-gold', 2: 'rank-silver', 3: 'rank-bronze' };
		var lbList = document.getElementById('leaderboardList');
		lbList.innerHTML = '';
		leaderboard.forEach(function (item, i) {
			var rank = (i > 0 && leaderboard[i - 1].count === item.count) ? leaderboard[i - 1]._rank : i + 1;
			item._rank = rank;
			var li = document.createElement('li');
			li.value = rank;
			if (RANK_CLASS[rank]) li.className = RANK_CLASS[rank];
			li.textContent = (RANK_MEDAL[rank] ? RANK_MEDAL[rank] + ' ' : '') + item.name + '（' + item.count + '回）';
			lbList.appendChild(li);
		});

		// The sheet is written oldest-first (top row = oldest, new entries
		// appended below), so No is assigned in that order (oldest = 1) but
		// the table itself lists newest first — same convention as 歴代王者's
		// history table (No 降順).
		var tbody = document.querySelector('#historyTable tbody');
		tbody.innerHTML = '';
		speedruns.slice().reverse().forEach(function (r, revIndex) {
			var no = speedruns.length - revIndex;
			var tr = document.createElement('tr');
			var tdNo = document.createElement('td');
			tdNo.textContent = no;
			var tdChallenge = document.createElement('td');
			tdChallenge.textContent = r['最速チャレンジ名'];
			var tdWinner = document.createElement('td');
			var label = r['最速優勝者'];
			label += r._champNumber
				? (r._runningCount > 1
					? '（' + r._runningCount + '・' + r._champNumber + '人目）'
					: '（' + r._champNumber + '人目）')
				: '（' + r._runningCount + '）';
			tdWinner.textContent = label;
			tr.appendChild(tdNo);
			tr.appendChild(tdChallenge);
			tr.appendChild(tdWinner);
			tbody.appendChild(tr);
		});

		document.getElementById('dungeonCount').textContent = speedruns.length;
		document.getElementById('leaderboardSection').style.display = '';
		document.getElementById('historySection').style.display = '';
		document.getElementById('rankingsStatus').style.display = 'none';
	}

	fetchSheetRecords(render, function (err) {
		document.getElementById('rankingsStatus').textContent =
			'データの読み込みに失敗しました（' + err.message + '）';
	});
})();
