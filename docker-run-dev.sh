#!/bin/bash

docker run \
    --rm \
    -ti \
    -v `pwd`:/botox-dev \
    --workdir /botox-dev \
    botox bash