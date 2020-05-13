
const glob = require("glob")
const imagesFolder = './public/images/cartes/';

let Paquet;
let Options = {cwd: './public/images/cartes/'};

glob("*.jpg", Options,  function (error, files) {
	if (error !== "null") {
		Paquet = files;
		// console.log ('Paquet de carte :');
		// console.log (typeof(Paquet));
		// console.log (Paquet);
		// console.log (Object.keys(Paquet).length);		
	} else {
		console.log ('Error :');
		console.log (error);
	}
});




// Codenames Game
class Game{
	
	constructor (){
		this.timerAmount = 61 // Default timer value
		this.tour;
		this.conteur;
		this.CartesUtilisees = [];
		this.CartesSelectionnes = [];
		this.Paquet = Paquet;
		this.NbrCarte = Object.keys(Paquet).length;
		this.PartieStart = false;
		this.PhaseDeJeux = 0;  //[0 || 1 || 2 || 3]
		this.ConteurId = "";
		this.NombredeJoueurs = 0;
		this.Winner = false;
		this.InitTour ();
		this.JeuxADeuxCartes = 4;
		// console.log (this.Paquet)
	}
	
	CreationMain (UnPlayer) {
		let ramdom;
		// Choisr une carte entre 1 et this.NbrCarte
		for (let i = 0; i < 6; i++ ){
			ramdom =  Math.floor((Math.random() * this.NbrCarte));
			// console.log ("ramdom="+ramdom);
			while (this.CartesUtilisees.includes(ramdom)) {
				ramdom =  Math.floor((Math.random() * this.NbrCarte))
			}
			this.CartesUtilisees.push(ramdom);
			UnPlayer.main.push(ramdom);
		}
		// console.log (this.CartesUtilisees);
		// console.log(UnPlayer);
	}
	
	CompleterMain (UnPlayer) {
		let ramdom
		for (let i = UnPlayer.main.length ; i < 6; i++ ){
			ramdom =  Math.floor((Math.random() * this.NbrCarte)+1);
			while (this.CartesUtilisees.includes(ramdom)) {
				ramdom =  Math.floor((Math.random() * this.NbrCarte)+1)
			}
			this.CartesUtilisees.push(ramdom);
			UnPlayer.main.push(ramdom);
		}
	}
	
	
	PhaseSuivante () {
		if (typeof this.PhaseDeJeux == 'undefined') {	
				this.PhaseDeJeux = 0; 
		} else if (this.PhaseDeJeux == 3) {
			this.PhaseDeJeux = 0;
		} else {
			this.PhaseDeJeux += 1;
		}
	}
	
	AddSelection (CarteId) {
		this.CartesSelectionnes.push(CarteId);
	}
	
	InitTour () {
		this.conteur = "";
		this.CartesSelectionnes = [];
		this.PartieStart = false;
	}
	
	InitGame () {
		this.conteur = "";
		this.CartesSelectionnes = [];
		this.PartieStart = false;
		this.CartesUtilisees = [];
		this.Winner = false;
	}
	
}


// Let the main nodejs server know this file exists
module.exports = Game;