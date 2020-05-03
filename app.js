


// Express
let express = require('express')

// Creation de l'application
let app = express();

// Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
let  ent = require('ent'); 

//Set up server
let server = app.listen(process.env.PORT || 2199,"192.168.0.14", listen);
//let server = app.listen(process.env.PORT || 2099,"192.168.0.9", listen);


// Callback pour confirmer que le server est start
function listen(){
  let host = server.address().address;
  let port = server.address().port;
  console.log('Dixit Server Started at http://' + host + ':' + port+'/');
}


// charger le fichier clientInformation

// Files for client
app.use(express.static('public'))

// Websocket
let io = require('socket.io')(server)


// DIXIT Game
const Game = require('./server/game.js')
const MaxJoueurs = 6; // Max par room
const MinJoueurs = 1; // Min par room

// object qui conserve les trace des sockets, Salle et joueurs.
let SOCKET_LIST = {}
let ROOM_LIST = {}
let PLAYER_LIST = {}

// Room class
// Live rooms will have a name and password and keep track of game options / players in room
class Room {
  constructor(name, pass){
    this.room = '' + name
    this.password = '' + pass
    this.players = {}
    this.game = new Game()

    // Add room to room list
    ROOM_LIST[this.room] = this
  }
}

// Player class
// When players log in, they give a nickname, have a socket and a room they're trying to connect to
class Player {
  constructor(nickname, room, socket){
    this.id = socket.id
	this.score = 0;
	this.role = "joueur"; // role = ['joueur'|'conteur']
	this.main = []; // Liste de carte dans la main;
	
	this.selection = ""; // l'Id de la carte selectionner
	
	this.vote = "";// L'id de la carte qui recois le vote
	
	this.statut = "on";  // ["on":"off"]
	
	this.QuiVotePourMoi = [];
	this.NbrPoints = 0;
	this.IconAction = "no-action" //IconAction = ['no-action'|'action'|'done'|'off']]
    // Add player to player list and add their socket to the socket list

    // If someone in the room has the same name, append (1) to their nickname
    let nameAvailable = false
    let nameExists = false;
    let tempName = nickname;
    // let counter = 0;

    while (!nameAvailable){
      if (ROOM_LIST[room]){
			nameExists = false;
			for (let i in ROOM_LIST[room].players){
			if (ROOM_LIST[room].players[i].nickname === tempName) nameExists = true
        }
        if (nameExists) tempName = nickname + "(" + ++counter + ")"
        else nameAvailable = true
      }
    }
    this.nickname = tempName
    this.room = room
   
    this.timeout = 2100         // # of seconds until kicked for afk (35min)
    this.afktimer = this.timeout   
	
    PLAYER_LIST[this.id] = this
  }
  
  InitTour (room) {
	if (JoueurOn(this.id))  
		this.IconAction = "no-action"
	this.NbrPoints = 0;
	ROOM_LIST[room].game.CompleterMain(this);
	this.role = "joueur";
	this.selection = "";
	this.vote = "";
	this.QuiVotePourMoi = [];
  }


}










// Gestion des connextion du server
//
//
io.sockets.on('connection', function(socket){
	
	// Message console sur les connections 
	SOCKET_LIST[socket.id] = socket;
	logStats('CONNECT: ' + socket.id);
	
	
	// Creation de la salle
	// Données : player nickname, room name, [ room password ]
	socket.on('createRoom', (data) => {createRoom(socket, data)})
	socket.on('joinRoom', (data) => {joinRoom(socket, data)})
	
	// Client demande un  sartGame
	socket.on('startGame', () => {ClickStartGame(socket)})
	// Client demande un conteur 
	socket.on('changeRole', (data) => {ClickChangeRole(socket,data)})
	// Client selection une carte
	socket.on ('carteSelectionne', (data) => {ClickcarteSelectionne(socket,data)})
	// Client vote pour une carte 
	socket.on ('carteVote', (data) => {ClickcarteVote(socket,data)})
	// Client Clique fin de tour
	socket.on ('finTour', () => {ClickfinTour(socket)})
	
	// Room Leaving. Called when client leaves a room
	// socket.on('leaveRoom', () =>{leaveRoom(socket)})
	  // Client Disconnect
	socket.on('disconnect', () => {socketDisconnect(socket)})
	
	
});


