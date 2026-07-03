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
	, lastMeasuredTime = null
	, playStyle = 'single'
	, genSelected = { red: true, blue: true, green: true, light: true, dark: true, heart: true };

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
		if (command==1 && appMode != 'play') command = 0; // Edit/解析モードでは常にドラッグ無効
		if (command==1) setTimeout(function(){ $( ".tile" ).draggable( "option", "disabled", false ); }, 5);
		else setTimeout(function(){ $( ".tile" ).draggable( "option", "disabled", true ); }, 5);
	}
	if (item == 'skyfall'){
		if (skyFall == 0) {
			skyFall = 1;
			displayOutput('落ちコンあり: 消えた場所に上から新しいドロップが降ってきます(リプレイには落ちてきたドロップは保存されません)<br />', 0);
			}
		else {
			skyFall = 0;
			displayOutput('落ちコンなしに切り替えました<br />', 0);
			}
		document.getElementById('skyfallBtn').classList.toggle('toggled-on', skyFall == 1);
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
		document.getElementById('modeAnalyzeBtn').classList.toggle('modebutton-active', appMode == 'analyze');
		document.body.classList.toggle('edit-mode', appMode == 'edit');
		document.body.classList.toggle('analyze-mode', appMode == 'analyze');
		if (appMode == 'edit') {
			toggle('draggable', 0);
			displayOutput('Editモード: パレットで色を選び、盤面のマスをタップすると塗り替えられます<br />', 0);
		}
		else if (appMode == 'analyze') {
			toggle('draggable', 0);
			displayOutput('解析モード: 「解析開始」を押すと、現在の盤面で最大コンボを組める最短ルートを探索します<br />', 0);
		}
		else {
			selectedPaintColor = null;
			updatePaletteSelection();
			toggle('draggable', 1);
			displayOutput('Playモードに切り替えました<br />', 0);
		}
	}

}

