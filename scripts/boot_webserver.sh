#!/bin/bash
cd /home/ubuntu/Neurogram
if [ -f "/home/ubuntu/anaconda3/etc/profile.d/conda.sh" ]; then
    . "/home/ubuntu/anaconda3/etc/profile.d/conda.sh"
    CONDA_CHANGEPS1=false conda activate ng
fi
python -m backend.webserver
