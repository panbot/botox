#!/bin/bash

docker run \
    --rm \
    -ti \
    -v `pwd`/package.json:/botox/package.json \
    -v `pwd`/package-lock.json:/botox/package-lock.json \
    -v `pwd`:/botox/dev \
    --workdir /botox/dev \
    -e SHELL=/bin/bash \
    botox bash