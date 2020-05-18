let socket = io() // Connect to server

let RatioX = 1;
let RatioY = 1;
if (screen.width < 1500 ){
	RatioX = (screen.width / 1300)
}
if (screen.height < 1050 ){
	RatioY = (screen.height / 1050)
}
if ( RatioX !== 1 || RatioY !== 1) {
	if ( RatioX < RatioY) { $("body").css('transform', 'scale('+RatioX+')'); }
	else {$("body").css('transform', 'scale('+RatioY+')'); }
}

var xBody = {
  width: 1500,
  height: 900
}
// console.log ("screen.width" + screen.width);
// console.log ("screen.height" + screen.height);
$('.xBody').css('width', xBody.width);
$('.xBody').css('height', xBody.height);

// Variable Cartes
var CarteMain = {
	bottom : 70,
	left : 8,
	height: 300,
	width : 200,
	bottomH : 10,
	leftH : 440,
	heightH: 780,
	widthH : 520
};
var CarteVote = {
	bottom : 150,
	left : 8,
	height: 300,
	width : 200,
	bottomH : 10,
	leftH : 440,
	heightH: 780,
	widthH : 520	
};

var PionVote = {
	bottom : (CarteVote.bottom + CarteVote.height - 5),
	left : 5,
	height: 50,
	width : 50,

};


// Affiche les 
var PhaseDeJeux = 0;	
var CSid = "";
var CVid = "";







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
	JoinRoom ();
});

$(document).keypress(function(event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
		JoinRoom ();
    }
});


// Cliquez sur le boutton exit
$("#exit-game").click(function(){
	// Envoi un message au server  createRoom
	if ( confirm( "Voulez-vous quitter la partie ?" ) ) {
	// Code à éxécuter si le l'utilisateur clique sur "OK"
		socket.emit('exitGame', {});
		window.location.reload();
	} 
 
});



// Ciquer sur le boutton start Partie
$("#start").click(function(){
			// Envoi un message au server  createRoom
  socket.emit('startGame', {});
 
});

// cliquer sur le button CarteSelectionee
$("#CarteSelectionee").click(function () {
	if (CSid != "") {
	let data;
	data = {IdCarte : CSid};
	data = {IdCarte : CSid};
	// SelectionCarte (CSid);
	socket.emit('carteSelectionne', data);
	} else {
		console.log ("selectionner une carte");
	}
});

// Le joueur vote pour une carte 
$("#ClickVoteUneCarte").click(function (){
	if (CVid != "") {
	let data;
	data = {IdCarte : CVid};	

	// Reinit La carte
	VoteUneCarte (CVid );

	socket.emit('carteVote', data);
	} else {
		console.log ("selectionner une carte");
	}
});


// Tour suivant
$("#ClickFinTour").click(function (){
	socket.emit('finTour',{});
});


$("#ClickNewGame").click(function (){
	socket.emit('newGame',{});
	console.log ('new game');
});

let aboutWindow = document.getElementById('about-window')
let overlay = document.getElementById('overlay')
// User Clicks About
$("#about-button").click(function(){
  if (aboutWindow.style.display === 'none') {
    aboutWindow.style.display = 'block'
    overlay.style.display = 'block'
    $("#about-button").addClass('open')
	// document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
  } else {
    aboutWindow.style.display = 'none'
    overlay.style.display = 'none'
	 $("#about-button").removeClass('open')
    
  }
});

$("#about-button-close").click(function (){
	aboutWindow.style.display = 'none'
    overlay.style.display = 'none'
    $("#about-button").removeClass('open')	
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
	console.log ('Joueur : '+data.players[socket.id].nickname);
	console.log (data.players[socket.id]);
	console.log ('Game : ');
	console.log (data.game);
	// test le nombre de joueur
	// if (data.game.NombredeJoueurs <= 7) {
		// CarteVote.left = (1500-(data.game.NombredeJoueurs * CarteVote.width))/data.game.NombredeJoueurs		
	// } else 
	if (data.game.NombredeJoueurs === 8) {
		CarteVote.width = 180;
		CarteVote.height= 270;
		CarteVote.left = 6;
			
	}
	
	
	PhaseDeJeux = data.game.PhaseDeJeux;
	
	InitVoteEtPion (data) // fais le menage
	
	updatePlayerlist(data)        // Update the player list for the room
	
	UpdateCarteMain(data);  // Affiche ou met à jour la main:
	
	
	AffichageGame (data);// Caché ou affiche en fontion de la PhaseDeJeux
	
	UpdateCarteVote (data); // Affiche Les cartes pour la phase vote
	
	ShowVote (data);
	
	UpdateMsgScore (data);
	
	ShowMessage (data.emeteur,data.msg)
});

