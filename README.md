#url shortener microservice built on node.js
##this is built for a freecodecamp project
[freecodecamp](https://www.freecodecamp.com)

##project discription
creates shortened url codes that are stored in a mongoDB database and can be used to redirect to the longer urls. The responses are in JSON format. The index.html file, which is served at the root directory gives an explanation of how the service works and example outputs.

##server launch instructions
Make sure MongoDB is running and then from the console run:

    node server.js

Or on Heroku the Procfile should launch the server automatically

##dependencies
* node.js
* monogodb
* mongodb node driver
* uses built in node modules:
 * http
 * url
 * fs