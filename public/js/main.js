/* functions for general use */

/* This function returns the value associated with 'whichParam' on the URL*/
function getURLParameters(whichParam)
{
	var pageURL = window.location.search.substring(1);
	var pageURLVariables = pageURL.split('&');
	for(var i = 0; i < pageURLVariables.length; i++){
		var parameterName = pageURLVariables[i].split('=');
		if(parameterName[0] == whichParam) {
			return parameterName[1];
		}
	}
}

var username = getURLParameters('username');
if('undefined' == typeof username || !username) {
	username = 'Anonymous_'+Math.floor(Math.random() * 9999);
}

var chat_room = getURLParameters('game_id');
if('undefined' == typeof chat_room || !chat_room) {
	chat_room = 'lobby';
}


/* Connect to the socket server */
var socket = io.connect();

/*What to do when the server sends me a log message*/
socket.on('log',function(array){
	console.log.apply(console,array);
});

/*JOIN ROOM*/
/*What to do when the server responds that someone joined a room*/
socket.on('join_room_response',function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	/*If we are being notified that we joined the room, then ignore*/
	if(payload.socket_id == socket.id) {
		return;
	}
	
	/*If someone joined, add a new row to the lobby table*/
	/*this finds all dom elements associated with a given socket id*/
	var dom_elements = $('.socket_'+payload.socket_id);
	
	/*If we don't already have an entry for this person, create w-100, player's name, and button*/
	if(dom_elements.length == 0){
		/*create nodes & associate them with user's socket id*/
		var nodeA = $('<div></div>');
		nodeA.addClass('socket_'+payload.socket_id);
		var nodeB = $('<div></div>');
		nodeB.addClass('socket_'+payload.socket_id);
		var nodeC = $('<div></div>');
		nodeC.addClass('socket_'+payload.socket_id);
		
		/*add specific classes to nodes*/
		nodeA.addClass('w-100');
		nodeB.addClass('col-9 text-right');
		nodeB.append('<h4>'+payload.username+'</h4>');
		nodeC.addClass('col-3 text-left');
		var buttonC = makeInviteButton(payload.socket_id);
		nodeC.append(buttonC);
		
		/*hide and then animate appearance of nodes*/
		nodeA.hide();
		nodeB.hide();
		nodeC.hide();
		$('#players').append(nodeA,nodeB,nodeC);
		nodeA.hide();
		nodeB.hide();
		nodeC.hide();
		nodeA.slideDown(1000);
		nodeB.slideDown(1000);
		nodeC.slideDown(1000);
	}
	/*handle case of someone reappearing*/
	else {
		/*reset the invite button*/
		uninvite(payload.socket_id);
		var buttonC = makeInviteButton(payload.socket_id);
		$('.socket_'+payload.socket_id+' button').replaceWith(buttonC);
		dom_elements.slideDown(1000);
	}
	
	/*Manage the message that a player has joined*/
	var newHTML = '<p>'+payload.username+' just entered the room</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').prepend(newNode);
	newNode.slideDown(1000);
});

/*LEAVE ROOM*/
/*What to do when the server responds that someone has left*/
socket.on('player_disconnected',function(payload){
	
	
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	/*If we are being notified that we left the room, then ignore*/
	if(payload.socket_id == socket.id){
		return;
	}
	
	/*If someone left, animate out their content*/
	/*Find all DOM elements associated with a given socket id*/
	var dom_elements = $('.socket_'+payload.socket_id);
	
	/*If there is content associated with that user*/
	if(dom_elements.length != 0){
		/*animate away that content*/
		dom_elements.slideUp(1000);
	}
	
	/*Manage the message that a player has left*/
	var newHTML = '<p>'+payload.username+' has left the room</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').prepend(newNode);
	newNode.slideDown(1000);
});

/*INVITING*/
/*Send invite message*/
function invite(who) {
	var payload = {};
	payload.requested_user = who;
	
	console.log('*** Client Log Message: \'invite\' payload: ' + JSON.stringify(payload));
	socket.emit('invite',payload);
}
/*Handle reponse after sending invite message*/
socket.on('invite_response',function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeInvitedButton(payload.socket_id);
	$('.socket_' + payload.socket_id+' button').replaceWith(newNode);
});
/*Handle a notification that we have been invited*/
socket.on('invited',function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makePlayButton(payload.socket_id);
	$('.socket_' + payload.socket_id+' button').replaceWith(newNode);
});



