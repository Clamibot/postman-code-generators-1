var expect = require('chai').expect,
  fs = require('fs'),
  sdk = require('postman-collection'),
  exec = require('shelljs').exec,
  newman = require('newman'),
  parallel = require('async').parallel,

  convert = require('../../lib/index').convert,
  mainCollection = require('../unit/fixtures/sample_collection.json');

// properties and headers to delete from newman reponse and cli response
const propertiesTodelete = ['cookies', 'headersSize', 'startedDateTime', 'clientIPAddress'],
  headersTodelete = [
    'accept-encoding',
    'content-type',
    'user-agent',
    'cf-ray',
    'x-request-id',
    'x-request-start',
    'x-real-ip',
    'connect-time',
    'x-forwarded-for',
    'content-length',
    'accept',
    'cookie',
    'kong-request-id',
    'total-route-time',
    'kong-cloud-request-id',
    'cache-control',
    'postman-token'
  ];

/**
 * Executes codesnippet and compares output with newman response
 *
 * @param {String} codeSnippet - code snippet from convert function
 * @param {Object} collection - sample collection
 * @param {Function} done - callback for async calls
 */
function runSnippet (codeSnippet, collection, done) {
  fs.writeFile('test/unit/fixtures/codesnippet.rb', codeSnippet, function (err) {
    if (err) {
      console.error(err);
      return;
    }
    parallel([
      function (callback) {
        exec('ruby test/unit/fixtures/codesnippet.rb', function (err, stdout, stderr) {
          if (err) {
            return callback(err);
          }
          if (stderr) {
            return callback(stderr);
          }

          try {
            stdout = JSON.parse(stdout);
          }
          catch (e) {
            console.error(e);
          }
          callback(null, stdout);
        });
      },
      function (callback) {
        newman.run({
          collection: collection
        }).on('request', function (err, summary) {
          if (err) {
            return callback(err);
          }

          var stdout = summary.response.stream.toString();

          try {
            stdout = JSON.parse(stdout);
          }
          catch (e) {
            console.error(e);
          }
          callback(null, stdout);
        });
      }
    ], function (err, result) {
      if (err) {
        expect.fail(null, null, err);
      }
      else if (typeof result[1] !== 'object' && typeof result[0] !== 'object') {
        expect(result[0].trim()).to.equal(result[1].trim());
      }
      else {
        if (result[0]) {
          propertiesTodelete.forEach(function (property) {
            delete result[0][property];
          });
          if (result[0].headers) {
            headersTodelete.forEach(function (property) {
              delete result[0].headers[property];
            });
          }
          if (result[0].url) {
            result[0].url = unescape(result[0].url);
          }
        }
        if (result[1]) {
          propertiesTodelete.forEach(function (property) {
            delete result[1][property];
          });
          if (result[1].headers) {
            headersTodelete.forEach(function (property) {
              delete result[1].headers[property];
            });
          }
          if (result[1].url) {
            result[1].url = unescape(result[1].url);
          }
        }
        expect(result[0]).deep.equal(result[1]);
      }
      done();
    });
  });
}

describe('Ruby converter', function () {
  mainCollection.item.forEach(function (item) {
    it(item.name, function (done) {
      var request = new sdk.Request(item.request),
        collection = {
          item: [
            {
              request: request.toJSON()
            }
          ]
        };
      convert(request, {indentType: 'space',
        indentCount: 4,
        requestTimeout: 1000,
        trimRequestBody: false,
        addCacheHeader: false,
        followRedirect: true}, function (err, snippet) {
        if (err) {
          console.error(err);
        }
        runSnippet(snippet, collection, done);
      });

    });
  });

  it('should throw an error when callback is not function', function () {
    expect(function () { convert({}, {}); })
      .to.throw('Ruby~convert: Callback is not a function');
  });

  it('should set read_timeout when requestTimeout is set to non zero value', function () {
    var request = new sdk.Request({
        'method': 'GET',
        'header': [],
        'url': {
          'raw': 'http://google.com',
          'protocol': 'http',
          'host': [
            'google',
            'com'
          ]
        }
      }),
      options = {requestTimeout: 3000};
    convert(request, options, function (error, snippet) {
      if (error) {
        expect.fail(null, null, error);
      }
      expect(snippet).to.be.a('string');
      expect(snippet).to.include('http.read_timeout = 3');
    });
  });

});
