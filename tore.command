#!/bin/bash
pwd
cd $( dirname -- "$0"; )
npm run --prefix vourer npmInstall
npm run --prefix vourer myweb
npm run --prefix vourer myapp
open -a 'google chrome' http://localhost &
echo "The book is opened..."
