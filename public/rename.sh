#!/bin/bash


old_IFS=$IFS
IFS=$'\n'
let cpt=1
for i in `ls images/cartes/*` 
do
	        echo $cpt" :  "$i
		let "cpt=$cpt+1"
done
		
IFS=$old_IFS
