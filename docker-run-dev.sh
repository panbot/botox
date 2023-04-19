#!/bin/bash

docker run \
    --rm \
    -ti \
    -v `pwd`:/botox-dev \
    --workdir /botox-dev \
    -p 9000:80 \
    botox bash