let socket = io() // Connect to server

let RatioX = 1;
let RatioY = 1;
if (screen.width < 1300 ){
	RatioX = (screen.width / 1300)
}
if (screen.height < 1050 ){
	RatioY = (screen.height / 1050)
}
if ( RatioX !== 1 || RatioY !== 1) {
	if ( RatioX < RatioY) { $("body").css('transform', 'scale('+RatioX+')'); }
	else {$("body").css('transform', 'scale('+RatioY+')'); }
}

// Affiche les 
var PhaseDeJeux = 0;	
var CSid = "";
var CSpo = "";

jQuery.fn.exists = function(){ return this.length > 0; }

// alert("Your screen resolution is: " + screen.width + "x" + screen.height
 // + " Ratiox :" + RatioX+ " RatioY " + RatioY);


// Creation d'une Salle
$("#join-create").click(function(){
		// Envoi un message au server  createRoom
  socket.emit('createRoom', {
    nickname:$("#join-nickname").val(),
    room:$("#join-room").val(),
    password:$("#join-password").val(),
  });
  $('#error-message').text('creation de salle en cours !!');

});


$("#join-enter").click(function(){
			// Envoi un message au server  createRoom
  socket.emit('joinRoom', {
    nickname:$("#join-nickname").val(),
    room:$("#join-room").val(),
    password:$("#join-password").val(),
  });
  $('#error-message').text('Entrez dans la salle en cours ... ');
});

// Ciquer sur le boutton start Partie
$("#start").click(function(){
			// Envoi un message au server  createRoom
  socket.emit('startGame', {});
});

// cliquer sur le button CarteSelectionee
$("#CarteSelectionee").click(function () {
	let data;
	data = {IdCarte : CSid};
	socket.emit('carteSelectionne', data);
});




// Recevoir un message dans l'écran Join
socket.on('joinResponse', (data) =>{      // Response to creating room
  if(data.success){
    $("#join-game").hide();
    $("#game").show();
  } 
  $('#error-message').text(data.msg);
});




/*
 Socket gameState
 data 
*/
socket.on('gameState', (data) =>{           // Response to gamestate update
  // if (data.difficulty !== difficulty){  // Update the clients difficulty
    // difficulty = data.difficulty
    // wipeBoard();                        // Update the appearance of the tiles
  // }
  // mode = data.mode                      // Update the clients game mode
  // updateInfo(data.game, data.team, data.players)      // Update the games turn information
  // updateTimerSlider(data.game, data.mode)          // Update the games timer slider
  // updatePacks(data.game)                // Update the games pack information
	console.log (data);
	PhaseDeJeux = data.game.PhaseDeJeux;
	updatePlayerlist(data.players)        // Update the player list for the room

	// Affiche ou met à jour la main:
	updateMain(data.players[socket.id]);
	
	// Caché ou affiche en fontion de la PhaseDeJeux
	AffichageGame (data);
	
	// Verifier si on sommes en phase 1 avec une carte selectionnée
	if ( data.game.PhaseDeJeux && data.players[socket.id].selection !== "")
	{
		console.log ("Vous avez selectionner votre carte");
		// on cache le boutton
		$("#SelectionCarte").hide();
		// on efface la carte 
		$("#carte_"+data.players[socket.id].selection).remove();
	}
  
  
	ShowMessage (data.emeteur,data.msg)
});

socket.on('gameMessage', (data) =>{ 
	 // $('.message')
	ShowMessage (data.emeteur,data.msg)
});


function AffichageGame (data)
{
	// Caché ou affiche en fontion de la PhaseDeJeux
	if (data.game.PartieStart){
		// tour en cours
		$("#StartGame").hide();
		$("#SelectionCarte").show();
		if (data.players[socket.id].role === "conteur") {
			$("#msg_choix_carte_conteur").show();	
			$("#msg_choix_carte_joueur").hide();
		} else {
			$("#msg_choix_carte_conteur").hide();
			$("#msg_choix_carte_joueur").show();
		}		
	} else {
		// tour Arreté Arrêté
		$("#StartGame").show()
		$("#msg_choix_carte_conteur").hide();
		$("#msg_choix_carte_joueur").hide();
		$("#SelectionCarte").hide();
	}
}