function updateOrbCountBar(){
	if (!document.getElementById('orbCountBar') || divs.length == 0) return;
	var counts = {};
	for (var i = 0; i < divs.length; i++){
		var c = divs[i].getAttribute('tileColor');
		counts[c] = (counts[c] || 0) + 1;
	}
	for (var k = 0; k < colors2.length; k++){
		var el = document.getElementById('orbCount-' + colors2[k]);
		if (el) el.textContent = counts[colors2[k]] || 0;
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

var totalFallSpeed = 300;

// How many gravity passes the farthest-falling tile needs: for each
// column, the number of black (cleared) cells below a tile is exactly
// how many rows that tile has left to fall.
function calculateMaxFallPasses(){
	var maxPasses = 0;
	for (var f = 0; f < rows; f++){
		var blackBelow = 0;
		for (var y = cols-1; y >= 0; y--){
			var color = divs[y*rows+f].getAttribute('tileColor');
			if (color == 'black') blackBelow++;
			else if (blackBelow > maxPasses) maxPasses = blackBelow;
		}
	}
	return maxPasses;
}

// Animates an element sliding into its new position using the FLIP
// technique: since tiles are float-positioned (their on-screen spot is
// implied by DOM order, not by top/left), a plain CSS transition on
// position doesn't work. Instead we measure how far the element jumped,
// counter it with an instant transform, then transition that transform
// back to zero so the jump reads as a smooth slide.
function animateFallStep(el, fromTop, stepDuration){
	var toTop = el.getBoundingClientRect().top;
	var delta = fromTop - toTop;
	if (delta == 0) return;
	el.style.transition = 'none';
	el.style.transform = 'translateY(' + delta + 'px)';
	void el.offsetWidth; // force reflow so the jump above isn't merged with the transition below
	el.style.transition = 'transform ' + stepDuration + 'ms linear';
	el.style.transform = '';
	setTimeout(function(){
		el.style.transition = '';
		el.style.transform = '';
	}, stepDuration);
}

// The whole fall (however many rows it spans) always takes totalFallSpeed
// (0.3s): the per-pass step duration is that total divided across however
// many gravity passes the farthest tile needs, so a 1-row and a 5-row
// drop both finish at the same time instead of the fall taking longer
// the further tiles have to travel.
function dropField(stepDuration){
	if (stepDuration === undefined) {
		var maxPasses = calculateMaxFallPasses();
		stepDuration = maxPasses > 0 ? totalFallSpeed / maxPasses : totalFallSpeed;
	}
	var falling = Array.prototype.filter.call(divs, function(el){ return el.getAttribute('tileColor') != 'black'; });
	var beforeTops = falling.map(function(el){ return el.getBoundingClientRect().top; });
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
	falling.forEach(function(el, idx){ animateFallStep(el, beforeTops[idx], stepDuration); });
	if (checkField()) timeOut.push(setTimeout(function () { dropField(stepDuration); }, stepDuration));
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
	var points = buildOffsetPathPoints(replayMoveSet);
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
				// After the route finishes, always play out how the drops
				// clear instead of waiting for a Show Drops click.
				showDrops();
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
		var clearedText = '';
		for (i = 0; i<colors2.length;i++){
			if (typeof scoreTracker[colors2[i]] === "undefined") continue;
			for (g = 0;g<scoreTracker[colors2[i]].length;g++){
				if (showComboItems) {
					clearedText += "<span class='clearedItem'><img width='22px' src='img/" + capitaliseFirstLetter(colors2[i]) + ".png'>×" + scoreTracker[colors2[i]][g] + "</span>";
				} else {
					clearedText += colors2[i] + '×' + scoreTracker[colors2[i]][g] + ' ';
				}
				totalCombo++;
			}
		}
		var poisonText = '';
		var poisonAmount = 0;
		for (var i=0;i<scoreTracker['poison'].length;i++){
			poisonAmount += 20+(scoreTracker['poison'][i]-3)*5;
		}
		if (scoreTracker['poison'].length>0) poisonText = '<br />毒によるダメージ: '+poisonAmount+'%';
		var movesText = replayMoveSet.length > 0 ? ' ' + (replayMoveSet.length-1) + '手' : '';
		var timeText = '';
		if (lastMeasuredTime !== null) {
			timeText = ' 操作時間' + (lastMeasuredTime/1000).toFixed(2) + '秒';
			lastMeasuredTime = null;
		}
		var remaining = 0;
		for (var r2 = 0; r2 < divs.length; r2++){
			if (divs[r2].getAttribute('tileColor') != 'black') remaining++;
		}
		var boardMax = maxPossibleCombosFromCounts(savedBoardState);
		displayOutput('<b>' + totalCombo + 'コンボ</b>' + movesText + timeText
			+ ' 盤面最大' + boardMax + 'コンボ 残' + remaining + '個<br />'
			+ clearedText + poisonText, 0);
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

// Like movePathPoints, but when the route crosses the same edge between
// two cells more than once, later traversals are shifted sideways into
// parallel "lanes" (like train tracks) so overlapping parts of the line
// stay distinguishable. The perpendicular is taken relative to the
// edge's canonical direction, so traversals in opposite directions
// share the same lane geometry. Each waypoint is placed at the average
// of its two adjacent segments' offsets, which the smooth-path renderer
// then rounds into gentle transitions.
function buildOffsetPathPoints(moveSet){
	var pts = movePathPoints(moveSet);
	if (pts.length < 2) return pts;
	var laneGap = Math.max(6, scale * 0.14);
	var edgeCounts = {};
	var segOffsets = [];
	for (var i = 1; i < moveSet.length; i++){
		var lo = Math.min(moveSet[i-1], moveSet[i]);
		var hi = Math.max(moveSet[i-1], moveSet[i]);
		var key = lo + '_' + hi;
		var k = edgeCounts[key] || 0;
		edgeCounts[key] = k + 1;
		var lane = (k === 0) ? 0 : Math.ceil(k/2) * ((k % 2 === 1) ? 1 : -1);
		var dx = (hi % rows) - (lo % rows);
		var dy = Math.floor(hi / rows) - Math.floor(lo / rows);
		segOffsets.push({ x: -dy * lane * laneGap, y: dx * lane * laneGap });
	}
	var out = [];
	for (var p = 0; p < pts.length; p++){
		var offA = segOffsets[Math.max(0, p - 1)];
		var offB = segOffsets[Math.min(segOffsets.length - 1, p)];
		out.push({ x: pts[p].x + (offA.x + offB.x)/2, y: pts[p].y + (offA.y + offB.y)/2 });
	}
	return out;
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
	var points = buildOffsetPathPoints(replayMoveSet);
	drawSmoothPath(ctx, points);
	drawRouteDot(ctx, points[0].x, points[0].y, 8, '#fff');
	drawRouteDot(ctx, points[points.length-1].x, points[points.length-1].y, 9, '#cf0');
}

// ---- 解析モード (max-combo route solver) ----
//
// Beam search over cursor paths: a state is (board, cursor position,
// path so far); each step slides the cursor to an orthogonal neighbour,
// swapping the two orbs, exactly like a real move. Boards are scored by
// full cascade simulation (no skyfall), so the reported combo count is
// what the move would actually score.

var analysisSolutions = [];
var analysisRunning = false;
var analysisLevel = 'fast';
// Deeper levels search longer routes with a wider beam; the search is
// chunked per depth so the page stays responsive even at 50 moves.
var ANALYSIS_LEVELS = {
	fast:   { depth: 25, beam: 200 },
	normal: { depth: 35, beam: 300 },
	deep:   { depth: 50, beam: 400 }
};

function boardArrayFromDivs(){
	var b = [];
	for (var i = 0; i < rows*cols; i++) b.push(divs[i].getAttribute('tileColor'));
	return b;
}

function markRunsArr(b, marked){
	var minRun = minimumMatched + 1;
	var x, y, c, len, k;
	for (y = 0; y < cols; y++){
		x = 0;
		while (x < rows){
			c = b[y*rows + x];
			len = 1;
			while (x + len < rows && c && b[y*rows + x + len] === c) len++;
			if (c && c !== 'black' && len >= minRun) for (k = 0; k < len; k++) marked[y*rows + x + k] = true;
			x += len;
		}
	}
	for (x = 0; x < rows; x++){
		y = 0;
		while (y < cols){
			c = b[y*rows + x];
			len = 1;
			while (y + len < cols && c && b[(y+len)*rows + x] === c) len++;
			if (c && c !== 'black' && len >= minRun) for (k = 0; k < len; k++) marked[(y+k)*rows + x] = true;
			y += len;
		}
	}
}

// Counts combos on a board copy, fully cascading falls (without skyfall,
// so the result is deterministic). Mirrors getMatches' rules: runs of 3+
// in a line, flood-filled into groups, group size over minimumMatches.
function simulateCascade(b){
	var combos = 0;
	while (true){
		var marked = {};
		markRunsArr(b, marked);
		var cells = Object.keys(marked);
		if (!cells.length) break;
		var visited = {};
		var groups = [];
		for (var ci = 0; ci < cells.length; ci++){
			var startPos = parseInt(cells[ci]);
			if (visited[startPos]) continue;
			var color = b[startPos];
			var stack = [startPos], group = [];
			visited[startPos] = true;
			while (stack.length){
				var p = stack.pop();
				group.push(p);
				var px = p % rows, py = (p - px) / rows;
				var neigh = [];
				if (px > 0) neigh.push(p-1);
				if (px < rows-1) neigh.push(p+1);
				if (py > 0) neigh.push(p-rows);
				if (py < cols-1) neigh.push(p+rows);
				for (var n = 0; n < neigh.length; n++){
					var q = neigh[n];
					if (!visited[q] && marked[q] && b[q] === color){ visited[q] = true; stack.push(q); }
				}
			}
			if (group.length > minimumMatches) groups.push(group);
		}
		if (!groups.length) break;
		combos += groups.length;
		for (var g = 0; g < groups.length; g++)
			for (var m = 0; m < groups[g].length; m++) b[groups[g][m]] = null;
		for (var gx = 0; gx < rows; gx++){
			var write = cols - 1;
			for (var gy = cols - 1; gy >= 0; gy--){
				var v = b[gy*rows + gx];
				if (v !== null){ b[write*rows + gx] = v; write--; }
			}
			for (; write >= 0; write--) b[write*rows + gx] = null;
		}
	}
	return combos;
}

// Cheap tiebreaker that nudges the beam toward boards with same-color
// orbs adjacent to each other (i.e. combos in the making).
function countAdjacentPairs(b){
	var pairs = 0;
	for (var i = 0; i < rows*cols; i++){
		var c = b[i];
		if (!c || c === 'black') continue;
		var px = i % rows, py = (i - px) / rows;
		if (px < rows-1 && b[i+1] === c) pairs++;
		if (py < cols-1 && b[i+rows] === c) pairs++;
	}
	return pairs;
}

function maxPossibleCombosFromCounts(b){
	var counts = {}, total = 0, need = minimumMatches + 1;
	for (var i = 0; i < b.length; i++){
		if (!b[i] || b[i] === 'black') continue;
		counts[b[i]] = (counts[b[i]] || 0) + 1;
	}
	for (var k in counts) total += Math.floor(counts[k] / need);
	return total;
}

function setAnalyzeStatus(text){
	var el = document.getElementById('analyzeStatus');
	if (el) el.textContent = text;
}

function runAnalysis(){
	if (analysisRunning) return;
	analysisRunning = true;
	saveBoardState();
	clearMemory('arrows');
	var base = boardArrayFromDivs();
	var levelParams = ANALYSIS_LEVELS[analysisLevel] || ANALYSIS_LEVELS.fast;
	var maxDepth = levelParams.depth, beamWidth = levelParams.beam, extraDepthAfterBest = 3;
	var target = maxPossibleCombosFromCounts(base);
	var best = 0, bestFoundDepth = -1;
	// Solutions are kept per combo count (best tier and one below) so the
	// results can list several near-optimal routes, not just the single
	// best path the beam happened to keep.
	var solutionsByCombo = {};
	var beam = [];
	for (var s = 0; s < rows*cols; s++) beam.push({ board: base, pos: s, path: [s] });
	var depth = 0;
	document.getElementById('analyzeResults').innerHTML = '';
	setAnalyzeStatus('解析中... 0/' + maxDepth + '手');

	function step(){
		depth++;
		var candidates = [];
		var seen = {};
		for (var bi = 0; bi < beam.length; bi++){
			var st = beam[bi];
			var px = st.pos % rows, py = (st.pos - px) / rows;
			var prev = st.path.length > 1 ? st.path[st.path.length-2] : -1;
			var neighbors = [];
			if (px > 0) neighbors.push(st.pos-1);
			if (px < rows-1) neighbors.push(st.pos+1);
			if (py > 0) neighbors.push(st.pos-rows);
			if (py < cols-1) neighbors.push(st.pos+rows);
			for (var ni = 0; ni < neighbors.length; ni++){
				var np = neighbors[ni];
				if (np === prev) continue; // no immediate backtrack
				var nb = st.board.slice();
				var tmp = nb[st.pos]; nb[st.pos] = nb[np]; nb[np] = tmp;
				var key = nb.join('|') + '#' + np;
				if (seen[key]) continue;
				seen[key] = true;
				var combos = simulateCascade(nb.slice());
				var npath = st.path.concat([np]);
				candidates.push({ board: nb, pos: np, path: npath, score: combos*1000 + countAdjacentPairs(nb) });
				if (combos > 0 && combos >= best - 1){
					if (combos > best){
						best = combos;
						bestFoundDepth = depth;
						for (var oldTier in solutionsByCombo){
							if (parseInt(oldTier) < best - 1) delete solutionsByCombo[oldTier];
						}
					}
					var tierArr = solutionsByCombo[combos] = solutionsByCombo[combos] || [];
					if (tierArr.length < 60) tierArr.push(npath);
				}
			}
		}
		candidates.sort(function(a, b2){ return b2.score - a.score; });
		beam = candidates.slice(0, beamWidth);
		setAnalyzeStatus('解析中... ' + depth + '/' + maxDepth + '手 (現時点の最大: ' + best + 'コンボ)');
		var doneByTarget = (best >= target && bestFoundDepth > -1 && depth >= bestFoundDepth + extraDepthAfterBest);
		if (doneByTarget || depth >= maxDepth || beam.length === 0) finish();
		else setTimeout(step, 0);
	}

	function finish(){
		analysisRunning = false;
		// Best-combo routes first (shortest first), then one combo fewer
		// as extra alternatives if there is room left.
		var tiers = Object.keys(solutionsByCombo).map(Number).sort(function(a, b2){ return b2 - a; });
		var seenPaths = {}, finals = [];
		for (var t = 0; t < tiers.length && finals.length < 5; t++){
			var tierPaths = solutionsByCombo[tiers[t]].slice();
			tierPaths.sort(function(a, b2){ return a.length - b2.length; });
			for (var i = 0; i < tierPaths.length && finals.length < 5; i++){
				var k = tierPaths[i].join(',');
				if (seenPaths[k]) continue;
				seenPaths[k] = true;
				finals.push({ path: tierPaths[i], combos: tiers[t] });
			}
		}
		analysisSolutions = finals;
		renderAnalysisResults(best, target);
	}

	setTimeout(step, 0);
}

function renderAnalysisResults(best, target){
	var container = document.getElementById('analyzeResults');
	if (!analysisSolutions.length){
		container.innerHTML = '<div>ルートが見つかりませんでした</div>';
		setAnalyzeStatus('');
		return;
	}
	var html = '';
	for (var i = 0; i < analysisSolutions.length; i++){
		var s = analysisSolutions[i];
		html += '<div class="analyzeItem">' + (i+1) + '. ' + s.combos + 'コンボ / ' + (s.path.length-1) + '手'
			+ ' <button onclick="requestAction(\'showsolution\', ' + i + ')">ルート表示</button>'
			+ ' <button onclick="requestAction(\'playsolution\', ' + i + ')">再生</button></div>';
	}
	container.innerHTML = html;
	setAnalyzeStatus('解析完了: 最大' + best + 'コンボ (盤面の理論値 ' + target + 'コンボ)');
	requestAction('showsolution', 0);
}

function showAnalysisSolution(index){
	var sol = analysisSolutions[index];
	if (!sol) return;
	clearMemory('arrows');
	var ctx = document.getElementById('arrowSurface').getContext('2d');
	var points = buildOffsetPathPoints(sol.path);
	drawSmoothPath(ctx, points);
	drawRouteDot(ctx, points[0].x, points[0].y, 8, '#fff');
	drawRouteDot(ctx, points[points.length-1].x, points[points.length-1].y, 9, '#cf0');
}

// ---- スクショ読込 (set the board from a game screenshot) ----
//
// Assumes the board spans the full width of the screenshot and sits at
// (or near) the bottom edge, as in the real game. Several candidate
// bottom margins are tried, and whichever grid alignment yields the most
// saturated, orb-like samples wins; each cell is then classified by hue.
// Uses the currently selected board size, so pick 5x6/5x4/7x6 first.

function rgbToHsv(r, g, b){
	r /= 255; g /= 255; b /= 255;
	var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
	var h = 0;
	if (d !== 0){
		if (max === r) h = 60 * (((g - b) / d) % 6);
		else if (max === g) h = 60 * ((b - r) / d + 2);
		else h = 60 * ((r - g) / d + 4);
	}
	if (h < 0) h += 360;
	return { h: h, s: max === 0 ? 0 : d / max, v: max };
}

function hueDistance(a, b){
	var d = Math.abs(a - b) % 360;
	return d > 180 ? 360 - d : d;
}

var ORB_HUE_REFS = [
	{ color: 'red', h: 12 },
	{ color: 'light', h: 47 },
	{ color: 'green', h: 130 },
	{ color: 'blue', h: 210 },
	{ color: 'dark', h: 280 },
	{ color: 'heart', h: 333 }
];

function classifyOrbColor(r, g, b){
	var hsv = rgbToHsv(r, g, b);
	var best = null, bestD = Infinity;
	for (var i = 0; i < ORB_HUE_REFS.length; i++){
		var d = hueDistance(hsv.h, ORB_HUE_REFS[i].h);
		if (d < bestD){ bestD = d; best = ORB_HUE_REFS[i].color; }
	}
	// Orbs are strongly colored; washed-out samples (background wood,
	// misaligned grids) get a penalty so better-aligned grids score lower.
	var penalty = Math.max(0, 0.35 - hsv.s) * 400 + Math.max(0, 0.25 - hsv.v) * 400;
	return { color: best, dist: bestD + penalty };
}

function sampleAverage(ctx, cx, cy, radius){
	var x0 = Math.max(0, Math.round(cx - radius));
	var y0 = Math.max(0, Math.round(cy - radius));
	var size = Math.max(2, Math.round(radius * 2));
	var data = ctx.getImageData(x0, y0, size, size).data;
	var r = 0, g = 0, b = 0, n = data.length / 4;
	for (var i = 0; i < data.length; i += 4){ r += data[i]; g += data[i+1]; b += data[i+2]; }
	return { r: r/n, g: g/n, b: b/n };
}

function importBoardFromImage(img){
	var W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
	if (!W || !H) return;
	var c = document.createElement('canvas');
	c.width = W; c.height = H;
	var ictx = c.getContext('2d');
	ictx.drawImage(img, 0, 0);
	var cell = W / rows;
	var bottomOffsets = [0, 0.01, 0.02, 0.035, 0.05, 0.07, 0.1];
	var bestBoard = null, bestScore = Infinity;
	for (var oi = 0; oi < bottomOffsets.length; oi++){
		var top = H - H * bottomOffsets[oi] - cell * cols;
		if (top < 0) continue;
		var board = [], score = 0;
		for (var i = 0; i < rows*cols; i++){
			var x = i % rows, y = (i - x) / rows;
			var avg = sampleAverage(ictx, x*cell + cell/2, top + y*cell + cell/2, cell*0.18);
			var cls = classifyOrbColor(avg.r, avg.g, avg.b);
			board.push(cls.color);
			score += cls.dist;
		}
		if (score < bestScore){ bestScore = score; bestBoard = board; }
	}
	if (!bestBoard || bestScore / (rows*cols) > 120){
		displayOutput('盤面をうまく読み取れませんでした。ゲーム画面全体のスクリーンショット(盤面が下端にあるもの)を使ってください<br />', 0);
		return;
	}
	for (var t = 0; t < rows*cols; t++) setTileAttribute(t, bestBoard[t], 1);
	getTiles();
	saveBoardState();
	requestAction('copypattern');
	displayOutput('スクリーンショットから盤面を読み込みました。誤認識があればパレットで修正してください<br />', 0);
}

// Fills any cleared (black) cells with random drops. When 落ちコン is
// off the fill retries until it doesn't create instant matches, so the
// next puzzle starts from a settled board.
function refillBoard(){
	var holes = [];
	for (var i = 0; i < rows*cols; i++){
		if (divs[i].getAttribute('tileColor') == 'black') holes.push(i);
	}
	if (!holes.length) return;
	for (var attempt = 0; attempt < 60; attempt++){
		for (var h = 0; h < holes.length; h++) setTileAttribute(holes[h], randomColor(), 1);
		getTiles();
		if (getMatches() == false) return;
	}
}

// Runs when a puzzle has fully resolved (all combos cleared and fallen).
// 単発 (single-shot) restores the starting board so the same puzzle can
// be practiced again — the route stays drawn until Reset. 継続
// (continuous) refills the cleared drops and makes the resulting board
// the new baseline for Reset/Replay.
function finishPuzzle(){
	if (playStyle == 'single'){
		loadBoardState(savedBoardState);
	}
	else {
		refillBoard();
		saveBoardState();
		replayMoveSet = [];
	}
	toggle('draggable', 1);
}

// Keeps the skyfall/random color pool in sync with the Edit-mode
// generator chips, so 落ちコン drops come from the same 陣.
function syncColorsFromGen(){
	var selected = [];
	for (var c in genSelected) if (genSelected[c]) selected.push(c);
	if (selected.length > 0) colors = selected.slice();
}

// Edit-mode Random: builds a board from the selected colors (色陣), with
// optional exact per-color counts. Existing matches are allowed — a 陣
// legitimately contains pre-connected drops.
function generateEditBoard(){
	var selected = [];
	for (var c in genSelected) if (genSelected[c]) selected.push(c);
	if (selected.length < 1){
		displayOutput('生成する色を1色以上選んでください<br />', 0);
		return;
	}
	var total = rows*cols;
	var pool = [], fixedSum = 0, flexible = [];
	for (var i = 0; i < selected.length; i++){
		var el = document.getElementById('genCount-' + selected[i]);
		var v = (el && el.value !== '') ? parseInt(el.value) : NaN;
		if (!isNaN(v) && v >= 0){
			fixedSum += v;
			for (var k = 0; k < v; k++) pool.push(selected[i]);
		}
		else flexible.push(selected[i]);
	}
	if (fixedSum > total){
		displayOutput('個数指定の合計(' + fixedSum + ')が盤面のマス数(' + total + ')を超えています<br />', 0);
		return;
	}
	if (!flexible.length && fixedSum < total){
		displayOutput('個数指定の合計(' + fixedSum + ')がマス数(' + total + ')に足りません。どれかの色の個数を空欄にすると、残りがその色のランダムで埋まります<br />', 0);
		return;
	}
	while (pool.length < total) pool.push(flexible[Math.floor(Math.random() * flexible.length)]);
	for (var j = pool.length - 1; j > 0; j--){
		var swapTo = Math.floor(Math.random() * (j + 1));
		var tmp = pool[j]; pool[j] = pool[swapTo]; pool[swapTo] = tmp;
	}
	for (var p = 0; p < total; p++) setTileAttribute(p, pool[p], 1);
	getTiles();
	saveBoardState();
	syncColorsFromGen();
	replayMoveSet = [];
	requestAction('copypattern');
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
				finishPuzzle();
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
function applyResponsiveLayout(force){
	var boardEl = document.getElementById('board');
	if (!boardEl || divs.length == 0) return;
	// The frame keeps its width; its height follows the current grid's
	// aspect ratio (like the real game, where board heights differ a bit
	// between sizes), so tiles always fill the frame exactly.
	boardEl.style.aspectRatio = rows + ' / ' + cols;
	var measuredWidth = boardEl.clientWidth;
	if (!measuredWidth) return;
	var newScale = Math.floor(measuredWidth / rows);
	if (newScale < 1 || (newScale == scale && !force)) return;
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
	bindCornerblockDroppable();
}

function bindCornerblockDroppable(){
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
}

// Rebuilds the tile grid from scratch: used at page load and whenever
// the board dimensions change (Edit mode's size picker).
function buildTiles(){
	document.getElementById('tiles').innerHTML = '';
	divs = [];
	for (var i = 0; i < rows*cols; i++){
		var randColor = randomColor();
		divs[i] = document.createElement('div');
		setTileAttribute(i, randColor, 1);
		$('#tiles').append(divs[i]);
	}
}

// Lays a bg1/bg2 checkerboard behind the tiles, one cell per board
// position, sized via the same --tile-size custom property the tiles use
// so it stays in sync with the board's responsive/edit-mode sizing.
function buildBoardBackground(){
	var bg = document.getElementById('boardBg');
	if (!bg) return;
	bg.innerHTML = '';
	for (var i = 0; i < rows*cols; i++){
		var x = i % rows, y = Math.floor(i / rows);
		var cell = document.createElement('div');
		cell.className = 'bgcell ' + (((x+y) % 2 == 0) ? 'bg1' : 'bg2');
		bg.appendChild(cell);
	}
}

// (Re)binds jQuery UI draggable/droppable to the current .tile elements.
// Must be called again after buildTiles() since jQuery UI widgets only
// attach to elements that exist at the time it's called.
// Slides a displaced orb from its old on-screen spot to its new one
// (FLIP, same idea as the fall animation) so drag swaps read as the orb
// smoothly flowing out of the way instead of teleporting.
function animateSwapSlide(el, fromLeft, fromTop){
	var r = el.getBoundingClientRect();
	var dx = fromLeft - r.left, dy = fromTop - r.top;
	if (!dx && !dy) return;
	el.style.transition = 'none';
	el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
	void el.offsetWidth;
	el.style.transition = 'transform 110ms ease-out';
	el.style.transform = '';
	setTimeout(function(){
		el.style.transition = '';
		el.style.transform = '';
	}, 110);
}

function bindTileDragDrop(){
	$( ".tile" ).draggable({
		refreshPositions:"true",
		containment: "#board",
		helper: "clone",
		opacity: 0.8,
		zIndex: 3,
		start:function( event, ui ){
			$(this).css({ opacity:0.2 });
			clearMemory('arrows');
			replayMoveSet=[];
		},
		stop:function( event, ui ){
			$(this).css({ opacity:1 });
			if (changeTheWorldOn == 0 && (measureOn == 1 || timerOn == 1)) {
				lastMeasuredTime = x.time();
			}
			requestAction('solve', 1);
		},
		cursorAt: { top: scale/2, left: scale/2 }
	});
	$( ".tile" ).droppable({
		accept: ".tile",
		tolerance: "pointer",
		over: function( event, ui ){
			var draggable = ui.draggable, droppable = $(this);
			var firstSwap = (swapHasHappened == 0);
			if (skyFall == 1 && swapHasHappened == 0) saveBoardState();
			var displacedRect = droppable[0].getBoundingClientRect();
			draggable.swap(droppable, 2);
			animateSwapSlide(droppable[0], displacedRect.left, displacedRect.top);
			swapHasHappened = 1;
			// The timer (制限/計測) starts on the first actual swap, not
			// when the drop is first picked up.
			if (firstSwap && changeTheWorldOn == 0) {
				if (timerOn == 1) {
					timeOut.push(setTimeout(function(){ $(document).trigger("mouseup"); },timerTime));
					start();
				}
				else if (measureOn == 1) {
					start();
				}
			}
		}
	});
	if (appMode != 'play') toggle('draggable', 0);
}

function updateBoardSizeButtons(){
	var s6x5 = document.getElementById('size6x5Btn');
	if (!s6x5) return;
	s6x5.classList.toggle('modebutton-active', rows==6 && cols==5);
	document.getElementById('size5x4Btn').classList.toggle('modebutton-active', rows==5 && cols==4);
	document.getElementById('size7x6Btn').classList.toggle('modebutton-active', rows==7 && cols==6);
}

// Rebuilds the board at a new size. The board frame itself keeps its
// current on-screen footprint (fixed by CSS max-width); only the tile
// count/size changes, via applyResponsiveLayout recomputing `scale` for
// the new row count.
function setBoardSize(newRows, newCols){
	if (rows == newRows && cols == newCols) return;
	clearMemory('timeout');
	rows = newRows;
	cols = newCols;
	document.getElementById('entry').maxLength = rows*cols;
	buildTiles();
	applyResponsiveLayout(true);
	bindTileDragDrop();
	buildBoardBackground();
	randomizeBoard();
	saveBoardState();
	requestAction('copypattern');
	updateBoardSizeButtons();
	var activeBtn = document.querySelector('#boardSizeButtons .modebutton-active');
	displayOutput('盤面サイズを' + (activeBtn ? activeBtn.textContent : rows + '&times;' + cols) + 'に変更しました<br />', 0);
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
	if (action == 'setboardsize') {
		var sizeParts = modifier.split('x');
		setBoardSize(parseInt(sizeParts[0]), parseInt(sizeParts[1]));
	}
	if (action == 'editrandom') generateEditBoard();
	if (action == 'genchip') {
		genSelected[modifier] = !genSelected[modifier];
		document.getElementById('genChip-' + modifier).classList.toggle('selected', genSelected[modifier]);
		syncColorsFromGen();
	}
	if (action == 'playstyle') {
		playStyle = (playStyle == 'single') ? 'continuous' : 'single';
		document.getElementById('playStyleBtn').innerHTML = (playStyle == 'single') ? '単発' : '継続';
		displayOutput(playStyle == 'single'
			? '単発モード: パズル終了後、元の盤面に戻します<br />'
			: '継続モード: パズル終了後、消えた分のドロップを補充して次のパズルに移ります<br />', 0);
	}
	if (action == 'analyze') runAnalysis();
	if (action == 'analyzelevel') {
		analysisLevel = modifier;
		document.getElementById('levelFastBtn').classList.toggle('modebutton-active', modifier == 'fast');
		document.getElementById('levelNormalBtn').classList.toggle('modebutton-active', modifier == 'normal');
		document.getElementById('levelDeepBtn').classList.toggle('modebutton-active', modifier == 'deep');
	}
	if (action == 'showsolution') showAnalysisSolution(modifier);
	if (action == 'playsolution') {
		var solToPlay = analysisSolutions[modifier];
		if (solToPlay) {
			replayMoveSet = solToPlay.path.slice();
			requestAction('replay');
		}
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
	buildTiles();
	applyResponsiveLayout();
	buildBoardBackground();
	$(window).on('resize orientationchange', debounce(function(){ applyResponsiveLayout(); }, 150));
	randomizeBoard();
	updateBoardSizeButtons();

	saveBoardState();
	clearMemory('score');
	renderLibrary();

	// Keeps the orb-count bar in sync with any board change (paints,
	// generation, clears, refills) without touching every code path.
	new MutationObserver(debounce(updateOrbCountBar, 60)).observe(
		document.getElementById('tiles'),
		{ attributes: true, attributeFilter: ['tilecolor'], subtree: true, childList: true }
	);
	updateOrbCountBar();

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

	bindTileDragDrop();
	$('#screenshotInput').on('change', function(){
		var file = this.files && this.files[0];
		if (!file) return;
		var url = URL.createObjectURL(file);
		var img = new Image();
		img.onload = function(){
			importBoardFromImage(img);
			URL.revokeObjectURL(url);
		};
		img.src = url;
		this.value = '';
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
