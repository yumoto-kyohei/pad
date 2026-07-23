// Shared Google Sheet CSV fetch/parse, used by both rankings.js (歴代王者)
// and speedrun.js (歴代最速) — both read different columns of the same
// sheet, so the sheet ID and CSV parsing live here once.
var SHEET_ID = '10D6ye3r_v3EOfZ4EhKg8l2LCSfe4RCN6vkhv7FS1wvY';
var SHEET_GID = '0';

function parseSheetCSV(text) {
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

function sheetRowsToRecords(rows) {
	var header = rows[0];
	return rows.slice(1)
		.filter(function (r) { return r.length > 1 || r[0]; })
		.map(function (r) {
			var obj = {};
			header.forEach(function (h, i) { obj[h] = r[i] || ''; });
			return obj;
		});
}

function fetchSheetRecords(onSuccess, onError) {
	var csvUrl = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/export?format=csv&gid=' + SHEET_GID;
	fetch(csvUrl)
		.then(function (res) {
			if (!res.ok) throw new Error('HTTP ' + res.status);
			return res.text();
		})
		.then(function (text) { onSuccess(sheetRowsToRecords(parseSheetCSV(text))); })
		.catch(onError);
}
