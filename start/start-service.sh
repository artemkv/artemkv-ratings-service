#!/bin/bash

cd /home/ubuntu/prod/ratings/artemkv-ratings-service/
NODE_IP=0.0.0.0 NODE_PORT=8333 PEER_URL=http://localhost:8334 forever start app.js