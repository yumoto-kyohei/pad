var colors = ['blue','green','red','light','dark','heart']
	, colorsbak = ['blue','green','red','light','dark','heart']
	, colors2 = ['blue','green','red','light','dark','heart','poison','jammer']
	, colors3 = ['blue','green','red','light','dark']
	, divs = []
	, savedBoardState = []
	, changeTheWorldOn = 0
	, timerOn = 0
	, dropSpeed = 300
	, scale = 90
	, offsetMargin = 0
	, cornerspace = 20
	, rows = 6, cols = 5
	, scoreTracker = []
	, swapHasHappened = 0
	, timeOut = []
	, ctwTimeOut = []
	, freeToPlay = 0
	, skyFall = 0
	, showReplayArrows = 1
	, timerTime = 4000
	, toDrop = 0
    , showComboItems = true
	, randomizeMatchedOrbs = false
	, shuffleInstead = false
	, minimumMatched = 2
	, minimumMatches = 2
	, LIBRARY_KEY = 'puzzlePracticeBoards'
	, appMode = 'play'
	, selectedPaintColor = null
	, painting = false
	, measureOn = 1
	, lastMeasuredTime = null;

function hideUnit(obj) {
	var link = document.getElementById(obj);
	link.style.display = 'none';
    return false;
}

function toObject(arr){
	var rv = {};
	for (var i = 0; i < arr.length; ++i)
		if (arr[i] !== undefined) rv[i] = arr[i];
	return rv;
}

