var requestAnimationFrame = 
	window.requestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	function(c) {
		setTimeout(c, 1000 / 60);
	};

function clamp(x, a, b) {
	return x < a ? a : x > b ? b : x;
}

var streamerNameInput = document.getElementById("streamerNameInput");
var getViewersButton = document.getElementById("getViewersButton");
var nicknameList = document.getElementById("rouletteList");
var nicknameElems = document.getElementsByClassName("rouletteNick");
var rollButton = document.getElementById("rouletteRollButton");
var musiqueArgent = document.getElementById("musiqueArgent");

function receivedInfo(response) {
	if(response.status != 200) {
		alert("RIP!\nErreur lors de la récupération de la liste des viewers.\nCode HTTP: " + response.status);
		return;
	}
	
	var chatters = response.data.chatters;
	
	while (nicknameList.firstChild) {
	    nicknameList.removeChild(nicknameList.firstChild);
	}
	
	for(var i = 0; i < chatters.viewers.length; i++) {
		var nick = document.createElement("li");
		nick.classList.add("rouletteNick");
		nick.innerHTML = chatters.viewers[i];
		nicknameList.appendChild(nick);
	}
	
	nicknameElems = document.getElementsByClassName("rouletteNick");
	
	nickCount = nicknameElems.length;
	nickRollerSize = (nickCount * nickHeight) / (2 * Math.PI); // 2 * pi * r = nickCount * nickHeight --> r = (nickCount * nickHeight) / (2 * pi)
	nickRollAngle = Math.random() * 360 + 90;
	
	updateTransforms();
	
	var head = document.getElementsByTagName('head')[0];
	var reqScripts = head.getElementsByClassName('requestTag');
	for(var i = reqScripts.length - 1; i >= 0; i--) {
		head.removeChild(reqScripts[i]);
	}
}

function retrieveViewers(streamerName) {
	if(!streamerName) return;
	
	var script = document.createElement('script');
	script.classList.add("requestTag");
	script.src = "https://tmi.twitch.tv/group/user/" + streamerName + "/chatters?callback=receivedInfo";
	document.getElementsByTagName('head')[0].appendChild(script);
}

var nickCount = nicknameElems.length;
var nickHeight = 100; // must match the css height
var nickRollerSize = (nickCount * nickHeight) / (2 * Math.PI); // 2 * pi * r = nickCount * nickHeight --> r = (nickCount * nickHeight) / (2 * pi)
var nickRollAngle = Math.random() * 360 + 90;
var nickVisibilityAngle = 45;

// in nick per sec
var rollSpeedStartMin = 15;
var rollSpeedStartMax = 85;
var rollSpeedStart = 0; // chose randomly between Min and Max
var rollDuration = 5; // in seconds
var rollSpeed = 0;

function updateRollSpeed(progress) {
	rollSpeed = rollSpeedStart - rollSpeedStart * (Math.sin(progress * (Math.PI / 2)));
}

function nowSec() {
	return Date.now() / 1000;
}

var delta;
var startTime = nowSec();
var currentTime = startTime;
var lastTime = currentTime;
var elapsedTime = 0;

function updateTransforms() {
	for(var i = 0; i < nickCount; i++) {
		var angle = (nickRollAngle - i * (360 / nickCount));
		
		var cs = Math.cos(angle * Math.PI / 180) * nickRollerSize;
		var sn = Math.sin(angle * Math.PI / 180) * nickRollerSize - nickRollerSize;
		
		var translateY = cs - i * nickHeight;
		var translateZ = sn;
		var rotateX = (angle - 90);
		var opacity = 1 - Math.abs(clamp((rotateX + nickVisibilityAngle) % 360 - nickVisibilityAngle, -nickVisibilityAngle, nickVisibilityAngle)) / nickVisibilityAngle;
		
		nicknameElems[i].style.transform = "translateY(" + translateY + "px)  translateZ(" + translateZ + "px) rotateX(" + rotateX + "deg)";
		nicknameElems[i].style.opacity = opacity;
	}
}

function setTransformsTransitions(enabled) {
	for(var i = 0; i < nickCount; i++) {
		nicknameElems[i].classList.toggle("transitionMode", enabled);
	}
}

function loop() {
	currentTime = nowSec();
	delta = currentTime - lastTime;
	lastTime = currentTime;
	elapsedTime = currentTime - startTime;
	
	updateRollSpeed(elapsedTime / rollDuration);
	nickRollAngle += (rollSpeed * delta) * (360.0 / nickCount);
	
	updateTransforms();
	
	if(elapsedTime < rollDuration) requestAnimationFrame(loop);
}

function roll() {
	rollDuration = musiqueArgent.duration;
	musiqueArgent.currentTime = 0;
	musiqueArgent.play();
	
	startTime = nowSec();
	rollSpeedStart = Math.random() * (rollSpeedStartMax - rollSpeedStartMin) + rollSpeedStartMin;
	setTransformsTransitions(false);
	loop();
}

rollButton.addEventListener("mousedown", function(e) {
	this.classList.toggle("down", true);
});

rollButton.addEventListener("mouseup", function(e) {
	this.classList.toggle("down", false);
});
	
rollButton.addEventListener("click", function(e) {
	roll();
});

getViewersButton.addEventListener("mousedown", function(e) {
	this.classList.toggle("down", true);
});

getViewersButton.addEventListener("mouseup", function(e) {
	this.classList.toggle("down", false);
});

getViewersButton.addEventListener("click", function(e) {
	retrieveViewers(streamerNameInput.value);
});

nicknameList.addEventListener("wheel", function(e) {
	e = e || window.event;
	e.preventDefault();
	e.returnValue = false;
	
	nickRollAngle += e.deltaY * 0.1;
	updateTransforms();
	return false;
});

updateTransforms();
