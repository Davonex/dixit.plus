# Dixit Plus
Adaptation du jeux de plateau DIXIT® pour jouer en ligne avec vos amis

## Fonctionnalitées
* Création d'une salle pour jouer entre amis ( Pseudo/Salle/Password)
* Sur l'ecran d'un joueur/conteur s'affiche 
  * la liste des joueurs avec le speudo, le rôle, le statut et le nombre de point.
  * Une aide de jeux en fonction de la phase de jeux et du rôle incarné par le joueur
  * Les illustrations  de la main du joueur
  * durant la phase de vote, toutes les cartes,dans un ordre aléatoire, que les joueurs ont selectionnés
* Si un joueur qui malencontreusement la salle, il peut se reconnecter à la salle en utilisant le même speudo. Il retrouve automatiquement tous ces points. /!\ seulement si les autres joueurs n'ont pas changé de phase de jeux !

## Installation 

* Installez [node.js](https://nodejs.org/, "lien Node.js") - j'ai developpé avec la version 12.16
* copiez les sources dans un répertoire 
* installez les package express grace à la command npm
```bash
npm init
npm install
```
* modifiez le listner dans le program `app.js`
```javascript
let server = app.listen(process.env.PORT || 8080,"127.0.0.1", listen);
```
* et enfin lancez l'application (verifiez le `path`)
```bash
node app.js
```
* Ouvrez votre navigateur favori (Firefox !)  et miracle
![Copie d'ecran](https://raw.githubusercontent.com/Davonex/dixit.plus/master/readme/Screen%20Shot.png)