/*UNINVITING*/
/*Send uninvite message*/
function uninvite(who){
	var payload = {};
	payload.requested_user = who;
	
	console.log('*** Client Log Message: \'uninvite\' payload: ' + JSON.stringify(payload));
	socket.emit('uninvite',payload);
}
/*Handle reponse after sending uninvite message*/
socket.on('uninvite_response',function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeInviteButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});
/*Handle a notification that we have been uninvited*/
socket.on('uninvited',function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeInviteButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
});


/*START GAME*/
/*Send game_start message*/
function game_start(who){
	var payload = {};
	payload.requested_user = who;
	
	console.log('*** Client Log Message: \'game_start\' payload: ' + JSON.stringify(payload));
	socket.emit('game_start',payload);
}
/*Handle notification that we have been engaged*/
socket.on('game_start_response',function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeEngagedButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);
	
	/*Jump to a new page!*/
	window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id;
});

/*MESSAGES*/
function send_message(){
	var payload = {};
	payload.room = chat_room;
	payload.username = username;
	payload.message = $('#send_message_holder').val();
	console.log('*** Client Log Message: \'send_message\' payload: '+JSON.stringify(payload));
	socket.emit('send_message',payload);
	$('#send_message_holder').val('');
}

socket.on('send_message_response',function(payload){
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	$('#messages').prepend('<p><b>'+payload.username+' says:</b> '+payload.message+'</p>');
	$('#messages <p>').slideDown(1000);
});

/*MAKE BUTTONS*/
function makeInviteButton(socket_id){
	var newHTML = '<button type=\'button\' class=\'btn btn-outline-primary\'>Invite</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		invite(socket_id);
	});
	return(newNode);
}

function makeInvitedButton(socket_id){
	var newHTML = '<button type=\'button\' class=\'btn btn-primary\'>Invited</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		uninvite(socket_id);
	});
	return(newNode);
}

function makePlayButton(socket_id){
	var newHTML = '<button type=\'button\' class=\'btn btn-success\'>Play</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		game_start(socket_id);
	});
	return(newNode);
}

function makeEngagedButton(){
	var newHTML = '<button type=\'button\' class=\'btn btn-danger\'>Engaged</button>';
	var newNode = $(newHTML);
	return(newNode);
}


$(function(){
	var payload = {};
	payload.room = chat_room;
	payload.username = username;
	
	console.log('*** Client Log Message: \'join_room\' payload: '+JSON.stringify(payload));
	socket.emit('join_room',payload);
	
	$('#quit').append('<a href="lobby.html?username='+username+'" class="btn btn-danger btn-default active" role="button" aria-pressed="true">Quit</a>');
	
});

var old_board = [
					['?','?','?','?','?','?','?','?',],
					['?','?','?','?','?','?','?','?',],
					['?','?','?','?','?','?','?','?',],
					['?','?','?','?','?','?','?','?',],
					['?','?','?','?','?','?','?','?',],
					['?','?','?','?','?','?','?','?',],
					['?','?','?','?','?','?','?','?',],
					['?','?','?','?','?','?','?','?',]
				];
				
var my_color = ' ';

