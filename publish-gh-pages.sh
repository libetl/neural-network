#!/bin/bash
prettier --write *.html *.ts
git add .
git commit -m "prettier"
git push
deno bundle ui.ts | babel -f ui.js > ui.js
deno bundle network.ts | babel -f network.js > network.js
git branch -D gh-pages
git checkout --orphan gh-pages
git rm --cached -r .
git add index.html
git add -f ui.js
git add publish-gh-pages.sh
git commit -m "gh-pages"
git push -u origin gh-pages -f
git checkout -f master
