


// Express
let express = require('express')

// Creation de l'application
let app = express();

// Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
let  ent = require('ent'); 

//Set up server
//let server = app.listen(process.env.PORT || 2199,"127.0.0.1", listen);
let server = app.listen(process.env.PORT || 2199,"192.168.0.9", listen);


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
    this.score = 0;
	this.role = "joueur"; // role = ['joueur'|'conteur']
    this.timeout = 2100         // # of seconds until kicked for afk (35min)
    this.afktimer = this.timeout   
	// Liste de carte dans la main;
	this.main = [];
	// l'Id de la carte selectionner
	this.selection = "";
	// L'id de la carte qui recois le vote
	this.vote = "";
	this.IconAction = "no-action" //IconAction = ['no-action'|'action'|'done']
    // Add player to player list and add their socket to the socket list
    PLAYER_LIST[this.id] = this
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
	
	
	
	  // Client Disconnect
	socket.on('disconnect', () => {socketDisconnect(socket)})
	
	
});


// Disconnect function
// Called when a client closes the browser tab
function socketDisconnect(socket){
	let player = PLAYER_LIST[socket.id] // Get the player that made the request
	delete SOCKET_LIST[socket.id]       // Delete the client from the socket list
	delete PLAYER_LIST[socket.id]       // Delete the player from the player list
	// console.log('Got disconnect!');
	if(player){   // If the player was in a room
		delete ROOM_LIST[player.room].players[socket.id] // Remove the player from their room
		let message = player.nickname+" vient de quitter votre salle"
		gameUpdate(player.room , message)                // Update everyone in the room
		// Server Log
		logStats(socket.id + "(" + player.nickname + ") LEFT '" + ROOM_LIST[player.room].room + "'(" + Object.keys(ROOM_LIST[player.room].players).length + ")")
		// If the number of players in the room is 0 at this point, delete the room entirely
		if (Object.keys(ROOM_LIST[player.room].players).length === 0) {
			delete ROOM_LIST[player.room]
			logStats("DELETE ROOM: '" + player.room + "'")
		}
	}
	// Server Log
	logStats('DISCONNECT: ' + socket.id)
}



// Create room function
// Recupere  un nom de Salle et un mot de passe et tente de créer une nouvelle Salle s'il n'en existe pas
// Lors de la création, le client qui a créé la salle est créé et ajouté à la salle
function createRoom(socket, data){
	
	//Supprimer l'espace  de Room Password et nickname
  let roomName =  ent.encode (data.room) ;     
  let passName = ent.encode (data.password); 
  let pseudo = ent.encode (data.nickname);

  if (ROOM_LIST[roomName]) {   // If the requested room name is taken
    // Tell the client the room arleady exists
    socket.emit('joinResponse', {success:false, msg:'La salle existe déjà'})
  } else {
    if (roomName === "") {    
      // Tell the client they need a valid room name
      socket.emit('joinResponse', {success:false, msg:'Le non de salle est absent ou invalide'})
    } else {
      if (pseudo === ''){
        // Tell the client they need a valid nickname
        socket.emit('joinResponse', {success:false, msg:'Le Speudo est invalide'})
      } else {    // If the room name and nickname are both valid, proceed
        new Room(roomName, passName)                          // Create a new room
        let player = new Player(pseudo, roomName, socket)   // Create a new player
        ROOM_LIST[roomName].players[socket.id] = player       // Add player to room
		// Completer la main
		ROOM_LIST[roomName].game.CreationMain(ROOM_LIST[roomName].players[socket.id]);
        socket.emit('joinResponse', {success:true, msg: "Salle Créée"})// Tell client creation was successful
        gameUpdate(roomName,"Salle crée")                                  // Update the game for everyone in this room
        logStats(socket.id + "(" + player.nickname + ") A créé la salle  '" + ROOM_LIST[player.room].room + "'(" + Object.keys(ROOM_LIST[player.room].players).length + ")")
		// console.log (ROOM_LIST[roomName]);
      }
    }
  }
}