// Disconnect function
// Called when a client closes the browser tab
function socketDisconnect(socket){
	
	if (!PLAYER_LIST[socket.id]) return // Prevent Crash
	let room = PLAYER_LIST[socket.id].room  // Get the room the client was in
	PLAYER_LIST[socket.id].statut = "off";
	PLAYER_LIST[socket.id].IconAction = "off";
	// delete SOCKET_LIST[socket.id]       // Delete the client from the socket list
	// delete PLAYER_LIST[socket.id]       // Delete the player from the player list
	// console.log('Got disconnect!');
	// if(player){   // If the player was in a room
		// delete ROOM_LIST[player.room].players[socket.id] // Remove the player from their room
		// let message = player.nickname+" vient de quitter votre salle"
		// gameUpdate(player.room , message)                // Update everyone in the room
		// Server Log
		// logStats(socket.id + "(" + player.nickname + ") LEFT '" + ROOM_LIST[player.room].room + "'(" + Object.keys(ROOM_LIST[player.room].players).length + ")")
		// If the number of players in the room is 0 at this point, delete the room entirely
		// if (Object.keys(ROOM_LIST[player.room].players).length === 0) {
			// delete ROOM_LIST[player.room]
			// logStats("DELETE ROOM: '" + player.room + "'")
		// }
	// }
	// Server Log
	gameUpdate (room,PLAYER_LIST[socket.id].nickname + " a quitté le jeux");
	logStats('DISCONNECT: ' + PLAYER_LIST[socket.id].nickname)
}



// Create room function
// Recupere  un nom de Salle et un mot de passe et tente de créer une nouvelle Salle s'il n'en existe pas
// Lors de la création, le client qui a créé la salle est créé et ajouté à la salle
function createRoom(socket, data){
	
	//Supprimer l'espace  de Room Password et nickname
  let room =  ent.encode (data.room) ;     
  let passName = ent.encode (data.password); 
  let pseudo = ent.encode (data.nickname);

  if (ROOM_LIST[room]) {   // If the requested room name is taken
    // Tell the client the room arleady exists
    socket.emit('joinResponse', {success:false, msg:'La salle existe déjà'})
  } else {
    if (room === "") {    
      // Tell the client they need a valid room name
      socket.emit('joinResponse', {success:false, msg:'Le non de salle est absent ou invalide'})
    } else {
      if (pseudo === ''){
        // Tell the client they need a valid nickname
        socket.emit('joinResponse', {success:false, msg:'Le Speudo est invalide'})
      } else {    // If the room name and nickname are both valid, proceed
        new Room(room, passName)                          // Create a new room
        let player = new Player(pseudo, room, socket)   // Create a new player
        ROOM_LIST[room].players[socket.id] = player       // Add player to room
		// Completer la main
		ROOM_LIST[room].game.CreationMain(ROOM_LIST[room].players[socket.id]);
        socket.emit('joinResponse', {success:true, msg: "Salle Créée"})// Tell client creation was successful
        gameUpdate(room,"Salle crée")                                  // Update the game for everyone in this room
        logStats(socket.id + "(" + player.nickname + ") A créé la salle  '" + ROOM_LIST[player.room].room + "'(" + Object.keys(ROOM_LIST[player.room].players).length + ")")
		// console.log (ROOM_LIST[room]);
      }
    }
  }
}

// Join room function
// Recupere  un nom de Salle et le mot de passe et tente de rejoindre la Salle s'il existe existe  et si il y a de la place
// 
function joinRoom(socket, data){
	// protéger les chaînes de caractères envoyer pas le joueur
	let room =  ent.encode (data.room) ;     
	let passName = ent.encode (data.password); 
	let pseudo = ent.encode (data.nickname);

	if (!ROOM_LIST[room]){
	// Tell client the room doesnt exist
	socket.emit('joinResponse', {success:false, msg:"le Salle "+room+" n'existe pas!"})
	} else if (ROOM_LIST[room].password !== passName){ 
		// Tell client the password is incorrect
		socket.emit('joinResponse', {success:false, msg:"Mot de passe incorrect"})
	} else if (pseudo === ''){
		// Tell client they need a valid nickname
		socket.emit('joinResponse', {success:false, msg:'Le Speudo est invalide'})
	} else if (PseudoExist (pseudo,ROOM_LIST[room].players) !== -1){
		// Posibilité de rejoindre une room apre deconexion
		JoinRoomAgain (room,PseudoExist (pseudo,ROOM_LIST[room].players),socket)
	} else {  // If the room exists and the password / nickname are valid, proceed
		//il faut trouver la place du joueur
		let player = new Player(pseudo, room, socket)   // Create a new player
		ROOM_LIST[room].players[socket.id] = player       // Add player to room
		// Completer la main
		ROOM_LIST[room].game.CreationMain(ROOM_LIST[room].players[socket.id]);
		socket.emit('joinResponse', {success:true, msg:""})   // Tell client join was successful
		let message = pseudo +" vient de se joindre à votre salle"
		gameUpdate(room,message)                                  // Update the game for everyone in this room
		// Server Log
		logStats(socket.id + "(" + player.nickname + ") JOINED '" + ROOM_LIST[player.room].room + "'(" + Object.keys(ROOM_LIST[player.room].players).length + ")")
	}
}


