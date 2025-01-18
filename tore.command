#!/bin/bash
pwd
cd $( dirname -- "$0"; )
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem -batch
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem
npm run --prefix vourer npmInstall
npm run --prefix vourer buildAll
npm run --prefix vourer runAll
npm run --prefix vourer openBrowser
echo "The book is opened..."
