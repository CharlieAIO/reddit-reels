#!/bin/bash

if [ -z "$1" ]; then
  exit 1
fi

cp "$1" /usr/share/fonts/truetype/
fc-cache -f -v

echo "Font installed successfully!"
