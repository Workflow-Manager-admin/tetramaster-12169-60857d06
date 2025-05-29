#!/bin/bash
cd /home/kavia/workspace/code-generation/tetramaster-12169-60857d06/tetramaster_game
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

