set -e
set -x

npm ci
npm run lint:prettier
npm run lint:eslint
npx license-check --ignoreRegex root
npx better-npm-audit audit --exclude 1088447
