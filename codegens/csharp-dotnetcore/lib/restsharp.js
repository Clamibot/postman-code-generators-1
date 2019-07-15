var _ = require('./lodash'),

  parseRequest = require('./parseRequest'),
  sanitize = require('./util').sanitize,
  sanitizeOptions = require('./util').sanitizeOptions,
  self;

/**
 * Generates snippet in csharp-restsharp by parsing data from Postman-SDK request object
 *
 * @param {Object} request - Postman SDK request object
 * @param {Object} options - Options to tweak code snippet
 * @returns {String} csharp-restsharp code snippet for given request object
 */
function makeSnippet (request, options) {
  const UNSUPPORTED_METHODS_LIKE_POST = ['LINK', 'UNLINK', 'LOCK', 'PROPFIND'],
    UNSUPPORTED_METHODS_LIKE_GET = ['PURGE', 'UNLOCK', 'VIEW', 'COPY'];

  var snippet = 'HttpClient client = new HttpClient();\n';
  var isUnSupportedMethod = UNSUPPORTED_METHODS_LIKE_GET.includes(request.method) || UNSUPPORTED_METHODS_LIKE_POST.includes(request.method);
  if (options.requestTimeout > 0) {
    snippet += `client.Timeout = TimeSpan.FromMilliseconds(${options.requestTimeout});\n`;//Postman uses milliseconds as the base unit for request timeout time.
  }
  else if (options.requestTimeout == 0){
    snippet += 'client.Timeout = Timeout.InfiniteTimeSpan;\n';//A value of 0 as the request timeout indicates wait forever in Postman
  }
  /* TODO: Translate following redirects
  if (!options.followRedirect) {
    snippet += 'client.FollowRedirects = false;\n';
  }
  */
  snippet += `var request = new RestRequest(${isUnSupportedMethod ? '' : ('Method.' + request.method)});\n`;
  snippet += parseRequest.parseHeader(request.toJSON(), options.trimRequestBody);
  snippet += parseRequest.parseBody(request, options.trimRequestBody);
  if (isUnSupportedMethod) {
    (UNSUPPORTED_METHODS_LIKE_GET.includes(request.method)) &&
            (snippet += `var stringTask = client.GetStringAsync("${sanitize(request.url.toString())}");\n`);
    (UNSUPPORTED_METHODS_LIKE_POST.includes(request.method)) &&
            (snippet += `var stringTask = client.PostAsync("${sanitize(request.url.toString())}, new StringContent(${JSON.stringify(requestBody[requestBody.mode])}, Encoding.UTF8, ${parseContentType(request)})");\n`);
  }
  else {
    //We need a switch statement here that determines which method call we paste. there is a different method call for each request type.
    switch (requestBody.mode)
    {
      case 'GET':
          snippet += `string response = client.GetStringAsync("${sanitize(request.url.toString())}");\n`;
          break;
      case 'POST':
          snippet += `HttpResponseMessage response = client.PostAsync("${sanitize(request.url.toString())}, new StringContent(${JSON.stringify(requestBody[requestBody.mode])}, Encoding.UTF8, ${parseContentType(request)})");\n`;
          break;
      case 'PUT':
          snippet += `HttpResponseMessage response = client.PutAsync("${sanitize(request.url.toString())}, new StringContent(${JSON.stringify(requestBody[requestBody.mode])}, Encoding.UTF8, ${parseContentType(request)})");\n`;
          break;
      case 'DELETE':
          snippet += `HttpResponseMessage response = client.DeleteAsync("${sanitize(request.url.toString())}");\n`;
          break;
    }
  }
  snippet += 'Console.WriteLine(response.ToString());';//Does nothing if response is already a string. If response is an HttpResponseMessage, response is converted to a string.

  return snippet;
}

self = module.exports = {
  /**
     * Used in order to get additional options for generation of C# code snippet (i.e. Include Boilerplate code)
     *
     * @module getOptions
     *
     * @returns {Array} Additional options specific to generation of csharp-restsharp code snippet
     */
  getOptions: function () {
    return [
      {
        name: 'Include boilerplate',
        id: 'includeBoilerplate',
        type: 'boolean',
        default: false,
        description: 'Include class definition and import statements in snippet'
      },
      {
        name: 'Indent count',
        id: 'indentCount',
        type: 'positiveInteger',
        default: 2,
        description: 'Number of indentation characters to add per code level'
      },
      {
        name: 'Indent type',
        id: 'indentType',
        type: 'enum',
        availableOptions: ['tab', 'space'],
        default: 'space',
        description: 'Character used for indentation'
      },
      {
        name: 'Request timeout',
        id: 'requestTimeout',
        type: 'positiveInteger',
        default: 0,
        description: 'How long the request should wait for a response before timing out (milliseconds)'
      },
      {
        name: 'Follow redirect',
        id: 'followRedirect',
        type: 'boolean',
        default: true,
        description: 'Automatically follow HTTP redirects'
      },
      {
        name: 'Body trim',
        id: 'trimRequestBody',
        type: 'boolean',
        default: true,
        description: 'Trim request body fields'
      }
    ];
  },

  /**
     * Converts Postman sdk request object to csharp-restsharp code snippet
     *
     * @module convert
     *
     * @param {Object} request - Postman-SDK request object
     * @param {Object} options - Options to tweak code snippet generated in C#
     * @param {String} options.indentType - type for indentation eg: space, tab (default: space)
     * @param {String} options.indentCount - number of spaces or tabs for indentation. (default: 4 for indentType:
                                                                         space, default: 1 for indentType: tab)
     * @param {Boolean} [options.includeBoilerplate] - indicates whether to include class defination in C#
     * @param {Boolean} options.followRedirect - whether to enable followredirect
     * @param {Boolean} options.trimRequestBody - whether to trim fields in request body or not (default: false)
     * @param {Number} options.requestTimeout - time in milli-seconds after which request will bail out
                                                     (default: 0 -> never bail out)
     * @param {Function} callback - Callback function with parameters (error, snippet)
     * @returns {String} Generated C# snippet via callback
     */
  convert: function (request, options, callback) {

    if (!_.isFunction(callback)) {
      throw new Error('C#-RestSharp-Converter: Callback is not valid function');
    }

    //  String representing value of indentation required
    var indentString,

      //  snippets to include C# class definition according to options
      headerSnippet = '',
      footerSnippet = '',

      //  snippet to create request in csharp-restsharp
      snippet = '';

    options = sanitizeOptions(options, self.getOptions());

    indentString = options.indentType === 'tab' ? '\t' : ' ';
    indentString = indentString.repeat(options.indentCount);

    if (options.includeBoilerplate) {
      headerSnippet = 'using System;\n' +
                            'using RestSharp;\n' +
                            'namespace HelloWorldApplication {\n' +
                            indentString + 'class HelloWorld {\n' +
                            indentString.repeat(2) + 'static void Main(string[] args) {\n';
      footerSnippet = indentString.repeat(2) + '}\n' + indentString + '}\n}\n';
    }

    snippet = makeSnippet(request, options);

    //  if boilerplate is included then two more indentString needs to be added in snippet
    (options.includeBoilerplate) &&
        (snippet = indentString.repeat(3) + snippet.split('\n').join('\n' + indentString.repeat(3)) + '\n');

    return callback(null, headerSnippet + snippet + footerSnippet);
  }
};
