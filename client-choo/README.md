# Autonomica IPFS Social Proof - client app

Autonomica is a front-end app written with `Choo.js` & `Tachyons` in order to stay small and nimble

![Alt Identity](screenshots/identity.png?raw=true "Identity")

![Alt Proof](screenshots/proof.png?raw=true "Proof")

![Alt Peers](screenshots/peers.png?raw=true "Peers")

![Alt Log](screenshots/log.png?raw=true "Event Log")

## Goals

* Ui to help establish IPFS-driven identity
* Dissemination of `Identity Proofs` a'la Keybase
* e.g.: signed JSON posted to github, referenced via social media and DNS
* Exchange of public signing keys to verify proofs

## Install

`cd client/ && npm install`

`npm start`

Navigate to `http://127.0.0.1:8889/`

## Commands
Command                | Description                                      |
-----------------------|--------------------------------------------------|
`$ npm start`          | Start the development server
`$ npm test`           | Lint, validate deps & run tests
`$ npm run build`      | Compile all files into `dist/`
`$ npm run create`     | Generate a scaffold file
`$ npm run inspect`    | Inspect the bundle's dependencies

## Warning

* This is `alpha` software with `alpha` software as its `dependencies` & should be thought of as a proof of concept that needs a lot of work.
* PRs welcome, see CONTRIBUTING.md