socket.on('gameMessage', (data) =>{ 
	 // $('.message')
	ShowMessage (data.emeteur,data.msg)
});


function JoinRoom () {
	socket.emit('joinRoom', {
		nickname:$("#join-nickname").val(),
		room:$("#join-room").val(),
		password:$("#join-password").val(),
	});
	// $('#error-message').text('Entrez dans la salle en cours ... ');
}


function AffichageGame (data)
{
	// Caché ou affiche en fontion de la PhaseDeJeux
	// if (data.game.PartieStart){
		// tour en cours
			$("#msg_victoire").hide();
			$("#SelectionVictoire").hide();
			$("#JeuxADeuxCartes").text(data.game.JeuxADeuxCartes);
		// Affichee ou chaque les message et boutton de phase
		[0,1,2,3].forEach(function(phase){
			// console.log ("phase = " + phase + " phase en cours  = "+ data.game.PhaseDeJeux);
			if ( phase != data.game.PhaseDeJeux){
				$("#SelectionPhase"+phase).hide();
				$("#msg_phase"+phase+"_"+data.players[socket.id].role).hide(100);	
			} else {
				$("#SelectionPhase"+phase).show();
				$("#msg_phase"+phase+"_"+data.players[socket.id].role).show(100);	
			}
		});	
		// Verifier si on est en phase 1 et que la carte est deja selectionnée
		if ( data.game.PhaseDeJeux === 1 && data.players[socket.id].JoueurSelect.length === 1 && data.players[socket.id].role === "conteur")   // Pour le conteur 1 select
			$("#SelectionPhase1").hide();	
		if ( data.game.PhaseDeJeux === 1 && data.players[socket.id].JoueurSelect.length === 1 && data.game.NombredeJoueurs > data.game.JeuxADeuxCartes)   // Pour 4 joueurs et plsu 
			$("#SelectionPhase1").hide();	
		if ( data.game.PhaseDeJeux === 1 && data.players[socket.id].JoueurSelect.length === 2 && data.game.NombredeJoueurs <= data.game.JeuxADeuxCartes )   // Pour 4 joueurs et plsu 
			$("#SelectionPhase1").hide();	
		if ( data.game.PhaseDeJeux === 2 && data.players[socket.id].vote !== "") 
			$("#SelectionPhase2").hide();	
		// Le conteur en phase II ne vote pas
		if  ( data.game.PhaseDeJeux === 2 && data.players[socket.id].role == "conteur") 
			$("#SelectionPhase2").hide(); 
		if (data.game.Winner) {
			$("#msg_victoire").show(100);
			$("#SelectionVictoire").show(100);
			$("#SelectionPhase3").hide();
			ShowGagnant (data);
			
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
function updatePlayerlist(data){
	let UnJoueur = "";
	players = data.players;
	$("#Playerlist h3").html(players[socket.id].nickname);
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
		let disabled="";
		if (players[ID].statut === "off") {
			disabled = "disabled"
		}
		UnJoueur = '<p class="player" id="player_'+i+'" >';
		UnJoueur += '<span '+disabled+' onclick="ChangeRole(\''+ID+'\')"  class="'+players[ID].role+' pseudo">'+players[ID].nickname+'</span>'
		
		// UnJoueur += '<span class="role '+players[ID].role+'"> &nbsp;&nbsp;</span>'
		UnJoueur += '<span class="'+players[ID].IconAction+'"> &nbsp;&nbsp;</span>'
		UnJoueur += '<span class="score">'+players[ID].score+'</span>'
		UnJoueur += '</p>';
		Panellist.append(UnJoueur);
		
		// Create a <p> element for each score players
		// UnJoueur = '<p class="player" id="player_'+i+'" >';
		// UnJoueur += '<span class="pseudo">'+players[ID].nickname+'</span>'
		// UnJoueur += '<span class="score">'+players[ID].score+'</span>'
		// UnJoueur += '</p>';
		// Panelscore.append(UnJoueur);
		
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


// Mise a jour des mains
function UpdateCarteMain (data){
	UnPlayer = data.players[socket.id];
	
	if ( data.game.PhaseDeJeux === 1 && data.players[socket.id].JoueurSelect.length > 0 )
		DecallerLesCarte (data);
	// if ( data.game.PhaseDeJeux === 1 && data.players[socket.id].JoueurSelect.length === 2 && data.game.NombredeJoueurs === 3)
		// DecallerLesCarte (data);
	
	// Affiche les main des joueurs	
	for (let i in UnPlayer.main){
		// Verifier si l'image existe deja !
		if ( !$("#carte_"+UnPlayer.main[i]).exists()) {
			gauche =  ((CarteMain.width+CarteMain.left)*i)+CarteMain.left;
			UnJoueur = '<img  onclick="SelectionCarte(\''+UnPlayer.main[i]+'\')"';
			UnJoueur += ' id="carte_'+UnPlayer.main[i]+'"';
			//UnJoueur += ' src="images/cartes/'+UnPlayer.main[i]+'.jpg"'
			UnJoueur += ' src="'+IdCardToFile(data,UnPlayer.main[i])+'"'
			UnJoueur += ' class="carteM"';
			UnJoueur += ' style="bottom: '+CarteMain.bottom+'; left: '+gauche+'; margin: 0"';
			UnJoueur += ' pos="'+i+'"';
			UnJoueur += ' removing="false"';
			UnJoueur += ' cache="false"'
			UnJoueur += '>';
			$(UnJoueur).appendTo($("#game"))
			// console.log("Création de la carte: "+UnPlayer.main[i]);
		}
		// Verifier si l'image est caché en Phase 0
		if  (data.game.PhaseDeJeux === 0 &&  CarteCache( $("#carte_"+UnPlayer.main[i]))  ){
				DeCacheCarteMain (data,i);
		} else if  (data.game.PhaseDeJeux === 2) {	
			// mode phase II ##vote33
			CacheCarteMain (data,i)	;
		}	else if  (data.game.PhaseDeJeux === 3 && ! CarteCache($("#carte_"+UnPlayer.main[i]) ) ) {	 
			CacheCarteMain (data,i)	;
		}		
	}
}




function CarteCache (obj) {
	return ( obj.attr('cache') === "true" )
}

// Cacher les carte de la main 
function CacheCarteMain (data,id) {
	
	$("#carte_"+data.players[socket.id].main[id]).animate({margin: '0 0 '+(CarteMain.bottom-CarteMain.height)+' 0'
				}).css ({"clip-path": "polygon(0 0, 0 40%, 100% 40%, 100% 0)"
				}).css ({filter: 'blur(4px)'});
	$("#carte_"+data.players[socket.id].main[id]).attr('cache', 'true')
}
function DeCacheCarteMain (data,id) {	
	$("#carte_"+data.players[socket.id].main[id]).animate({margin: '0'
				}).css ({"clip-path": "polygon(0% 0%, 0% 100%, 100% 100% , 100% 0%)"
				}).css ({filter: 'blur(0px)'});
	$("#carte_"+data.players[socket.id].main[id]).attr('cache', 'false')			
}




// deccaller les carte vers la droite 
// && $("#carte_"+data.players[socket.id].JoueurSelect[j]).attr ('removing') === "true"
function DecallerLesCarte (data){	
	for (let j in data.players[socket.id].JoueurSelect) {
		if ( $("#carte_"+data.players[socket.id].JoueurSelect[j]).exists   )
			$("#carte_"+data.players[socket.id].JoueurSelect[j]).fadeOut(100, function(){ $(this).remove();});
			$("#carte_"+data.players[socket.id].JoueurSelect[j]).attr('removing','true');
	}
	// il faut decaler les position des cartes
	let pos = 0;
	
	$(".carteM").each(function(i){
		if ( $( this ).attr ('removing') === "false") {
			gauche =  ((CarteVote.width+CarteVote.left)*pos)+CarteVote.left;
			// $(this).animate({left: gauche});
			$( this ).css('left',gauche)
			$( this ).attr('pos',pos)
			 //console.log ("decale "+i);	
			pos += 1;
		 }
	});
} 





// Get File with ID
function IdCardToFile (data,IdCard) {
	// console.log ("IdCard : "+IdCard + " SRC : "+"images/cartes/"+data.game.Paquet[IdCard])
	return ("images/cartes/"+data.game.Paquet[IdCard]);
}





function SelectionCarte (id) {
	Carte = $("#carte_"+id);
	 if (PhaseDeJeux == 1) {
		if ( CSid === "" ) {
			// Nouvelle carte selectionné
		console.log("Sélection de la carte :" + id);
		Carte.animate({left: CarteMain.leftH ,bottom: CarteMain.bottomH ,height: CarteMain.heightH ,width: CarteMain.widthH,zIndex: '10'}, 300);
		CSid = id;
		}  
		else if (CSid === id){
			// Deselectionner la carte
			console.log("Désélection de la carte :" + id);
			gauche =  ((CarteMain.width+CarteMain.left)*Carte.attr('pos'))+CarteMain.left;
			Carte.animate({left: gauche ,bottom: CarteMain.bottom, height: CarteMain.height ,width: CarteMain.width,zIndex: '0'}, 300);
			CSid = "";
		} 
		else{
			console.log("vous avez deja selectionné la carte :"+CSid+"!");
			ShowMessage ('Serveur',"vous avez deja selectionné la carte")
		}
	} 
	else {
		console.log(" ce n'est pas le bon monent");
	}
}

/*
**  Function pour le vote  en Phase 3
**	
**
**
*/

function UpdateCarteVote (data)
{
		// Afficher les CarteVotes
	if ( data.game.PhaseDeJeux === 2  ||  data.game.PhaseDeJeux === 3 )
	{
		var gauche = CarteVote.left;
		// console.log ("il y a :" + data.game.CartesSelectionnes.length)
		let ramdom ;
		let DejaEnPlace = [];
		for (let i = 0; i < data.game.CartesSelectionnes.length; i++ ){
			ramdom =  Math.floor((Math.random() * data.game.CartesSelectionnes.length));
			while (DejaEnPlace.includes(ramdom)) {
				ramdom =  Math.floor((Math.random() * data.game.CartesSelectionnes.length));
			}
			DejaEnPlace.push(ramdom);		
			// for (let i in data.game.CartesSelectionnes){
			if (!$("#vote_"+data.game.CartesSelectionnes[ramdom]).exists()) {
				gauche =  ((CarteVote.width+CarteVote.left)*i)+CarteVote.left;
				// c'est notre carte 
				console.log ('Carte à afficher :'+ data.game.CartesSelectionnes[ramdom]);
				console.log ('Carte JoueurSelect :');
				console.log (data.players[socket.id].JoueurSelect);
				if (!data.players[socket.id].JoueurSelect.includes(data.game.CartesSelectionnes[ramdom]) )
				{
					console.log ("//Affiche une carte des autre joueurs");
					UneCarte = '<img  onclick="VoteUneCarte(\''+data.game.CartesSelectionnes[ramdom]+'\')"'
					UneCarte += ' id="vote_'+data.game.CartesSelectionnes[ramdom]+'"';
					//UneCarte += ' src="images/cartes/'+data.game.CartesSelectionnes[ramdom]+'.jpg"';
					UneCarte += ' src="'+IdCardToFile(data,data.game.CartesSelectionnes[ramdom])+'"';
					UneCarte += ' class="carteV" ';
					UneCarte += ' style="left:'+gauche+'; bottom:'+CarteVote.bottom+'" ';
					UneCarte += ' pos="'+i+'"';
					UneCarte += '>';
					$(UneCarte).appendTo($("#game"));
				} else {
					console.log ("// affiche mes cartes");
					UneCarte = '<img id="vote_'+data.game.CartesSelectionnes[ramdom]+'"';
					UneCarte += ' src="'+IdCardToFile(data,data.game.CartesSelectionnes[ramdom])+'"';
					UneCarte += ' class="carteV macarte"';
					UneCarte += ' style="left:'+gauche+'; bottom:'+CarteVote.bottom+'"';
					UneCarte += ' pos="'+i+'"'+'>';
					$(UneCarte).appendTo($("#game"));
				}
			}			
		}
	} else {
		// On efface les cartevotes
	}
}


function ShowVote (data)
{
	
	console.log ("ShowVote:Carte vote selectionne : "+CVid);	
	var bas = (5+CarteVote.bottom+CarteVote.height);
	var Class = ""
	// Seulement en phase 3
	if (PhaseDeJeux == 3) {
		for (let i in data.players){
			if (i === socket.id) { Class="Moi"}
			else {Class="PasMoi"}
			// affiche le non du  proprietaire de la carte
			for (let j in data.players[i].JoueurSelect) {
				Pos = parseInt($("#vote_"+data.players[i].JoueurSelect[j]).attr("pos"));
				Gauche =  parseInt(((CarteVote.width+CarteVote.left)*Pos)+CarteVote.left);
				Nom = '<p class="proprio '+ Class + ' ' + data.players[i].role +'"';
				Nom += ' style="'+'width: '+CarteVote.width+';left: '+Gauche+'; bottom: '+bas+'">'+data.players[i].nickname
				Nom += '</p>';
				// console.log (Nom);
				$(Nom).appendTo($("#game"))
				
				Score = '<p class="gain"';
				Score += ' style="'+'width: '+CarteVote.width+';left: '+Gauche+'; bottom: '+parseInt(5+CarteVote.bottom)+'"> +'+data.players[i].NbrPoints+' Pt(s)'
				Score += '<p>';
				$(Score).appendTo($("#game"))
				//fadeIn(100, function(){ $(this).appendTo($("#game");});
			}
			
			
			// affiche les votes sur la carte du joueurs 
			PosB = 1;
			PosL = 0;
			if (data.players[i].AVoterPourMoi.length != 0){
				for (let j in data.players[i].AVoterPourMoi){	
					if (data.players[i].AVoterPourMoi[j] === socket.id) { Class="Moi"}
						else {Class="PasMoi"}
					if (PosB > 3) {
						PosB = 1;
						PosL += 1;
					} 
					let basPion = PionVote.bottom-(PosB * (PionVote.height+10))
					let gauchePion = (PosL*(PionVote.width + 15))+Gauche+5 
					pPoinVote = '<p class="piondevote  '+Class;
					pPoinVote += '" style="'+'left:'+gauchePion+';bottom : '+basPion+'; width:'+PionVote.width+'; height:'+PionVote.height+';">'
					pPoinVote += '<span class="poinvote-text">';
					pPoinVote += String(data.players[data.players[i].AVoterPourMoi[j]].nickname).substring(0,3)
					pPoinVote += '</span>';
					pPoinVote += '.</p>';
					$(pPoinVote).appendTo($("#game"))
					
					// console.log (data.players[data.players[i].AVoterPourMoi[j]].nickname"->"pPointVote)
					PosB +=1;
				}
			}
				//Class: piondevote
			
			
		}
	}
	// envoie les point aux serveur 
}



// function ShowPion ()
// {
	
// }


function VoteUneCarte (id ) {
	Carte = $("#vote_"+id);
	 // if (PhaseDeJeux == 2 ) {
		if ( CVid === "" ) {
		//sauvegarde de la position
		CVpos = Carte.css("left");
		CVid = id;
		// console.log("Vote de la carte :" + id + " position : "+CVpos);
		Carte.animate({left: CarteVote.leftH, bottom: CarteVote.bottomH, height: CarteVote.heightH, width: CarteVote.widthH,zIndex: '10'}, 200);
		}  else if (CVid === id){
			Carte.animate({left: CVpos, bottom: CarteVote.bottom, height: CarteVote.height,width: CarteVote.width,zIndex: '9'}, 0);
			CVid ="";
			// console.log("Désélection de la carte :" + id);
		} else {
			// console.log("vous avez deja selectionné la carte :"+CVid+"!");
		}
	// } else {
		// console.log(" ce n'est pas le bon monent");
	// }
}


function UpdateMsgScore (data)
{
	if ( data.game.PhaseDeJeux === 3 ) {
		Conteneur = $("#msg_phase3_"+data.players[socket.id].role+" p");
		Conteneur.html('');
		for (let i in data.players){
			Nom = "<p>";
			// Nom += '<span style="font-size: x-large;">'+data.players[i].nickname+'</span>';
			Nom += '<span >'+data.players[i].nickname+'</span>';
			Nom += '<span> a obtenu '+data.players[i].NbrPoints+' point (s)</span>';
			Nom += '</p>';
			$(Nom).appendTo(Conteneur);
			//console.log (Nom)
		}
	}
	
}


function InitVoteEtPion (data) {
	if (PhaseDeJeux == 0) {	
		$(".carteV").each (function(){$(this).remove();});	
		$(".proprio").each (function(){$(this).remove(); });
		$(".piondevote").each (function(){$(this).remove();	});
		$(".gain").each (function(){$(this).remove();	});
		
		$("#msg_phase3_conteur").hide();
		$("#msg_phase3_joueur").hide();
		$("#SelectionPhase3").hide();
		CSid = "";
		CVid = "";

	}
}



function ShowGagnant (data) {
	HScore = 0;
	HName = "";
	for (let ID in data.players){
		if ( data.players[ID].score > HScore) {
			HScore = data.players[ID].score;
			HName = data.players[ID].nickname;
		}
	}
	$("#gagnantName").html(HName+" avec "+ HScore +" pts");
	
	// efface les cartes
	$(".carteM").each (function(){$(this).remove();});	
}