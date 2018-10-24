#! /usr/bin/env bash
npm install
cd ./client/ && npm install
cd ../ && ./run-client.sh
