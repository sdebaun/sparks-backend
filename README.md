# sparks-backend

Contains the node server that runs workers against the firebase queue

## Configuration

relies on env vars for specifying:

* `PORT` - what port to listen on for admin view
* `FIREBASE_HOST` - what fb host to connect to
* `FIREBASE_TOKEN` - the token to use to auth
* `DOMAIN` - The domain it'll be running under, ex. http://localhost
* `BT_ENVIRONMENT` - Braintree environment
* `BT_MERCHANT_ID`
* `BT_PRIVATE_KEY`
* `SENDGRID_KEY`

### Ignored Local Files

Any *.local.* files will be ignored, use that to safely name developer shortcuts for local servers and auth.

### Development Instances

Just set up a new firebase instance, and get the FIREBASE_HOST and FIREBASE_TOKEN that you need to connect to it.

## Architecture

A senecajs (http://senecajs.org/) application that is driven by Firebase Queue
(https://github.com/firebase/firebase-queue)

The flow looks something like this:

1. Frontend app wants to make a data change - it pushes a payload into the queue
2. Backend app gets the payload (see dispatch.js)
3. Constructs a seneca pattern from the payload that matches a task (see src/tasks)
4. Dispatches an Authorization message for the pattern (see src/auth)
5. If the auth message is accepted then dispatches the task
6. Task makes changes in Firebase database, frontend sees changes happen
7. Dispatcher writes task return data to the responses table in Firebase
8. Frontend can examine response to know change is complete
9. Rinse, repeat

## Contributions

1. Create a new branch
2. Add commits. Use semantic commit messages https://seesparkbox.com/foundry/semantic_commit_messages
3. When ready, squash your commits to as few possible
4. Create a pull request against the `release` branch
5. Let us know about it

### Automated Changelog / Developer Workflow

When working on a feature/fix you should be commiting your working early and often.
To help the rest of our non-technical team keep up with all the awesome work you have been doing we ask you to 
follow a few guidelines that allow us to generate a changelog that the non-developers among us can user to keep track of our work.

When working on a new feature/fix 

    1. Write your test(s) for your feature/fix 
    2. Stage your test file(s) using `git add ..`
    3. commit your tests using `npm run commit`
        - This will ask you a series of questions that will create a well formatted commit message that we can use to generate our changelog.
        - Use `test` as the 'type'
        - 'scope' is where the changes affect - filename is usually sufficient
        - follow the rest of the prompts
    4. Write your feature/fix to satisfy the test(s) you have written.
    5. Stage your feature/fix using `git add ..`
    6. commit your feature/fix use `npm run commmit`
        - Use `feature` or `fix` as the 'type'
        - 'scope' is where the changes affect - e.g. filename is usually sufficient
        - Please answer the questions thoroughly as they will read by others
    7. Submit a Pull Request for review!
    
For a much more thorough explanation of the commit message guide see [here](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#)
