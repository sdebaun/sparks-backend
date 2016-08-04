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