// Join room function
// Recupere  un nom de Salle et le mot de passe et tente de rejoindre la Salle s'il existe existe  et si il y a de la place
// 
function joinRoom(socket, data){
	// protéger les chaînes de caractères envoyer pas le joueur
	let roomName =  ent.encode (data.room) ;     
	let passName = ent.encode (data.password); 
	let pseudo = ent.encode (data.nickname);

	if (!ROOM_LIST[roomName]){
	// Tell client the room doesnt exist
	socket.emit('joinResponse', {success:false, msg:"le Salle "+roomName+" n'existe pas!"})
	} else if (ROOM_LIST[roomName].password !== passName){ 
		// Tell client the password is incorrect
		socket.emit('joinResponse', {success:false, msg:"Mot de passe incorrect"})
	} else if (pseudo === ''){
		// Tell client they need a valid nickname
		socket.emit('joinResponse', {success:false, msg:'Le Speudo est invalide'})
	} else if (PseudoExist (pseudo,ROOM_LIST[roomName].players)){
		// Tell client they need a valid nickname
		socket.emit('joinResponse', {success:false, msg:'Le Speudo '+ pseudo+' est deja utilisé'})
	} else {  // If the room exists and the password / nickname are valid, proceed
		//il faut trouver la place du joueur
		let player = new Player(pseudo, roomName, socket)   // Create a new player
		ROOM_LIST[roomName].players[socket.id] = player       // Add player to room
		// Completer la main
		ROOM_LIST[roomName].game.CreationMain(ROOM_LIST[roomName].players[socket.id]);
		socket.emit('joinResponse', {success:true, msg:""})   // Tell client join was successful
		let message = pseudo +" vient de se joindre à votre salle"
		gameUpdate(roomName,message)                                  // Update the game for everyone in this room
		// Server Log
		logStats(socket.id + "(" + player.nickname + ") JOINED '" + ROOM_LIST[player.room].room + "'(" + Object.keys(ROOM_LIST[player.room].players).length + ")")
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
	// console.log ("Selection de la carte : " +data.IdCarte);
	if (!PLAYER_LIST[socket.id]) return // Prevent Crash
	let room = PLAYER_LIST[socket.id].room  // Get the room the client was in
	// verifier que le conteur a selectioné
	let SelCounteur = (PLAYER_LIST[ROOM_LIST[room].game.ConteurId].selection !== "");
	//console.log ("SelCounteur: "+SelCounteur+" ; Player: "+socket.id + " ; ConteurId: "+ ROOM_LIST[room].game.ConteurId);
	if ( SelCounteur  || ROOM_LIST[room].game.ConteurId === socket.id){
		// Selectionne la carte
		PLAYER_LIST[socket.id].selection = data.IdCarte;
		// efface la carte de la liste
		var pos = PLAYER_LIST[socket.id].main.indexOf(data.IdCarte);
		PLAYER_LIST[socket.id].main.splice(pos, 1);
		// done sur l'IconAction
		PLAYER_LIST[socket.id].IconAction = "done";
		// GameUpdate
		gameUpdate (room,PLAYER_LIST[socket.id].nickname + " a choisi sa carte");
	} else {
		SOCKET_LIST[socket.id].emit('gameMessage',{emeteur:"serveur",msg:"Attendez que le conteur choissise sa carte !"});
	}
	// Verifier que toutes les carte ont été selectionner
	let FinPhaseUn = true;
		for (let Id in ROOM_LIST[room].players){
			if ( ROOM_LIST[room].players[Id].selection === "") {
				FinPhaseUn = false
			}
		}
	if (FinPhaseUn) {	
		ROOM_LIST[room].game.PhaseSuivante();
		gameUpdate (room,"Passons mintenant aux vote");
	}
}






function emitALL (methode,data,room)
{
	for (let player in ROOM_LIST[room].players){
		SOCKET_LIST[player].emit(methode,data);
	}
}



function PseudoExist (pseudo, playersList) {
	let exist = false;
	for (let i in playersList){
		if (playersList[i].nickname == pseudo){ exist = true;}
	}
	return exist;
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
    gameState.team = PLAYER_LIST[player].team  // Add specific clients team info
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



