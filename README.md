# ipfs-social-proof

Identity and social proof serverlessly via IPFS

Create an online identity peer 2 peer, generate proof(s) that can be validated by peers to verify your identity. No walled garden neccesary.

## Warning: `alpha` software with `alpha` dependencies

THIS IS VERY MUCH A Work In Progress

## Requirements

* js-ipfs (browser mode)
* node.js 10
* Chrome / Firefox

## Install

* git clone / fork this repo
* `npm install`

## Build Bundle

* `npm bundle`
* This will produce a bundle one can consume in a web/electron app at `bundle.js`

## Example client Identity DApp: `Autonomica`

### Identity management & peer discovery

![Alt Identity](client/screenshots/identity.png?raw=true "Identity")

#### Quickstart

* First time: build and run
* `npm run make`
* Subsequent runs:
* `npm run client`

* see `client/README.md` for morr information

## Plan

* See PLAN.md (preliminary plan - may be outdated)

## Contributing

* see CONTRIBUTING.md
