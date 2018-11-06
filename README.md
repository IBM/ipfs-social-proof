# ipfs-social-proof

Identity and social proof serverlessly via IPFS

Create an online identity peer 2 peer, generate proof(s) that can be validated by peers to verify your identity. No walled garden neccesary.

## Warning: `alpha` software with `alpha` dependencies

THIS IS VERY MUCH A Work In Progress

## Requirements

* js-ipfs (browser mode)
* node.js 10
* Chrome / Firefox

## First time install & launch client

* git clone / fork this repo
* copy  `src/example-auth.js` to `src/auth.js`
* edit the `githubToken` property to be a `READ-ONLY` personal GH token, see: [github tokens](https://github.com/settings/tokens)
* `npm run make`
* Subsequent runs:
* `npm run client`

## Build Bundle

* `npm run bundle`
* This will produce a bundle one can consume in a web/electron app at `bundle.js`

## Example client Identity DApp: `Autonomica`

### Identity management & peer discovery

![Alt Identity](client/screenshots/identity.png?raw=true "Identity")

* see [client/README.md](client/README.md) for more information

## Plan

* See [PLAN.md](PLAN.md) (preliminary plan & ideas scratchpad)

## Contributing

* see [CONTRIBUTING.md](CONTRIBUTING.md)
