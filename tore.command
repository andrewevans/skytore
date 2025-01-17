#!/bin/bash
pwd
cd $( dirname -- "$0"; )
npm run --prefix vourer npmInstall
npm run --prefix vourer buildAll
npm run --prefix vourer runAll
npm run --prefix vourer openBrowser
echo "The book is opened..."
