#!/bin/bash
if tmux ls | grep Ng
then
	# tmux has session call Ng; kill it
	tmux kill-session -t Ng
fi

tmux new-session -s Ng -d
# Name first window and start bash
tmux rename-window -t 0 "Ng-development"
tmux select-window -t Ng:0
# 3 Panes, two at top, one at bottom
tmux split-window -v
tmux select-pane -t 0
tmux split-window -h
# Resize to fewer lines
tmux resize-pane -t 2 -y 40


# Send keystrokes to panes
# backend
tmux select-pane -t 0
tmux send-keys 'cd $NG' C-m
tmux send-keys 'conda activate ng' C-m
tmux send-keys 'export FLASK_APP=backend.webserver' C-m
tmux send-keys 'export FLASK_ENV=development' C-m
tmux send-keys 'flask run' C-m
# frontend
tmux select-pane -t 1
tmux send-keys 'conda activate ng' C-m
tmux send-keys 'cd $NG/react' C-m 'npm start' C-m
# general
tmux select-pane -t 2
tmux send-keys 'cd $NG' C-m
tmux send-keys 'conda activate ng' C-m
tmux send-keys 'code ./backend' C-m
tmux send-keys 'code ./react' C-m

# Open session
tmux attach-session -t Ng
