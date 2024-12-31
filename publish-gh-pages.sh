#!/bin/bash
prettier --write *.html *.ts
git add .
git commit -m "prettier"
git push
esbuild --bundle network.ts > network.js
esbuild --bundle ui.ts > ui.js
esbuild --bundle index.ts > index.js
git branch -D gh-pages
git checkout --orphan gh-pages
git rm --cached -r .
git add index.html
git add -f ui.js
git add publish-gh-pages.sh
git commit -m "gh-pages"
git push -u origin gh-pages -f
git checkout -f master