function ShowMessage (emeteur,message){
	let msg;
	
	msg ='<p>';
	msg += '<span class="emet">'+emeteur+' : </span>'
	msg += '<span class="messagetxt">'+message+'</span>'
	msg += '</p>';
	$(msg).appendTo(("#BoiteMessage"));
	// console.log (document.getElementById("BoiteMessage").scrollHeight);
	// console.log ($("#BoiteMessage").height());
	$("#BoiteMessage").scrollTop (document.getElementById("BoiteMessage").scrollHeight);
}



// Update the player list
function updatePlayerlist(players){
	let UnJoueur = "";
	Panellist = $("#Playerlist .panel");
	Panelscore = $("#Playerscore .panel");
	Panellist.html('');
	Panelscore.html('');
	let i=1;
	for (let ID in players){
	// met le nom dans les spam class conteur	
		if (players[ID].role === "conteur"){
			$("#conteurName").html(players[ID].nickname);
		} 
		// Create a <p> element for each player
		UnJoueur = '<p class="player" id="player_'+i+'" >';
		// UnJoueur += '<button onclick="alert(\'click\');" class="pseudo">'+players[ID].nickname+'</button>'
		UnJoueur += '<button onclick="ChangeRole(\''+ID+'\')"  class="pseudo">'+players[ID].nickname+'</button>'
		UnJoueur += '<span class="role '+players[ID].role+'"> &nbsp;&nbsp;</span>'
		UnJoueur += '<span class="'+players[ID].IconAction+'"> &nbsp;&nbsp;</span>'
		UnJoueur += '</p>';
		Panellist.append(UnJoueur);
		
		// Create a <p> element for each scaore players
		UnJoueur = '<p class="player" id="player_'+i+'" >';
		UnJoueur += '<span class="pseudo">'+players[ID].nickname+'</span>'
		UnJoueur += '<span class="score">'+players[ID].score+'</span>'
		UnJoueur += '</p>';
		Panelscore.append(UnJoueur);
		
		i+=1;	

	
	}
}



// function updateRoomName (name) {
	// $("#roomname").text(name);
// }

function ChangeRole(PlayerId) {
	console.log("Changer le role de " + PlayerId);
	socket.emit('changeRole', {Id: PlayerId});
}


// ise a jour des mains
function updateMain (UnPlayer){
	ContentCarte=$("#game")
	// Affiche les main des joueurs
	for (let i in UnPlayer.main){
		//console.log($("#carte_"+UnPlayer.main[i]).length);
		// Verifier si l'image existe deja !
		if ( !$("#carte_"+UnPlayer.main[i]).exists()) {
			UnJoueur = '<img  onclick="SelectionCarte(\''+UnPlayer.main[i]+'\')"  id="carte_'+UnPlayer.main[i]+'" src="images/cartes/'+UnPlayer.main[i]+'.jpg" class="p'+i+' carteM">';
			$(UnJoueur).appendTo(ContentCarte)
			// console.log("Création de la carte: "+UnPlayer.main[i]);
		}
	}
}


function SelectionCarte (id) {
	Carte = $("#carte_"+id);
	 if (PhaseDeJeux == 1) {
		if ( CSid === "" ) {
		console.log("Sélection de la carte :" + id);
		Carte.animate({left: '500px',bottom: '100px',height: '600px',width: '400px',zIndex: '10'}, 200);
		CSid = id;
		CSpo = Carte.attr("class").slice(0,2);
		}  else if (CSid === id){
			var pos = 216*CSpo[1]+8;
			Carte.animate({
				left: pos+'px',
				bottom: '10px',
				height: '300px',
				width: '200px',
				zIndex: '0'
				}, 200);
			CSid ="";
			CSpo = "";
			console.log("Désélection de la carte :" + id);
		} else {
			console.log("vous avez deja selectionné la carte :"+CSid+"!");
		}
	} else {
		console.log(" ce n'est pas le bon monent");
	}
}
