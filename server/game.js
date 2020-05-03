


// Codenames Game
class Game{
	
	constructor (){
		this.timerAmount = 61 // Default timer value
		this.tour;
		this.conteur;
		this.CartesUtilisees = [];
		this.CartesSelectionnes = ['200','300','25'];
		this.NbrCarte = 526;
		this.PartieStart = false;
		this.PhaseDeJeux = 0; 
		this.ConteurId = "";
		// 0 non demarrer
		// 1 choix de la carte 
		// 2 vote
		// 3 Comptage de point  et completer les main
		this.InitTour ();
	}
	
	CreationMain (UnPlayer) {
		let ramdom;
		// Choisr une carte entre 1 et this.NbrCarte
		for (let i = 0; i < 6; i++ ){
			ramdom =  Math.floor((Math.random() * this.NbrCarte)+1);
			while (this.CartesUtilisees.includes(ramdom)) {
				ramdom =  Math.floor((Math.random() * this.NbrCarte)+1)
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
	
}


// Let the main nodejs server know this file exists
module.exports = Game;