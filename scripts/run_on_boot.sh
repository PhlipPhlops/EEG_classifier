#!/bin/bash
tmux new-session -s "Ng" -d

# Name first window and start bash
tmux rename-window -t 0 "Webserver"
tmux send-keys -t "Webserver" "start.bash" C-m "clear" C-m
tmux send-keys -t "Webserver" "cd $NG; conda activate mne; python -m backend.webserver" C-m