function JoinRoomAgain (room, Oldid,socket)
{
	
	if (PLAYER_LIST[Oldid].statut === "off") {
		//socket.emit('joinResponse', {success:false, msg:'Le Speudo '+ pseudo+' est deja utilisé'})
		SwitchId (Oldid,socket.id,room)
		PLAYER_LIST[socket.id].statut = "on";
		if (PLAYER_LIST[socket.id].role === "conteur")
			ROOM_LIST[room].game.ConteurId = socket.id;
		SetIconAction (room,socket.id)
		socket.emit('joinResponse', {success:true, msg:""})   // Tell client join was successful
		let message = PLAYER_LIST[socket.id].nickname +" vient de rejoindre de nouveau la salle"
		gameUpdate(room,message)  
	} else {
		socket.emit('joinResponse', {success:false, msg:'Le Speudo est deja dans la room'})
	}
}

// Demande de démarrage du jeux
function ClickStartGame (socket) {
    let data;
	if (!PLAYER_LIST[socket.id]) return // Prevent Crash
	let room = PLAYER_LIST[socket.id].room  // Get the room the client was in
	// console.log (typeof(ROOM_LIST[room].players));
	let NbrJoueurs = 0;
	let conteur = 0;
	for (let Id in ROOM_LIST[room].players){
		NbrJoueurs +=1;
		if (ROOM_LIST[room].players[Id].role === "conteur") {
			conteur += 1;
		}
	}
	if ( NbrJoueurs < MinJoueurs ) {
		data = {
			emeteur:"Serveur",
			msg:"il n'y a pas assez de joueurs : "+NbrJoueurs+" Joueur(s)"
		};
		emitALL ('gameMessage',data,room);
	} else if( conteur !== 1) {
		data = {
			emeteur:"Serveur",
			msg:"Vous devez designer un CONTEUR"
		};
		emitALL ('gameMessage',data,room);
	} else { 
		// on peut démarrer le jeux
		for (let Id in ROOM_LIST[room].players){
			if (JoueurOn(Id))
				ROOM_LIST[room].players[Id].IconAction = "action";	
		}
		ROOM_LIST[room].game.PartieStart = true;
		ROOM_LIST[room].game.PhaseSuivante();
		gameUpdate (room,PLAYER_LIST[socket.id].nickname + " a été démarré la partie");
	}
	// for (let player in ROOM_LIST[room].players){
	// SOCKET_LIST[player].emit('gameMessage',{emeteur:"Serveur", msg:messageSend});}	
}

// Demande de changement de role 
function ClickChangeRole(socket,data) 
{
	// console.log ("Demande de changement de role");
	if (!PLAYER_LIST[socket.id]) return // Prevent Crash
	let room = PLAYER_LIST[socket.id].room  // Get the room the client was in
	let conteurName = "";
	if ( !ROOM_LIST[room].game.PartieStart ){
		for (let Id in ROOM_LIST[room].players){
			if (Id === data.Id) {
				ROOM_LIST[room].players[Id].role = "conteur";
				conteurName = ROOM_LIST[room].players[Id].nickname;
				ROOM_LIST[room].game.ConteurId = Id;
			} else {
				ROOM_LIST[room].players[Id].role = "joueur";
			}
		}
		gameUpdate (room,conteurName + " a été désigné comme conteur!");
	} else {
		// on ne change pas quand la partie est lancé
	}
	
	
}


