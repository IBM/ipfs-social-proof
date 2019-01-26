# Establish an "IPFS identity" which is stored in IPFS and linked permanently via IPNS

## TODO: Keybase-like social proof and Identity for people and organizations

## UI ideas:

* This will have to be an electron app as it will really require an ipfs node runing alongside electron.
* Today it is just being developed in browser to make it simple to run and test
* The included UI in `public/index.html` is merely temporary, just a way to tinker with the `IpfsIdentity` class.
* The UI can construct the `IpfsIdentity` class after checking if there is already an account in the local database (LevelDB / IndexedDB) via the `checkForAccount` function.
* The `start` function will return the `IpfsIdentity` instance with:

`const ipid = await start('MyHandleName');`

## Initial thoughts

* Store IPFS id, exported private key, public key, etc in localStorage on device.
* Establish a Public JSON file with public key, image, petname, etc
* Use IPNS to create a permanent link to the IDENTITY json file
* Write public key, petname, bio, IPNS link to IDENTITY, etc to OrbitDB
* Add social proof to IDENTITY json file
* Post a signature of your public key to social media
* Record the links & signatures in IDENTITY json file
* Start with Twitter / Mastodon / Other posted link
* DNS TXT records?
* Allow for other users to VERIFY social proof via public key signature verification
* use PBKDF2 master password to store all private key material / secrets in IDB
* Use a BIP39? master password generator?

### More

* Authentication system a'la OAuth / SSO-type mechanism etc?
* Public, verifiable, web home page
* Secure storage of private key material / IDENTITY json data in hardware wallet?

### Plugins

## Registry of topics: "subreddits", need name here

### Subscribe to multiple "subs"

#### devise a posting auth / ident mechanism

* posts are merely JSON docs stored in IPFS, pinned and ipns name issued
* use CRDT to sync post hashes

### Embed Gists via <script> tag and Tweets via embed HTML for the Proofs to display inline on a user's profile

## Manual validation UI to paste proof data that cannot dynamically be fetched via a url / embed / script tag

## Channels

Each peer can establish channels and invite followers / followees to the channel. The Channel TOPIC is also an IPFS pinned / named path

* The peer creates a channel Identifier object that names the channel in human terms and is signed by the creator.
* This JSON doc is saved to IPFS and pinned, named, etc.
* Peers (perhaps only those that follow or are follwees) can be notified of owned 'channels'.
* A channel is merely a pubsub topic that can be used like a social/media feed, discussion "subject", etc.
* "Posts" to the "sub" are saved to IPFS, pinned, named, etc and passed on to the owner of the channel.
* Each post `IPFS path` is agregated via a pubsub append only log or some other kind of CRDT, etc. Orbit? Only the IPFS path is saved to these logs to minimize the amount of data that needs to be aggregated and sync'd.

## Credentials Synching

* PBKDF key is generated in order to wrap account data: mainly the private key and related primitives.
* The Account bundle is sent to a peer device to be decrypted and used as the same node on a different device.
* Look into shamir's secret sharding as well
