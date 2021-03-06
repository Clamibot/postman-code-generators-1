
[![Build Status](https://travis-ci.com/postmanlabs/postman-code-generators.svg?branch=master)](https://travis-ci.com/postmanlabs/code-generators)

# postman-code-generators
Common codegen repo for the Postman app

## Getting Started
To get a copy on your local machine
```bash
$ git clone https://github.com/postmanlabs/code-generators.git
```
#### Prerequisites
To run any of the code-generators, ensure that you have NodeJS >= v8. A copy of the NodeJS installable can be downloaded from https://nodejs.org/en/download/package-manager.

#### Usage
* Remove the `.git` folder from each codegen.
* Place individual codegen inside `codegens` folder.

#### Installing dependencies
To install the dependencies of common repo as well as dependencies of all the individual codegens
```bash
$ npm install;
```
To install dependencies for all codegens run: 
```bash
$ npm run deepinstall dev; 
```
To run common repo test as well as tests (common structure test + individual codegen tests) for all the codegens
```bash
$ npm test; 
```
To run structure and individual tests on a single codegen
```bash
$ npm test <codegen-name>; 
```

To create zipped package of all codegens
```bash
$ npm run package;
```
**Note:** The zipped package is created inside each codegen's folder.

To create zipped package of a single codegen
```bash
$ npm run package <codegen-name>
```
