# codegen-nodejs-native

> Converts Postman-SDK Request into code snippet for NodeJS-native.


#### Prerequisites
To run the module, ensure that you have NodeJS >= v6. A copy of the NodeJS installable can be downloaded from https://nodejs.org/en/download/package-manager.


## Using the Module
The module will expose an object which will have property `convert` which is the function for converting the Postman-SDK request to nodejs-native code snippet.

### convert function
Convert function will take three parameters
* `request`- Postman-SDK Request object

* `options`- options is an object which can have following properties
    * `indentType`- string representing type of indentation for code snippet. eg: 'space', 'tab'
    * `indentCount`- positiveInteger representing count of indentation required.
    * `requestTimeout` : Integer denoting time after which the request will bail out in milli-seconds
    * `trimRequestBody` : Trim request body fields
    * `followRedirect` : Boolean denoting whether to redirect a request

* `callback`- callback function with first parameter as error and second parameter as string for code snippet

##### Example:
```js
var request = new sdk.Request('www.google.com'),  //using postman sdk to create request  
    options = {
        indentType: 'space',
        indentCount: 2
    };
convert(request, options, function(error, snippet) {
    if (error) {
        //  handle error
    }
    //  handle snippet
});
```

### Guideline for using generated snippet
* Generated snippet requires `http`, `querystring`, `follow-redirects` and `fs` modules.

* Since Postman-SDK Request object doesn't provide complete path of the file, it needs to be manually inserted in case of uploading a file.

* This module doesn't support cookies.
