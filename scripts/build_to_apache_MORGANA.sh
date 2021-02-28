#!/bin/bash
# Run this from Neuogram/react
cwd=$(pwd)
cd $NG/react/
npm run build
sudo service httpd stop
sudo cp /var/www/html/.htaccess build/
sudo rm -rf /var/www/html/*
sudo cp -r build/* /var/www/html/
sudo service httpd start
cd $cwd