// un joueur a selectionner une carte
function ClickcarteSelectionne(socket,data) {
	console.log ("Selection de la carte : " +data.IdCarte);
	if (!PLAYER_LIST[socket.id]) return // Prevent Crash
	let room = PLAYER_LIST[socket.id].room  // Get the room the client was in
	
	// verifier que le conteur a selectioné
	let SelCounteur = (PLAYER_LIST[ROOM_LIST[room].game.ConteurId].selection !== "");
	if ( SelCounteur  || ROOM_LIST[room].game.ConteurId === socket.id){
		// Selectionne la carte
		PLAYER_LIST[socket.id].selection = data.IdCarte;
		// efface la carte de la liste
		EffacerIndex (PLAYER_LIST[socket.id].main,data.IdCarte )
		
		//  l'IconAction = done
		PLAYER_LIST[socket.id].IconAction = "done";
		// Ajouter à la selection
		ROOM_LIST[room].game.AddSelection(data.IdCarte);
		// GameUpdate
		gameUpdate (room,PLAYER_LIST[socket.id].nickname + " a choisi sa carte");
	} else {
		// Le conteur n'a pas encore selectionne
		SOCKET_LIST[socket.id].emit('gameMessage',{emeteur:"serveur",msg:"Attendez que le conteur choissise sa carte !"});
	}
	// Verifier que toutes les carte ont été selectionner
	let FinPhaseUn = true;
		for (let Id in ROOM_LIST[room].players){
			if ( ROOM_LIST[room].players[Id].selection === "" && JoueurOn (Id)) {
				FinPhaseUn = false
			}
		}
	if (FinPhaseUn) {	
		ROOM_LIST[room].game.PhaseSuivante();
		// mettre les joueurs en IconAction = Action
		for (let Id in ROOM_LIST[room].players){
			if (ROOM_LIST[room].players[Id].role !== 'conteur' && JoueurOn (Id))
				ROOM_LIST[room].players[Id].IconAction = "action";	
		}
		gameUpdate (room,"Passons maintenant au vote");
	}
}


// Vote pour une carte
function ClickcarteVote(socket,data) {
	// console.log ("Selection de la carte : " +data.IdCarte);
	if (!PLAYER_LIST[socket.id]) return // Prevent Crash
	let room = PLAYER_LIST[socket.id].room  // Get the room the client was in

	// on ajouter dans vote
	PLAYER_LIST[socket.id].vote = data.IdCarte;
	//  l'IconAction = done
	PLAYER_LIST[socket.id].IconAction = "done";
	// GameUpdate
	gameUpdate (room,PLAYER_LIST[socket.id].nickname + " a choisi sa carte");
	// Verifier que toutes les carte ont été selectionner
	let FinPhaseDeux = true;
	for (let Id in ROOM_LIST[room].players){
		if ( ROOM_LIST[room].players[Id].vote === "" && ROOM_LIST[room].players[Id].role === "joueur") {
			FinPhaseDeux = false
		}
	}
	if (FinPhaseDeux) {	
		ROOM_LIST[room].game.PhaseSuivante();
		CalculScore(room);
		gameUpdate (room,"Calculons maintenant les resultats");
	}
}


function ClickfinTour(socket){
	if (!PLAYER_LIST[socket.id]) return // Prevent Crash
	let room = PLAYER_LIST[socket.id].room  // Get the room the client was in
	ROOM_LIST[room].game.PhaseSuivante();
	// Init Joueurs 
	Winner = false;
	for (let Id in ROOM_LIST[room].players) {
		ROOM_LIST[room].players[Id].InitTour(room)
		if (ROOM_LIST[room].players[Id].score >= 30 )
			Winner = true;
	}
	// Initialise les donnée
	ROOM_LIST[room].game.InitTour();
	gameUpdate (room,"On continue ?");
}








/******/
// Fonction Utile et privat

function JoueurOn (Id) {
	 return PLAYER_LIST[Id].statut === "on"; 
}

