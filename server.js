var http = require('http');
var url = require('url');
var fs = require('fs');
var mongoClient = require('mongodb').MongoClient;

function urlIsValid(urlToTest) {
  if ((urlToTest.indexOf('http://') === 0 || urlToTest.indexOf('https://') === 0) && urlToTest.indexOf('.') !== -1) {
    return true;
  } else {
    return false;
  }
}

function next(last) {
  last = last.split('');
  last = incrementCode(last, last.length - 1);
  return last.join('');
}

function incrementCode(arr, index) {
  var digit = arr[index];
  digit = digit.charCodeAt(0);
  if ((digit > 47 && digit < 57) || (digit > 96 && digit < 122) || (digit > 64 && digit < 90)) {//0-8, a-y, A-Y
    arr[index] = String.fromCharCode(digit + 1);
  } else if (digit === 57) {//9
    arr[index] = String.fromCharCode(97);
  } else if (digit === 122) {//z
    arr[index] = String.fromCharCode(65);
  } else {//Z
    arr[index] = String.fromCharCode(48);
    if (index === 0) {
      arr.unshift('0');
      return arr;
    } else {
      incrementCode(arr, index - 1);
    }
  }
  return arr;
}

var mongoURI = process.env.MONGOLAB_URI ? process.env.MONGOLAB_URI : 'mongodb://' + process.env.IP + ':27017/data';

mongoClient.connect(mongoURI, function (err, db) {
  if (err) throw err;
  console.log('connected to mongoDB');
  var urlCodes = db.collection('urlCodes');
  var server = http.createServer(function (req, res) {
    var parsedUrl = url.parse(req.url);
    if (parsedUrl.pathname === '/') { //index.html at base directory
      fs.readFile('index.html', 'utf8', function (err, data) {
        if (err) throw err;
        data = data.replace(/<!--URL-->/g, 'https://' + req.headers.host + '/');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      });
    } else if (parsedUrl.pathname.indexOf('/new/') === 0) { //submitting a new url to shorten
      var json;
      var submittedUrl = parsedUrl.pathname.slice(5);
      if (urlIsValid(submittedUrl)) {
        urlCodes.find({original_url:submittedUrl}).toArray(function (err, doc) {
          if (err) throw err;
          if (doc.length !== 0) {//if url is already in collection return short code
            json = {'original_url': submittedUrl, 'short_url': 'https://' + req.headers.host + '/' + doc[0].shortCode};
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(json));
          } else {//make a new short code if it is not in the db
            urlCodes.findOne({$query: {}, $orderby: {$natural : -1}}, function (err, last) {
              if (err) throw err;
              var code;
              if (last === null) {
                code = '0';
              } else {
                code = next(last.shortCode);
              }
              json = {'original_url': submittedUrl, 'short_url': 'https://' + req.headers.host + '/' + code};
              console.log(json);
              console.log(code);
              urlCodes.insertOne({original_url: submittedUrl, shortCode: code}, function (err, doc) {
                if (err) throw err;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(json));
              });
            });
          }
        });
      } else {
        json = {'error':'URL invalid'};
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(json));
      }
    } else { //using a shortener code and expecting a redirect
      urlCodes.findOne({shortCode: parsedUrl.pathname.slice(1)}, function (err, doc) {
        if (err) throw err;
        res.writeHead(301, { 'Content-Type': 'text/plain', 'location': doc.original_url });
        res.end('redirecting');
      });
    }
  });
  
  var port = process.env.PORT || 3000;
  server.listen(port);
  console.log('server listening on port:' + port);
});