socket.on('game_update',function(payload){
	console.log('*** Client Log Message: \'game_update\'\n\tpayload: '+JSON.stringify(payload));
	/*check for a good board update*/
	if(payload.result == 'fail'){
		console.log(payload.message);
		window.location.href = 'lobby.html?username='+username;
		return;
	}
	/*Check for a good board in the payload*/
	var board = payload.game.board;
	if('undefined' == typeof board || !board){
		console.log('Internal error: received a malformed board update from the server');
		return;
	}
	/*update my color*/
	if(socket.id == payload.game.player_moon.socket){
		my_color = 'moon';
	}
	else if(socket.id == payload.game.player_shadow.socket){
		my_color = 'shadow';
	}
	else{
		/*something weird is going on; send client back to lobby*/
		window.location.href = 'lobby.html?username='+username;
		return;
	}
	
	$('#my_color').html('<h3 id="my_color">I am team '+my_color+'</h3>');
	$('#my_color').append('<h4>It is '+payload.game.whose_turn+'\'s turn</h4>');
	
	/*animate changes to the board*/
	
	var moonsum = 0;
	var shadowsum = 0;
	
	var row,column;
	for(row = 0; row < 8; row++){
		for(column = 0; column < 8; column++){
			if(board[row][column] == 'm') {
				moonsum++;
			}
			if(board[row][column] == 's') {
				shadowsum++;
			}
			
			/*if a board space has changed*/
			if(old_board[row][column] != board[row][column]){
				/*TO EMPTY*/
				if(old_board[row][column] == '?' && board[row][column] == ' '){
					/*select correct box and add image for empty square*/
					$('#'+row+'_'+column).html('<img src="assets/images/empty.gif" alt="empty square"/>');
				}
				/*TO MOON*/
				else if(old_board[row][column] == '?' && board[row][column] == 'm'){
					$('#'+row+'_'+column).html('<img src="assets/images/empty_to_moon.gif" alt="moon square"/>');
				}
				/*TO SHADOW*/
				else if(old_board[row][column] == '?' && board[row][column] == 's'){
					$('#'+row+'_'+column).html('<img src="assets/images/empty_to_shadow.gif" alt="shadow square"/>');
				}
				/*SPACE TO MOON*/
				else if(old_board[row][column] == ' ' && board[row][column] == 'm'){
					$('#'+row+'_'+column).html('<img src="assets/images/empty_to_moon.gif" alt="moon square"/>');
				}
				/*SPACE TO SHADOW*/
				else if(old_board[row][column] == ' ' && board[row][column] == 's'){
					$('#'+row+'_'+column).html('<img src="assets/images/empty_to_shadow.gif" alt="shadow square"/>');
				}
				/*MOON TO SPACE*/
				else if(old_board[row][column] == 'm' && board[row][column] == ' '){
					$('#'+row+'_'+column).html('<img src="assets/images/moon_to_empty.gif" alt="empty square"/>');
				}
				/*SHADOW TO SPACE*/
				else if(old_board[row][column] == 's' && board[row][column] == ' '){
					$('#'+row+'_'+column).html('<img src="assets/images/shadow_to_empty.gif" alt="empty square"/>');
				}
				/*MOON TO SHADOW*/
				else if(old_board[row][column] == 'm' && board[row][column] == 's'){
					$('#'+row+'_'+column).html('<img src="assets/images/moon_to_shadow.gif" alt="shadow square"/>');
				}
				/*SHADOW TO MOON*/
				else if(old_board[row][column] == 's' && board[row][column] == 'm'){
					$('#'+row+'_'+column).html('<img src="assets/images/shadow_to_moon.gif" alt="moon square"/>');
				}
				else {
					$('#'+row+'_'+column).html('<img src="assets/images/error.gif" alt="error square"/>');
				}	
			}
			
			/*Set up interactivity*/
			$('#'+row+'_'+column).off('click');
			$('#'+row+'_'+column).removeClass('hovered_over');
			
			if(payload.game.whose_turn === my_color){
				if(payload.game.legal_moves[row][column] === my_color.substr(0,1)){
					$('#'+row+'_'+column).addClass('hovered_over');
					$('#'+row+'_'+column).click(function(r,c){
						return function(){
							var payload = {};
							payload.row = r;
							payload.column = c;
							payload.color = my_color;
							console.log('***Client Log Message: \'play_token\' payload: '+JSON.stringify(payload));
							socket.emit('play_token',payload);
						};
					}(row,column));
				}
		}
	}
	$('#moonsum').html(moonsum);
	$('#shadowsum').html(shadowsum);
	
	old_board = board;
	
});

socket.on('play_token_response',function(payload){
	console.log('*** Client Log Message: \'play_token_response\'\n\tpayload: '+JSON.stringify(payload));
	/*check for a good play_token_response*/
	if(payload.result == 'fail'){
		console.log(payload.message);
		alert(payload.message);
		return;
	}
});

socket.on('game_over',function(payload){
	console.log('*** Client Log Message: \'game_over\'\n\tpayload: '+JSON.stringify(payload));
	/*check for a good play_token_response*/
	if(payload.result == 'fail'){
		console.log(payload.message);
		return;
	}
	
	/*Jump to a new page*/
	$('#game_over').html('<h1>Game Over</h1><h2>'+payload.who_won+' won!</h2>');
	$('#game_over').append('<a href="lobby.html?username='+username+'" class="btn btn-success btn-lg active" role="button" aria-pressed="true">Return to the lobby</a>');
	
});
