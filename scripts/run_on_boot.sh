#!/bin/bash
# This is just the tmux wrapper around another boot script
tmux new-session -s "Ng" -d
# Name first window and start bash
tmux rename-window -t 0 "Webserver"
tmux send-keys -t "Webserver" "start.bash" C-m "clear" C-m
tmux send-keys -t "Webserver" "sh /home/ubuntu/Neurogram/scripts/boot_webserver.sh" C-m
