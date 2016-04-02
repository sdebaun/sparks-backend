# sparks-backend

contains the node server that runs workers against the firebase queue

## Configuration

relies on env vars for specifying:

* `PORT` - what port to listen on for admin view
* `FIREBASE_HOST` - what fb host to connect to
* `FIREBASE_TOKEN` - the token to use to auth

### Ignored Local Files

Any *.local.* files will be ignored, use that to safely name developer shortcuts for local servers and auth.

### Development Instances

Just set up a new firebase instance, and get the FIREBASE_HOST and FIREBASE_TOKEN that you need to connect to it.
