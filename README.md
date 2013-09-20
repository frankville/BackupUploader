BackupUploader es un aplicacion hecha en nodejs que automatiza la generacion
de backups de una base de datos MySQL para después subir ese archivo a una 
cuenta de google drive. 

USO

El script BackupUploaderInit es el encargado de ejecutar el programa principal
al inicio del sistema (Debian). Solo hay que agregar el link simbolico para
 que pueda iniciar el script siempre que el sistema se inicie.

hay que ejecutar: 

root@skx:~# update-rc.d BackupUploaderInit defaults




Author: Francisco Villasanti
@FrankVillasanti