function inverObject(obj) {
	var result = {};
    for (var key in obj) if (hasOwnProperty.call(obj, key)) result[obj[key]] = key;
    return result;
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function convertPosition(x, y){
	return (y*rows+x*1);
}

function convertXY(position, single){
	if (single == 'x') return position%rows;
	if (single == 'y') return Math.floor(position/rows);
	return [position%rows, Math.floor(position/rows)];
}

function randomColor(check){
	var randomIndex;
	if (check == 1) {
		randomIndex = Math.floor(Math.random() * colors3.length);
		return colors[randomIndex];
	}
	else randomIndex = Math.floor(Math.random() * colors.length);
	return colors[randomIndex];
}

jQuery.fn.swap = function(b, trigger){
	b = jQuery(b)[0];
	var a = this[0];
	var t = a.parentNode.insertBefore(document.createTextNode(''), a);
	b.parentNode.insertBefore(a, b);
	t.parentNode.insertBefore(b, t);
	t.parentNode.removeChild(t);
	if (trigger == 2){ // only legit swaps
		if (swapHasHappened == 0) replayMoveSet.push(((b.offsetTop - b.parentNode.offsetTop - offsetMargin)/scale)*rows+((b.offsetLeft - b.parentNode.offsetLeft - offsetMargin)/scale));
		replayMoveSet.push(((a.offsetTop - a.parentNode.offsetTop - offsetMargin)/scale)*rows+((a.offsetLeft - a.parentNode.offsetLeft - offsetMargin)/scale));
	}
	return this;
};

function displayOutput(content, clear){
	if (typeof clear === "undefined") clear = 0;
	if (clear == 0) document.getElementById("infobooth").innerHTML=content;
	else if (clear == 2) document.getElementById("infobooth").innerHTML=content+document.getElementById("infobooth").innerHTML;
	else document.getElementById("infobooth").innerHTML+=content;
}

function toColor(letter, colorSet){
	letter = letter.toLowerCase();
	if (colorSet == 1) colorSet = colors.slice();
	else colorSet = colors2.slice();
	for (var g=0; g<colors2.length;g++) {
		if (letter == colors2[g].charAt(0)) return colors2[g];
	}
	return 0;
}

function toLetter(color){
	for (var g=0; g<colors2.length;g++) {
		if (color == colors2[g]) return colors2[g].charAt(0);
	}
	return 0;
}

function escapeHtml(str){
	return String(str).replace(/[&<>"']/g, function(c){
		return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
	});
}

function getTiles(){
	divs = document.getElementsByClassName('tile');
}

function trackScore(matches){
	for (var i=0;i<matches.length;i++) {
		scoreTracker[divs[matches[i][0]].getAttribute('tileColor')].push([matches[i].length]);
	}
}

function clearMemory(item){
	if (item=='score') {
		for (var i=0; i<colors2.length;i++) {
			scoreTracker[colors2[i]] = [];
		}
	}
	if (item=='timeout') {
		for (i = 0; i < timeOut.length; i++) {
			clearTimeout(timeOut[i]);
		}
		timeOut = new Array();
	}
	if (item == 'arrows'){
		document.getElementById("arrowSurface").width = document.getElementById("arrowSurface").width+1;
		document.getElementById("arrowSurface").width = document.getElementById("arrowSurface").width-1;
	}
	if (item == 'ctw'){
		ctwTimeOut = new Array();
	}
}

function capitaliseFirstLetter(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function unCapitaliseFirstLetter(string){
    return string.charAt(0).toLowerCase() + string.slice(1);
}

function toggle(item, command){
	if (item == 'timemode'){
		if (command == 'countdown') {
			timerOn = 1;
			measureOn = 0;
			reset();
			displayOutput('制限モード: 一定時間ドロップを動かすと自動的に終了します<br />', 0);
		}
		else {
			timerOn = 0;
			measureOn = 1;
			reset();
			document.getElementById('time').innerHTML = formatTime(0, 1);
			displayOutput('計測モード: ドロップを動かし始めてから離すまでの時間を計測します<br />', 0);
		}
		document.getElementById('countdownAdjust').style.display = (timerOn == 1) ? 'inline-block' : 'none';
		document.getElementById('modeCountdownBtn').classList.toggle('modebutton-active', timerOn == 1);
		document.getElementById('modeMeasureBtn').classList.toggle('modebutton-active', measureOn == 1);
	}
	if (item == 'draggable'){
		if (command==2) return $( ".tile" ).draggable( "option", "disabled");
		if (command==1) setTimeout(function(){ $( ".tile" ).draggable( "option", "disabled", false ); }, 5);
		else setTimeout(function(){ $( ".tile" ).draggable( "option", "disabled", true ); }, 5);
	}
	if (item == 'skyfall'){
		if (skyFall == 0) {
			skyFall = 1;
			displayOutput('Skyfall enabled.<br /><br />You will now be able to extra turns. Press SkyFall again to disable this. Replays will not save which orbs fall');
			}
		else {
			skyFall = 0;
			displayOutput('Skyfall has been disabled');
			}
		}
	if (item == 'boardcolor'){
		temp23 = '';
		var index;
		for (index = 0; index < colors.length; ++index) {
			if (capitaliseFirstLetter(colors[index]) == command){
				temp23 = '1';
				colors.splice(index, 1);
				break;
			}
		}
		if (temp23 != '1') colors.push(unCapitaliseFirstLetter(command));
		document.getElementById('bc'+command).style.backgroundImage = "url('img/"+command+temp23+".png')";
	}
	if (item == 'replayarrows'){
		if (command == 0){
			showReplayArrows = 0;
			displayOutput('設定を変更しました: ルート表示 オフ');
		}
		else {
			showReplayArrows = 1;
			displayOutput('設定を変更しました: ルート表示 オン');
		}
		var arrowBtn = document.getElementById('arrowToggleBtn');
		if (arrowBtn) arrowBtn.classList.toggle('modebutton-active', showReplayArrows == 1);
	}
	if (item == 'showComboItems'){
		if (command == 0){
			showComboItems = false;
			displayOutput('設定を変更しました: コンボ結果をアイコンで表示');
		}
		else {
			showComboItems = true;
			displayOutput('設定を変更しました: コンボ結果をテキストで表示');
		}
	}
	if (item == 'randomizeMatchedOrbs'){
		if (command == 0){
			randomizeMatchedOrbs = false;
			displayOutput('設定を変更しました: ランダム生成時にコンボ成立を許可しない');
		}
		else {
			randomizeMatchedOrbs = true;
			displayOutput('設定を変更しました: ランダム生成時にコンボ成立を許可する');
		}
	}
	if (item == 'shuffleInstead'){
		if (command == 0){
			shuffleInstead = false;
			document.getElementById('random').innerHTML = 'Random';
			displayOutput('設定を変更しました: ランダム生成を使う');
		}
		else {
			shuffleInstead = true;
			document.getElementById('random').innerHTML = 'Shuffle';
			displayOutput('設定を変更しました: シャッフルを使う');
		}
	}
	if (item == 'minimumCombo'){
		minimumMatches = command;
		displayOutput('設定を変更しました: 最低'+(parseInt(command)+1)+'個そろうと消えます。<br />※共有リンクにはこの設定は含まれません');
	}
	if (item == 'mode'){
		appMode = command;
		document.getElementById('modePlayBtn').classList.toggle('modebutton-active', appMode == 'play');
		document.getElementById('modeEditBtn').classList.toggle('modebutton-active', appMode == 'edit');
		document.body.classList.toggle('edit-mode', appMode == 'edit');
		if (appMode == 'edit') {
			toggle('draggable', 0);
			displayOutput('Editモード: パレットで色を選び、盤面のマスをタップすると塗り替えられます<br />', 0);
		}
		else {
			selectedPaintColor = null;
			updatePaletteSelection();
			toggle('draggable', 1);
			displayOutput('Playモードに切り替えました<br />', 0);
		}
	}

}

function updatePaletteSelection(){
	$('.paletteSwatch').removeClass('selected');
	if (selectedPaintColor) $('.paletteSwatch.' + selectedPaintColor).addClass('selected');
}

function paintTile(tileEl){
	if (appMode != 'edit' || !selectedPaintColor) return;
	var idx = Array.prototype.indexOf.call(divs, tileEl);
	if (idx == -1) return;
	if (divs[idx].getAttribute('tileColor') == selectedPaintColor) return;
	setTileAttribute(idx, selectedPaintColor, 1);
	saveBoardState();
}

function setTileAttribute(i, tileColor, opacity, classless){
	if (classless!=1) divs[i].setAttribute('class', 'tile '+tileColor);
	divs[i].setAttribute('tileColor', tileColor);
	divs[i].setAttribute('style', 'opacity:'+opacity);
}

function randomizeBoard(){
	for(var i = 0; i < rows*cols; i++){
		setTileAttribute(i, randomColor(), 1);
	}
	getTiles();
	var matchedOrbs = getMatches();
	if (matchedOrbs != false && randomizeMatchedOrbs == false) randomizeBoard();
}

function saveBoardState(){
	for(var i = 0; i < divs.length; i++){
		savedBoardState[i] = divs[i].getAttribute('tileColor');
	}
}

function loadBoardState(loadThis){
	for(var i = 0; i < divs.length; i++){
		setTileAttribute(i, loadThis[i], 1);
	}
	getTiles();
}

function opacify(){
	for(var i = 0; i < divs.length; i++){
		divs[i].setAttribute('style', 'opacity:1');
	}
}

function applyPattern(){
	var input = document.getElementById("entry").value;
	input = input.replace(new RegExp('\r?\n','g'), '');
	if (input.length != rows*cols) return false;
	var tileColor;
	for(var i = 0; i < rows*cols; i++){
		tileColor = toColor(input[i]);
		if (tileColor == 0) return false;
    }
	for(var i = 0; i < rows*cols; i++){
		tileColor = toColor(input[i]);
		setTileAttribute(i, tileColor, 1);
	}
	return true;
}

function copyPattern(modifier){
	var tilePattern = '';
	for(var i = 0; i < rows*cols; i++){
		if (toLetter(divs[i].getAttribute('tileColor')) == 0) return false;
		tilePattern += toLetter(divs[i].getAttribute('tileColor')).toUpperCase();
	}
	document.getElementById("entry").value = tilePattern;
	var base = location.origin + location.pathname;
	var sizeParam = (rows!=6 || cols!=5) ? ('height='+cols+'&width='+rows+'&') : '';
	var link = base + '?' + sizeParam + 'patt=' + tilePattern;
	displayOutput("<a href='"+link+"'>Pattern Link</a><br />", modifier);
	if (replayMoveSet.length > 0) {
		var replayLink = link + '&replay=' + replayMoveSet.join('|');
		displayOutput("<a href='"+replayLink+"'>Pattern with Replay Link</a>", 1);
		displayOutput("<br /><a href='"+replayLink+"&drops=1'>Pattern with Replay with Drops Link</a>", 1);
	}
}

function darkenOrbs (matchedOrbs){
	var comboPositionSplit = matchedOrbs[0];
	for(var i = 0; i < comboPositionSplit.length; i++){
		setTileAttribute(comboPositionSplit[i], 'black', 0, 1);
	}
	matchedOrbs.shift();
	timeOut.push(setTimeout(function () {
		if (matchedOrbs.length > 0) darkenOrbs (matchedOrbs);
		else requestAction('boardmatched');
	}, dropSpeed));
}

function changeTheWorld(){
	changeTheWorldOn = 1;
	if (freeToPlay != 1){
		start();
		ctwTimeOut.push(setTimeout(function(){
			if (changeTheWorldOn == 1){
				replayMoveSet=[];
				$(document).trigger("mouseup");
				swapHasHappened = 1;
				changeTheWorldOn = 0;
				requestAction('solve', 1);
			}
		},10000));
	}
}

function checkField(){
	for(var f = 0; f < rows; f++){
		var comboCount = 0;
		for(var i = 0+f; i < rows*cols; i=i+rows){
			if (divs[rows*cols-1-i].getAttribute("tileColor") == 'black') comboCount++;
			else if (comboCount > 0) {
				return true;
			}
		}
	}
	return false;
}

function dropField(){
	for(var f = 0; f < rows; f++){
		for(var i = 0+f; i < rows*cols; i=i+rows){
			if (i < rows*(cols-1)) {
				if (divs[rows*cols-1-i].getAttribute("tileColor") == 'black'){
					($(divs[rows*cols-1-i])).swap($(divs[rows*cols-1-i-rows]));
				}
			}
			else {
				if (divs[rows*cols-1-i].getAttribute("tileColor") == 'black'){
					if (skyFall == 1) setTileAttribute(rows*cols-1-i, randomColor(), 1);
				}
			}
		}
	}
	if (checkField()) timeOut.push(setTimeout(function () { dropField(); }, 100));
	else requestAction('fielddropped');
}

function showDrops() {
	$("#showDrops").hide();
	timeOut.push(setTimeout(function () {
		swapHasHappened = 1;
		clearMemory('arrows');
		opacify();
		requestAction('solve', 1);
	}, dropSpeed));
}

var replayMoveSet=[];
function playReplay(solution){
	if (replayMoveSet.length == 0 || changeTheWorldOn == 1){ return; }
	requestAction('loadboard');
	toggle('draggable', 0);
	var ctx = document.getElementById("arrowSurface").getContext("2d");
	var points = movePathPoints(replayMoveSet);
	($(divs[replayMoveSet[0]])).css({ opacity:0.4 });
	var i=1;
	function playReplayLoopF () {
		timeOut.push(setTimeout(function () {
			if (showReplayArrows == 1) {
				clearMemory('arrows');
				drawSmoothPath(ctx, points.slice(0, i+1));
				drawRouteDot(ctx, points[0].x, points[0].y, 8, '#fff');
				drawRouteDot(ctx, points[i].x, points[i].y, 9, '#cf0');
			}
			($(divs[replayMoveSet[i-1]])).swap($(divs[replayMoveSet[i]]));
			i++;
			if (i < replayMoveSet.length) playReplayLoopF();
			else {
				if (solution == 2){
					showDrops();
				}
				else {
					$("#showDrops").show();
				}
			}
		}, dropSpeed));
	}
	playReplayLoopF ();
}

function sortMatchesByClearOrder(solutions){
	// Matches the original game's clear order: lower on the board first,
	// then the leftmost among matches at the same height.
	function bottomOf(track){
		var maxY = -1;
		for (var i=0;i<track.length;i++){
			var y = convertXY(track[i], 'y');
			if (y > maxY) maxY = y;
		}
		return maxY;
	}
	function leftOf(track){
		var minX = rows;
		for (var i=0;i<track.length;i++){
			var x = convertXY(track[i], 'x');
			if (x < minX) minX = x;
		}
		return minX;
	}
	solutions.sort(function(a, b){
		var bottomDiff = bottomOf(b) - bottomOf(a);
		if (bottomDiff != 0) return bottomDiff;
		return leftOf(a) - leftOf(b);
	});
}

function getMatches(){
	var comboPositionList = [];
	var comboColor = '', comboPosition = [];
	for(var f = 0; f < cols; f++){
		comboColor = ''; comboPosition = [];
		for(var i = f*rows; i < f*rows+rows; i++){
			if (divs[i].getAttribute("tileColor") != comboColor){
				if (comboPosition.length > minimumMatched){
					comboPositionList = comboPositionList.concat(comboPosition);
				}
				comboColor = divs[i].getAttribute("tileColor");
				comboPosition.length = 0;
			}
			comboPosition.push(i);
			if (comboPosition.length > minimumMatched && i == f*rows+rows-1){
				comboPositionList = comboPositionList.concat(comboPosition);
			}
		}
	}
	for(var f = 0; f < rows; f++){
		comboColor = ''; comboPosition = [];
		for(var i = 0+f; i < rows*cols; i=i+rows){
			if (divs[i].getAttribute("tileColor") != comboColor){
				if (comboPosition.length > minimumMatched){
					comboPositionList = comboPositionList.concat(comboPosition);
				}
				comboColor = divs[i].getAttribute("tileColor");
				comboPosition.length = 0;
			}
			comboPosition.push(i);
			if (comboPosition.length > minimumMatched && i > rows*(cols-1)-1){
				comboPositionList = comboPositionList.concat(comboPosition);
			}
		}
	}
	if (comboPositionList.length == 0) return false;
	comboPositionList = toObject(comboPositionList);
	var comboTracker = jQuery.extend({},inverObject(comboPositionList));
	var stack = [], solutions = [], track = [];
	for (var i=0;i<Object.size(comboPositionList);i++){ track = [];
		if (typeof comboTracker[comboPositionList[i]] === "undefined") continue;
		comboColor = divs[comboPositionList[i]].getAttribute('tileColor');
		if (comboColor == 'black') continue;
		floodFill.apply(null, convertXY(comboPositionList[i]));
		if(track.length > minimumMatches)
			solutions.push(track);
	}
	sortMatchesByClearOrder(solutions);
	return solutions;
	function floodFill(x, y){
		fillPosition (x, y);
		while(stack.length>0){
			var toFill = stack.pop();
			fillPosition(toFill[0], toFill[1]);
		}
	}
	function fillPosition (x, y){
		if(!alreadyFilled(x, y)) {
			delete comboTracker[convertPosition(x, y)];
			track.push(convertPosition(x, y));
		}
		if(!alreadyFilled(x, y-1)) stack.push([x, y-1]);
		if(!alreadyFilled(x+1, y)) stack.push([x+1, y]);
		if(!alreadyFilled(x, y+1)) stack.push([x, y+1]);
		if(!alreadyFilled(x-1, y)) stack.push([x-1, y]);
	}
	function alreadyFilled(x, y){
		if (x<0 || y<0 || x>rows-1 || y>cols-1) return true;
		if (typeof comboTracker[convertPosition(x, y)] === "undefined") return true;
		if (divs[convertPosition(x, y)].getAttribute('tileColor') != comboColor) return true;
	return false;
	}
}

function calculateOutput(item){
	var temp;

	if (item == 'score'){
		var totalCombo = 0;
		var comboText = '';
		for (i = 0; i<colors2.length;i++){
			if (typeof scoreTracker[colors2[i]] === "undefined") continue;
			for (g = 0;g<scoreTracker[colors2[i]].length;g++){
                if(showComboItems) {
                    comboText += "<div class='comboInfoBox'>" +
                        "<span>" + scoreTracker[colors2[i]][g]+" x </span> " +
                        "<img width='32px' src='img/" + capitaliseFirstLetter(colors2[i]) + ".png'>" +
                        "</div>";
                } else {
                    comboText += scoreTracker[colors2[i]][g]+" x "+colors2[i]+'<br />';
                }

				totalCombo++;
			}
		}
		var poisonText = '';
		var numberOfMoves = '';
		var poisonAmount = 0;
		for (var i=0;i<scoreTracker['poison'].length;i++){
			poisonAmount += 20+(scoreTracker['poison'][i]-3)*5;
		}
		if (scoreTracker['poison'].length>0) poisonText = poisonAmount+'% life lost due to poison';
		if (replayMoveSet.length > 0) numberOfMoves = 'Number of moves: '+(replayMoveSet.length-1);
		var timeText = '';
		if (measureOn && lastMeasuredTime !== null) {
			timeText = 'Time: ' + (lastMeasuredTime/1000).toFixed(2) + 's<br />';
			lastMeasuredTime = null;
		}
		displayOutput('<div style="float:left">'+comboText+'</div><div style="float:left;margin-left:20px">'+timeText+'Total Combo: '+totalCombo+'<br />'+numberOfMoves+'<br />'+poisonText+'</div>', 0);
	}
}

function drawRouteDot(ctx, x, y, radius, fillStyle){
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI*2);
	ctx.fillStyle = fillStyle;
	ctx.fill();
	ctx.lineWidth = 2;
	ctx.strokeStyle = '#000';
	ctx.stroke();
}

function pointDistance(a, b){
	var dx = a.x-b.x, dy = a.y-b.y;
	return Math.sqrt(dx*dx + dy*dy);
}

function pointTowards(from, to, distance){
	var dx = to.x-from.x, dy = to.y-from.y;
	var len = pointDistance(from, to) || 1;
	var t = Math.min(distance/len, 1);
	return { x: from.x + dx*t, y: from.y + dy*t };
}

function movePathPoints(moveSet){
	return moveSet.map(function(pos){
		return { x: convertXY(pos, 'x')*scale+scale/2, y: convertXY(pos, 'y')*scale+scale/2 };
	});
}

// Draws one continuous path through the given points: straight runs stay
// straight (no visible joint between collinear segments), and direction
// changes are rounded into a smooth curve instead of a sharp corner.
function drawSmoothPath(ctx, points){
	if (points.length < 2) return;
	var cornerRadius = scale * 0.3;
	function tracePath(){
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		for (var i=1; i<points.length-1; i++){
			var prev = points[i-1], cur = points[i], next = points[i+1];
			var r1 = Math.min(cornerRadius, pointDistance(prev, cur)/2);
			var r2 = Math.min(cornerRadius, pointDistance(cur, next)/2);
			var a = pointTowards(cur, prev, r1);
			var b = pointTowards(cur, next, r2);
			ctx.lineTo(a.x, a.y);
			ctx.quadraticCurveTo(cur.x, cur.y, b.x, b.y);
		}
		ctx.lineTo(points[points.length-1].x, points[points.length-1].y);
	}
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	tracePath();
	ctx.lineWidth = 6;
	ctx.strokeStyle = 'rgba(0,0,0,0.55)';
	ctx.stroke();
	tracePath();
	ctx.lineWidth = 2.5;
	ctx.strokeStyle = '#fff';
	ctx.stroke();
}

// Draws the swap path just travelled: a smooth line through the tile
// centres, a hollow dot at the start, a filled dot at the end.
function drawMoveRoute(){
	if (replayMoveSet.length < 2) return;
	var ctx = document.getElementById('arrowSurface').getContext('2d');
	var points = movePathPoints(replayMoveSet);
	drawSmoothPath(ctx, points);
	drawRouteDot(ctx, points[0].x, points[0].y, 8, '#fff');
	drawRouteDot(ctx, points[points.length-1].x, points[points.length-1].y, 9, '#cf0');
}

function solveBoard(solvePortion){
	if (solvePortion == 1){
		getTiles();											// get board positions
		var matchedOrbs = getMatches();
		if (matchedOrbs != false){							// find matches
			trackScore(matchedOrbs);						// track score
			darkenOrbs(matchedOrbs);						// clear matches
		}
		else {
				if (showReplayArrows == 1) drawMoveRoute();
				calculateOutput('score');
				swapHasHappened = 0;
				clearMemory('timeout');
			if (skyFall == 1) toggle('draggable', 1);
		}
	}
	if (solvePortion == 2) {
		timeOut.push(setTimeout(function () { requestAction('solve'); }, dropSpeed));
	}
}

function changeTimer (modifier){
	if (modifier == 0) {
		if (timerTime > 0) timerTime = timerTime - 500;
	}
	else timerTime = timerTime + 500;
	reset();
}

String.prototype.shuffle = function () {
    var a = this.split(""),
        n = a.length;

    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}

function shuffleBoard() {
	shuffledBoard = document.getElementById("entry").value.shuffle();
	document.getElementById("entry").value=shuffledBoard;
	requestAction('applypattern', 2);
}

function debounce(fn, wait){
	var t;
	return function(){
		clearTimeout(t);
		t = setTimeout(fn, wait);
	};
}

// Recomputes the pixel tile size (`scale`) from the board's actual rendered
// width so the whole layout fits narrow (phone) viewports without the user
// having to pinch-zoom. Everything else (drag math, canvas arrows, corner
// blocks) already reads from `scale`, so keeping it in sync with the real
// rendered size is enough to make the whole board responsive.
function applyResponsiveLayout(){
	var boardEl = document.getElementById('board');
	if (!boardEl || divs.length == 0) return;
	boardEl.style.aspectRatio = rows + ' / ' + cols;
	var measuredWidth = boardEl.clientWidth;
	if (!measuredWidth) return;
	var newScale = Math.floor(measuredWidth / rows);
	if (newScale < 1 || newScale == scale) return;
	scale = newScale;
	boardEl.style.setProperty('--tile-size', scale + 'px');
	var canvas = document.getElementById('arrowSurface');
	canvas.width = scale * rows;
	canvas.height = scale * cols;
	canvas.style.width = (scale * rows) + 'px';
	canvas.style.height = (scale * cols) + 'px';
	$('.cornerblock').remove();
	for (var i2 = 1; i2 < rows; i2++) {
		for (var h2 = 1; h2 < cols; h2++) {
		  $( "#board" ).append( "<div class='cornerblock' style='left:"+((scale*i2)-(cornerspace/2))+"px;top:"+((scale*h2)-(cornerspace/2))+"px'></div>" );
		}
	}
}

// ---- My Boards (localStorage library) ----

function loadLibrary(){
	try {
		return JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
	} catch (e) {
		return [];
	}
}

function saveLibrary(list){
	localStorage.setItem(LIBRARY_KEY, JSON.stringify(list));
}

function savePatternToLibrary(){
	var pattern = '';
	for (var i=0;i<rows*cols;i++){
		if (toLetter(divs[i].getAttribute('tileColor')) == 0) {
			displayOutput('Cannot save: invalid board<br />', 0);
			return;
		}
		pattern += toLetter(divs[i].getAttribute('tileColor')).toUpperCase();
	}
	var list = loadLibrary();
	var name = prompt('Board name:', 'Board ' + (list.length + 1));
	if (name === null) return;
	if (name.trim() == '') name = 'Untitled';
	list.push({ name: name, pattern: pattern, rows: rows, cols: cols, replay: replayMoveSet.slice(), saved: Date.now() });
	saveLibrary(list);
	renderLibrary();
	displayOutput('Saved "' + escapeHtml(name) + '" to My Boards<br />', 0);
}

function renderLibrary(){
	var container = document.getElementById('libraryList');
	if (!container) return;
	var list = loadLibrary();
	if (list.length == 0) {
		container.innerHTML = '<div class="libraryEmpty">まだ保存された盤面はありません</div>';
		return;
	}
	var html = '';
	for (var i=0;i<list.length;i++){
		var item = list[i];
		var d = new Date(item.saved);
		html += '<div class="libraryItem"><div><span class="libName">' + escapeHtml(item.name) + '</span>'
			+ '<span class="libMeta">' + item.cols + 'x' + item.rows + ' / ' + d.toLocaleString() + '</span></div>'
			+ '<div class="libActions">'
			+ '<button onclick="requestAction(\'loadsaved\', ' + i + ')">Load</button>'
			+ '<button onclick="requestAction(\'deletesaved\', ' + i + ')">Delete</button>'
			+ '</div></div>';
	}
	container.innerHTML = html;
}

function loadSavedPattern(index){
	var list = loadLibrary();
	var item = list[index];
	if (!item) return;
	if (item.rows != rows || item.cols != cols){
		displayOutput('この盤面は別のサイズ(' + item.cols + 'x' + item.rows + ')で保存されています。同じサイズでページを開き直してください。<br />', 0);
		return;
	}
	document.getElementById('entry').value = item.pattern;
	replayMoveSet = item.replay ? item.replay.slice() : [];
	requestAction('applypattern', 2);
	displayOutput('Loaded "' + escapeHtml(item.name) + '"<br />', 0);
}

function deleteSavedPattern(index){
	var list = loadLibrary();
	if (!list[index]) return;
	if (!confirm('Delete "' + list[index].name + '"?')) return;
	list.splice(index, 1);
	saveLibrary(list);
	renderLibrary();
}

function requestAction(action, modifier){ // CLEAN IT UP
	if(typeof modifier === 'undefined') modifier = 0;
	if (action == 'randomize' || (action == 'applypattern' && modifier != 2)) replayMoveSet=[];
	if (action == 'randomize' || action == 'loadboard' || action == 'clearstate' || action == 'copypattern') {
		toggle('draggable', 1);
		changeTheWorldOn = 0;
		swapHasHappened = 0;
		clearMemory('timeout');
		clearMemory('ctw');
		reset();
		if (measureOn) document.getElementById('time').innerHTML = formatTime(0, 1);
		clearMemory('arrows');
		$("#showDrops").hide();
	}
	if (action == 'randomize') {
		if (colors.length < 2) displayOutput('Select a minimum of 2 colors in the options to randomize the board<br />', 0);
		else {
			if (shuffleInstead){
				shuffleBoard();
			}
			else {
				randomizeBoard();
			}
			saveBoardState();
			requestAction('copypattern');
		}
	}
	if (action == 'loadboard') loadBoardState(savedBoardState);
	if (action == 'timemode') {
		if (changeTheWorldOn == 0) toggle('timemode', modifier);
		else displayOutput('Not during Change the World<br />', 0);
		}
	if (action == 'skyfall') toggle('skyfall');
	if (action == 'changetheworld') {
		if (!toggle('draggable', 2)) {
			changeTheWorld();
			displayOutput('I want to change the world... <br />', 0);
		}
		else displayOutput('Reset the board first<br />', 0);
	}
	if (action == 'applypattern') {
		if (applyPattern()) {
			toggle('draggable', 1);
			saveBoardState();
			requestAction('copypattern' , 0);
		}
		else displayOutput('Failed to Apply<br />', 0);
	}
	if (action == 'copypattern') {
		loadBoardState(savedBoardState);
		copyPattern(modifier);
	}
	if (action == 'solve') {
		if (changeTheWorldOn == 0) reset();
		if (modifier==1) {
			clearMemory('score');
			}
		if (changeTheWorldOn == 0 && swapHasHappened) {
			toggle('draggable', 0);
			solveBoard(1);
		}
		else {
			clearMemory('timeout');
		}
		if (modifier==3) {//GET RID OF THIS
			clearMemory('arrows');
			swapHasHappened = 1;
			solveBoard(1);
		}
	}
	if (action == "convert"){
		if ((swapHasHappened == 0 || skyFall == 1) && (timeOut.length < 1)){
			var colorfrom = document.getElementById("colorfrom").value;
			var colorto = document.getElementById("colorto").value;
			if (colorfrom.length < 1 || colorto.length < 1 || colorfrom.length != colorto.length) return;
			saveBoardState();
			requestAction('copypattern');
				var inputtemp = document.getElementById("entry").value;
				inputtemp = inputtemp.replace(new RegExp('\r?\n','g'), '');
				var temp3 = inputtemp.split("");
				for (var i = 0, len = inputtemp.length; i < len; i++) {
					for (var g = 0, len2 = colorfrom.length; g < len2; g++) {
						if (capitaliseFirstLetter(inputtemp[i]) == capitaliseFirstLetter(colorfrom[g])){
							temp3[i] = capitaliseFirstLetter(colorto[g]);
							continue;
						}
					}
				}
				document.getElementById("entry").value = temp3.join("");
				requestAction('applypattern');
		}
	}
	if (action == 'boardmatched') dropField();
	if (action == 'solve2' || action == 'fielddropped') solveBoard(2);
	if (action == 'savepattern') savePatternToLibrary();
	if (action == 'loadsaved') loadSavedPattern(modifier);
	if (action == 'deletesaved') deleteSavedPattern(modifier);
	if (action == 'help') {
		var showHelp =
			['Play/Edit at the top switches modes. Gear icon leads to <a href="javascript:requestAction(\'options\')">options</a>',
			'<br /><br />In Edit mode, tap (or slide across) the palette above the board to paint tiles',
			'<br /><br />In Play mode, the panel above the board picks 制限 (countdown, +/- adjusts the length) or 計測 (stopwatch) timing. The ルート表示 button toggles whether the swap path is drawn after a move and during Replay',
			'<br /><br />CtW (change the world) allows you to move and drop orbs freely for 10 seconds (no replay)',
			'<br /><br />Use "Save Current Board" below the board to keep boards in My Boards (saved in this browser only)'
			].join('');
		displayOutput(showHelp, 0);
	}
	if (action == 'options') {
		var showHelp =
			['オプション:<br /><div class="test1"><div style="float:left;vertical-align:bottom;line-height:30px">使用するドロップ色: </div>',
			'<button onclick="requestAction(\'boardcolor\', \'Green\')" id="bcGreen" class="topbutton image7">オプション</button>',
			'<button onclick="requestAction(\'boardcolor\', \'Red\')" id="bcRed" class="topbutton image8">オプション</button>',
			'<button onclick="requestAction(\'boardcolor\', \'Blue\')" id="bcBlue" class="topbutton image9">オプション</button>',
			'<button onclick="requestAction(\'boardcolor\', \'Light\')" id="bcLight" class="topbutton image10">オプション</button>',
			'<button onclick="requestAction(\'boardcolor\', \'Dark\')" id="bcDark" class="topbutton image11">オプション</button>',
			'<button onclick="requestAction(\'boardcolor\', \'Heart\')" id="bcHeart" class="topbutton image12">オプション</button></div>',
			'<br />ランダム生成時にコンボ成立を許可: <a onclick="requestAction(\'randomizeMatchedOrbs\', \'1\');" href="#">オン</a> / <a onclick="requestAction(\'randomizeMatchedOrbs\', \'0\');" href="#">オフ</a>',
			'<br />ルート表示: <a href="#" onclick="requestAction(\'replayarrows\', \'1\');">オン</a> / <a href="#" onclick="requestAction(\'replayarrows\', \'0\');">オフ</a>',
            '<br />コンボ結果をアイコンで表示: <a onclick="requestAction(\'showComboItems\', \'1\');" href="#">オン</a> / <a onclick="requestAction(\'showComboItems\', \'0\');" href="#">オフ</a>',
            '<br />ランダムの代わりにシャッフルを使う: <a onclick="requestAction(\'shuffleInstead\', \'1\');" href="#">オン</a> / <a onclick="requestAction(\'shuffleInstead\', \'0\');" href="#">オフ</a>',
            '<br />最低何個そろったら消えるか: <a onclick="requestAction(\'minimumCombo\', \'2\');" href="#">3</a> / <a onclick="requestAction(\'minimumCombo\', \'3\');" href="#">4</a> / <a onclick="requestAction(\'minimumCombo\', \'4\');" href="#">5</a>',
            '<br /><br />※ドロップ色の設定は、スカイフォールやランダム生成で使われる色に影響します'
			].join('');
		displayOutput(showHelp, 0);
		for (index1 = 0; index1 < 2; ++index1){
			toggle('boardcolor', 'Blue');
			toggle('boardcolor', 'Green');
			toggle('boardcolor', 'Red');
			toggle('boardcolor', 'Light');
			toggle('boardcolor', 'Dark');
			toggle('boardcolor', 'Heart');
		}
	}
	if (action == 'boardcolor') toggle('boardcolor', modifier);
	if (action == 'replay') playReplay(toDrop);
	if (action == 'showdrops') showDrops();
	if (action == 'ctimer' && changeTheWorldOn == 0) {
		changeTimer(modifier);
	}
	if (action == 'replayarrows') toggle('replayarrows', modifier);
	if (action == 'showComboItems') toggle('showComboItems', modifier);
	if (action == 'randomizeMatchedOrbs') toggle('randomizeMatchedOrbs', modifier);
	if (action == 'shuffleInstead') toggle('shuffleInstead', modifier);
	if (action == 'minimumCombo') toggle('minimumCombo', modifier);
	if (action == 'setmode') toggle('mode', modifier);
	if (action == 'selectpaint') {
		selectedPaintColor = modifier;
		updatePaletteSelection();
	}

}

var	clsStopwatch = function() {
	var	startAt	= 0;
	var	lapTime	= 0;
	var	now	= function() {
		return (new Date()).getTime();
	};
	this.start = function() {
		startAt	= startAt ? startAt : now();
	};
	this.reset = function() {
		lapTime = startAt = 0;
	};
	this.time = function() {
		return lapTime + (startAt ? now() - startAt : 0);
	};
};
var x = new clsStopwatch();
var clocktimer;
function pad(num, size) {
	var s = "0000" + num;
	return s.substr(s.length - size);
}
function formatTime(time, modifier) {
	if(typeof modifier === 'undefined') modifier = 0;
	var s = ms = 0
	, newTime = ''
	, timeTop;
	time = time % (60 * 60 * 1000);
	time = time % (60 * 1000);
	s = Math.floor( time / 1000 );
	ms = time % 1000;
	if (!timerOn && !changeTheWorldOn && !measureOn) return 'Unlimited';
	if (measureOn) return pad(s, 2)+'.'+pad(ms, 3)+'s';
	if (timerOn == 1) timeTop = timerTime/1000;
	if (changeTheWorldOn == 1) timeTop = 10;
	newTime = pad(Math.floor(timeTop - .01) - s, 2)+'.' + pad(1000 + timerTime - Math.floor(timerTime/1000)*1000 - ms, 3)+'s';
	if (modifier == 1) newTime = pad(Math.floor(timeTop) - s, 2) + '.' + pad(1000 + timerTime - Math.floor(timerTime/1000)*1000 - ms, 3)+'s';
	return newTime;
}
function update() {
	document.getElementById('time').innerHTML = formatTime(x.time());
}
function start() {
	clocktimer = setInterval("update()", 1);
	x.start();
}
function reset() {
	clearInterval(clocktimer);
	x.reset();
	// In Measure mode, the readout should keep showing the time from the
	// move that just finished until the next drag starts, rather than
	// snapping back to 00.000s the instant the finger lifts.
	if (measureOn) return;
	update();
	document.getElementById('time').innerHTML = formatTime(x.time(), 1);
}


$(function(){		// CURSOR AT AND MOVING ORB SIZE

	var $_GET = {}, args = location.search.substr(1).split(/&/);
	for (var i=0; i<args.length; ++i) { // GET reader
		var tmp = args[i].split(/=/);
		if (tmp[0] != "") {
			$_GET[decodeURIComponent(tmp[0])] = decodeURIComponent(tmp.slice(1).join("").replace("+", " "));
		}
	}
	if ($_GET['width'] && $.isNumeric($_GET['width']) && 2 < $_GET['width'] && $_GET['width'] <10){
		rows = parseInt($_GET['width']);
		document.getElementById("board").style.width = rows*scale+"px";
	}
	if ($_GET['height'] && $.isNumeric($_GET['height']) && 2 < $_GET['height'] && $_GET['height'] < 10){
		cols = parseInt($_GET['height']);
		document.getElementById("board").style.height = cols*scale+"px";
	}
	if (rows!=6 || cols !=5){
		document.getElementById("entry").maxLength = cols*rows;
		document.getElementById("entry").style.width = rows*70/6+"px";
		document.getElementById("entry").style.height = cols*120/5+"px";
	}
	for(var i = 0; i < rows*cols; i++){				// create board
		var randColor = randomColor();
		divs[i] = document.createElement("div");
		setTileAttribute(i, randColor, 1);
		$('#tiles').append(divs[i]);
	}
	applyResponsiveLayout();
	$(window).on('resize orientationchange', debounce(applyResponsiveLayout, 150));
	randomizeBoard();

	saveBoardState();
	clearMemory('score');
	renderLibrary();

	if ($_GET['patt']){
		document.getElementById("entry").innerHTML=$_GET['patt'];
		if ($_GET['replay']){
			replayMoveSet=$_GET['replay'].split('|');
			for (i=0;i<replayMoveSet.length;i++){
				if (replayMoveSet[i] > rows*cols-1 || replayMoveSet[i] < 0) {
					replayMoveSet = [];
					break;
				}
			}
		}
		requestAction('applypattern', 2);
	}
	else requestAction('copypattern' , 0);
	if (replayMoveSet.length > 0) timeOut.push(setTimeout(function () { requestAction('replay'); }, 1000));
	if ($_GET['freetoplay']) freeToPlay=1;
	if ($_GET['timer']) timerTime=$_GET['timer']*1000;
	if ($_GET['drops']) toDrop = 2;
	if ($_GET['speed'] && $.isNumeric($_GET['speed'])) dropSpeed = $_GET['speed'];
	requestAction('help');

	$(function(){
		document.getElementById('time').innerHTML = formatTime(x.time());
	});

	$('#tiles').on('mousedown touchstart', '.tile', function(e){
		if (appMode != 'edit' || !selectedPaintColor) return;
		if (e.type === 'touchstart') e.preventDefault();
		painting = true;
		paintTile(this);
	});
	$(document).on('mousemove', function(e){
		if (!painting) return;
		var el = document.elementFromPoint(e.clientX, e.clientY);
		if (el) paintTile(el);
	});
	$(document).on('mouseup touchend touchcancel', function(){
		painting = false;
	});
	document.addEventListener('touchmove', function(e){
		if (!painting) return;
		e.preventDefault();
		var touch = e.touches[0];
		var el = document.elementFromPoint(touch.clientX, touch.clientY);
		if (el) paintTile(el);
	}, { passive: false });

	$( ".tile" ).draggable({
		refreshPositions:"true",
		containment: "#board",
		helper: "clone",
		opacity: 0.8,
		start:function( event, ui ){
			$(this).css({ opacity:0.2 });
			clearMemory('arrows');
			replayMoveSet=[];
			if (changeTheWorldOn ==0 && timerOn == 1) {
				timeOut.push(setTimeout(function(){ $(document).trigger("mouseup"); },timerTime));
				start();
			}
			else if (changeTheWorldOn == 0 && measureOn == 1) {
				start();
			}
		},
		stop:function( event, ui ){
			$(this).css({ opacity:1 });
			if (changeTheWorldOn == 0 && measureOn == 1) {
				lastMeasuredTime = x.time();
			}
			requestAction('solve', 1);
		},
		cursorAt: { top: scale/2, left: scale/2 }
	});
	$( ".tile" ).droppable({
		accept: ".tile",
		over: function( event, ui ){
			var draggable = ui.draggable, droppable = $(this);
			if (skyFall == 1 && swapHasHappened == 0) saveBoardState();
			draggable.swap(droppable, 2);
			swapHasHappened = 1;
		}
	});
	$( ".cornerblock" ).droppable({
		tolerance: "pointer",
		over: function( event, ui ) {
			var cornerblockcount = 0;
			$( ".tile" ).each(function() {
				if (cornerblockcount++<30) $(this).droppable('option', 'disabled', true);
			});
		},
		out: function( event, ui ) {
			var cornerblockcount = 0;
			$( ".tile" ).each(function() {
				if (cornerblockcount++<30) $(this).droppable('option', 'disabled', false);
			});
		}
	});
	$("#entry").bind({
		keydown: function(e) {
			if (e.which==13) requestAction('applypattern');
			if (e.which==82||e.which==71||e.which==66||e.which==76||e.which==68||e.which==72||e.which==80||e.which==74||e.which==46||e.which==8||e.which==37||e.which==38||e.which==39||e.which==40||(e.ctrlKey && (e.which == 65 || e.which == 86 || e.which == 67))) return true;
			return false;
		}
	});
	$("#colorfrom").bind({
		keydown: function(e) {
			if (e.which==13) requestAction('convert');
			if (e.which==82||e.which==71||e.which==66||e.which==76||e.which==68||e.which==72||e.which==80||e.which==74||e.which==46||e.which==8||e.which==37||e.which==38||e.which==39||e.which==40||(e.ctrlKey && (e.which == 65 || e.which == 86 || e.which == 67))) return true;
			return false;
		}
	});
	$("#colorto").bind({
		keydown: function(e) {
			if (e.which==13) requestAction('convert');
			if (e.which==82||e.which==71||e.which==66||e.which==76||e.which==68||e.which==72||e.which==80||e.which==74||e.which==46||e.which==8||e.which==37||e.which==38||e.which==39||e.which==40||(e.ctrlKey && (e.which == 65 || e.which == 86 || e.which == 67))) return true;
			return false;
		}
	});
});

$(document).ready(function(){ // HOVER TEXT HACK
  $('input[type=text][title],input[type=password][title],textarea[title]').each(function(i){
    $(this).addClass('input-prompt-' + i);
    var promptSpan = $('<span class="input-prompt"/>');
    $(promptSpan).attr('id', 'input-prompt-' + i);
    $(promptSpan).append($(this).attr('title'));
    $(promptSpan).click(function(){
      $(this).hide();
      $('.' + $(this).attr('id')).focus();
    });
    if($(this).val() != ''){
      $(promptSpan).hide();
    }
    $(this).after(promptSpan);
    $(this).focus(function(){
      $('#input-prompt-' + i).hide();
    });
    $(this).blur(function(){
      if($(this).val() == ''){
        $('#input-prompt-' + i).show();
      }
    });
  });
});
