FROM node:18
ENV LANG C.UTF-8
ADD docker/.bashrc /root/.bashrc

WORKDIR /botox
ADD package*.json /botox/
RUN npm i --no-audit
