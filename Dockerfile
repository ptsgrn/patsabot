FROM dftechs/ubuntu-dev
WORKDIR patsabot
COPY package.json .
COPY src .
RUN [ "apt install -y --no-install-recommends nodejs npm && npm install" ]
CMD [ "node", "index.js" ]