function CalculScore (room) 
{
		// On cherche a savoir  qui  a voté pour qui
	let NbrDeVotants = 0;
	let NbrVoteConteur = 0;
	let IdConteur = "";
	// Les points des joueurs
	for (let Id in ROOM_LIST[room].players){
		if (ROOM_LIST[room].players[Id].role == "joueur"){
			IdVotePour = AQui(room, ROOM_LIST[room].players[Id].vote);
			if (IdVotePour != "-1") {
				// donc on lui ajoute une voix
				ROOM_LIST[room].players[IdVotePour].QuiVotePourMoi.push(Id);
				// Si vote pour compteur +=1 point
				if (ROOM_LIST[room].players[IdVotePour].role == "conteur") {
					ROOM_LIST[room].players[Id].NbrPoints += 1;
					NbrVoteConteur +=1;
				} else {
					ROOM_LIST[room].players[IdVotePour].NbrPoints += 1;
				}
				NbrDeVotants +=1;
			}
		} else {
			IdConteur = Id;
		}	
	}
	// Les points du compteur
	if (NbrDeVotants == NbrVoteConteur || NbrVoteConteur == 0)
	{
		for (let Id in ROOM_LIST[room].players){
			if (ROOM_LIST[room].players[Id].role == "joueur"){
					ROOM_LIST[room].players[Id].NbrPoints += 2;
			}
		}
	} else {
		ROOM_LIST[room].players[IdConteur].NbrPoints += 3;
	}

	MAJDesScores(room);
}

function AQui (room, IdCard)
{
	let retour = "-1"
	for (let Id in ROOM_LIST[room].players){
		if (ROOM_LIST[room].players[Id].selection === IdCard) {
			retour = Id;
		} 
	}
	return retour;
}


function MAJDesScores(room)
{
	for (let Id in ROOM_LIST[room].players){
		ROOM_LIST[room].players[Id].score += ROOM_LIST[room].players[Id].NbrPoints;
		console.log (ROOM_LIST[room].players[Id].nickname+" Score="+ROOM_LIST[room].players[Id].score )
	}
}



function emitALL (methode,data,room)
{
	for (let player in ROOM_LIST[room].players){
		SOCKET_LIST[player].emit(methode,data);
	}
}



function PseudoExist (pseudo, playersList) {
	let exist = -1;
	for (let i in playersList){
		if (playersList[i].nickname == pseudo){ exist = i}
	}
	return exist;
}


function SwitchId (OldId, NewId,room) 
{	
	PLAYER_LIST[NewId] = PLAYER_LIST[OldId]
	ROOM_LIST[room].players[NewId] = PLAYER_LIST[OldId];
	ROOM_LIST[room].players[NewId].id = NewId;
	
	// Delete old playerId from the player list
	delete ROOM_LIST[room].players[OldId]
	delete PLAYER_LIST[OldId] 	
}

function SetIconAction (room,Id)
{
	Phase = ROOM_LIST[room].game.PhaseDeJeux;
	Player = PLAYER_LIST[Id]
	Player.IconAction = "no-action";
	if (Phase === 1){
		if (Player.selection === "" ) {
			Player.IconAction = "action";
		} else {
			Player.IconAction = "done";	
		} 
	} else if (Phase == 2 && PLAYER_LIST[Id].role === "joueur")	{
		if (Player.vote === "" ) {
			Player.IconAction = "action";
		} else {
			Player.IconAction = "done";	
		}
		
	}
	console.log (Phase);
	console.log (Player);
}


function EffacerIndex (Tableau, Index)
{
		let pos = -1;
		let i = 0;
		Tableau.forEach(function(item){
			if (item == Index ) pos = i;
			i += 1;	});	
		if (pos !== -1 ){
			Tableau.splice(pos, 1);	
		}
}





// Mettre à jour pour chaque client dans la salle (ROOM) qui est passé à cette fonction
function gameUpdate(room,message){
	  let gameState = {
		room: room,
		players:ROOM_LIST[room].players,
		game:ROOM_LIST[room].game,
		msg:message,
		emeteur:"serveur"
		};
	// console.log (gameState);

  // Create data package to send to the client
  for (let player in ROOM_LIST[room].players){ // For everyone in the passed room
    // gameState.team = PLAYER_LIST[player].team  // Add specific clients team info
    SOCKET_LIST[player].emit('gameState', gameState)  // Pass data to the client
  }
  
}





// Fonction  pour afficher les logs 
//
function logStats(addition){
  // let inLobby = Object.keys(SOCKET_LIST).length - Object.keys(PLAYER_LIST).length
  // let stats = '[R:' + Object.keys(ROOM_LIST).length + " P:" + Object.keys(PLAYER_LIST).length + " L:" + inLobby + "] "
  console.log(addition)
  // console.log(ROOM_LIST);
}



