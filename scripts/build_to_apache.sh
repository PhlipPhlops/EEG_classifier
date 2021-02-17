#!/bin/bash
# Run this from Neuogram/react
cwd=$(pwd)
cd $HOME/Neurogram/react/
npm run build
sudo service apache2 stop
sudo cp /var/www/html/.htaccess build/
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/
sudo service apache2 start
cd $cwd
