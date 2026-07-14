(function () {
	function render(records) {
		// 歴代最速 rows are recorded in two columns (最速チャレンジ名 /
		// 最速優勝者) of the same sheet as 歴代王者's win history, so most
		// records here won't have those columns filled — keep only the ones
		// that do, in the order they appear in the sheet (there's no No/date
		// column for these, so sheet order stands in for chronology).
		var speedruns = records.filter(function (r) {
			return r['最速チャレンジ名'] && r['最速優勝者'];
		});

		var tally = {};
		var lastIndex = {};
		speedruns.forEach(function (r, i) {
			var person = r['最速優勝者'];
			tally[person] = (tally[person] || 0) + 1;
			lastIndex[person] = i;
		});

		var leaderboard = Object.keys(tally)
			.map(function (name) { return { name: name, count: tally[name], lastIndex: lastIndex[name] }; })
			.sort(function (a, b) {
				if (b.count !== a.count) return b.count - a.count;
				// tie: whoever reached this count first (earlier in sheet order) ranks above
				return a.lastIndex - b.lastIndex;
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

		var tbody = document.querySelector('#historyTable tbody');
		tbody.innerHTML = '';
		speedruns.forEach(function (r, i) {
			var tr = document.createElement('tr');
			var tdNo = document.createElement('td');
			tdNo.textContent = i + 1;
			var tdChallenge = document.createElement('td');
			tdChallenge.textContent = r['最速チャレンジ名'];
			var tdWinner = document.createElement('td');
			tdWinner.textContent = r['最速優勝者'];
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
