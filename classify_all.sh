#!/bin/bash
# Classifies on all .edf files in a folder
for filename in $1/*.edf; do
	python ./classify_epilepsy.py "$filename"
done
