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
		var buttonC = makeInviteButton();
		nodeC.append(buttonC);
		
		/*hide and then animate appearance of nodes*/
		/*nodeA.hide();
		nodeB.hide();
		nodeC.hide();*/
		$('#players').append(nodeA,nodeB,nodeC);
		/*nodeA.slideDown(1000);
		nodeB.slideDown(1000);
		nodeC.slideDown(1000);*/
	}
	/*handle case of someone reappearing*/
	else {
		/*reset the invite button*/
		var buttonC = makeInviteButton();
		$('.socket_'+payload.socket_id+' button').replaceWith(buttonC);
		dom_elements.slideDown(1000);
	}
	
	/*Manage the message that a player has joined*/
	var newHTML = '<p>'+payload.username+' just entered the lobby</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').append(newNode);
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
		/*dom_elements.hide();*/
	}
	
	/*Manage the message that a player has left*/
	var newHTML = '<p>'+payload.username+' has left the lobby</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').append(newNode);
	newNode.slideDown(1000);
});

socket.on('send_message_response',function(payload){
	console.log("here");
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	$('#messages').append('<p><b>'+payload.username+' says:</b> '+payload.message+'</p>');
	$('#messages <p>').slideDown(1000);
});


function send_message(){
	var payload = {};
	payload.room = chat_room;
	payload.username = username;
	payload.message = $('#send_message_holder').val();
	console.log('*** Client Log Message: \'send_message\' payload: '+JSON.stringify(payload));
	socket.emit('send_message',payload);
}

function makeInviteButton(){
	var newHTML = '<button type=\'button\' class=\'btn btn-outline-primary\'>Invite</button>';
	var newNode = $(newHTML);
	return(newNode);
}


$(function(){
	var payload = {};
	payload.room = chat_room;
	payload.username = username;
	
	console.log('*** Client Log Message: \'join_room\' payload: '+JSON.stringify(payload));
	socket.emit('join_room',payload);
});