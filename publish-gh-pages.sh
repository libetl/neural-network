#!/bin/bash
deno bundle network.ts | babel -f network.js > network.js
git branch -D gh-pages
git checkout --orphan gh-pages
git rm --cached -r .
git add index.html
git add -f network.js
git add publish-gh-pages.sh
git commit -m "gh-pages"
git push -u origin gh-pages -f
git checkout -f master
