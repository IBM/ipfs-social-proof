#! /usr/bin/env bash

./node_modules/.bin/http-server ./client/ -a 127.0.0.1 -p 8889 &
node ./client/start.js
