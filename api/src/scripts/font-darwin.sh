#!/bin/bash

if [ -z "$1" ]; then
  exit 1
fi

sudo cp "$1" ~/Library/Fonts/
echo "Font installed successfully!"
