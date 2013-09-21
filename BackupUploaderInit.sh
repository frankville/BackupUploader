#! /bin/sh
# /etc/init.d/BackupLoaderInit
#

# Some things that run always
echo "starting BackupLoaderInit"
forever start /home/frank/Documentos/HTML5/Paginas-HTML5/nodejsProjects/BackupUploader/BackupUploader.js

# Carry out specific functions when asked to by the system
case "$1" in
  stop)
    echo "Stopping BackupLoaderInit..."
    ;;
  *)
    echo "Usage: /etc/init.d/BackupLoaderInit {stop}"
    exit 1
    ;;
esac

exit 0