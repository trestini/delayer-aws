# lambda functions guideline

Lambda functions are the codebase of `delayer-aws`, and the main way of interaction between aws components. It's very important that these functions respects some guidelines.

## Scope

The most fundamental concept about serverless functions is the scope. It's not a coincidence that Amazon calls it lambda **functions**, or even GCP calls it **functions**. This is because a lambda must have the scope of a function (or a method in a OOP language). A function is not a [micro]service, nor a module, is even less a system. Just for comparison (and this approach is used here), if our API have 2 methods for a particular resource, we sould have 2 lambdas, one for each method.

## Naming convention

Function name should be composed by these parts:

*   Type of source: type of system that initiates the lambda processing.
*   Sub classify: some sort of classification related to the type of source.
*   Name: the proper name of the function, which should be related with what the function itself does.

For API related functions, the name should have the following template:

`api`-`resource`-`method`

Examples:
*   api-schedule-post
*   api-schedule-delete

For CloudWatch tasks related functions, the pattern should be:

`task`-`frequency`-`name`

Examples:
*   task-hourly-cleanup-schedules
*   task-1minute-warmer

For SNS topic functions, the pattern should be:

`sns`-`type`-`name`

Where `type` must be:
*   `action` for delayer action invokers
*   `event` for event processors

Examples:
*   sns-action-httpinvoker
*   sns-action-sqssender
*   sns-event-kinesis-stream

## File structure

Assuming `task-1minute-warmer` as the name of the example lambda, below the file structure 

```
task-1minute-warmer/
  src/
    index.js
    task-1minute-warmer.js
    support/
      logger.js
      api-gateway-request-handler.js
      sns-topic-request-handler.js
  test/
```

Except for `task-1minute-warmer.js` file, all other files are provided (for now, in a copy/paste basis).

## Architecture

![Lambda execution sequence](https://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgTGFtYmRhIGV4ZWN1dGlvbiBzZXF1ZW5jZQoKABUGLUNvbnRhaW5lci0-K2luZGV4LmpzOiBDYWxsIGhhbmRsZXIgKAASBgAIBykKAB8ILT4AJgtoZWNrIGV2ZW50IHR5cGUAGgsrYXBpLWdhdGV3YXktcmVxdWVzdC0AVQcAaAVwcmVwYXJlIAAVBwoAEh4tLT4tAIEgCQBbDGxvZ2cASwdzZXR1cCBsb2dzCgANCQAgGACBawoAMAZBV1MgZGVwZW5kZW5jaWVzAFYNAIIuBmZ1bmN0aW9uAGYGdGFydCgAgVEHLCByZXNwb25zZSwgc3VwcG9ydCkKACQSAIEtFy0-LQCDBhA6&s=default)

The concept behind this sequence is to separate function code from infrastructure code. There's a thin line between them, but there's some helpful tips:

*   `index.js` is the handler of Lambda container, and should take care of instantiation of basic objects (request, response, support). AWS resources should be instantiated here and be put in `support` object;
*   `simple-request-handler.js` is the simplest request/response handler. It only concentrates `event` and `context` objects into `request`, and provides a way to finish responses with `ok` or `error`. Is used by lambdas that are triggered by Cloudwatch events.
*   `api-gateway-request-handler.js` is responsible by handle requests from AWS API Gateway when the function is configured as *Lambda Proxy Integration* in API endpoint Integration Request configuration.
*   `sns-topic-request-handler.js` prepares the request when it comes as an event from a message published in a SNS topic
*   `logger.js` fancy and clean console.log wrapper. 

---

## References

*   [The silece of the Lambdas – 5 Anti-patterns for AWS Lambda](https://www.3pillarglobal.com/insights/silence-lambdas-5-anti-patterns-aws-lambda)
*   [Best Practices for Working with AWS Lambda Functions](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
*   www.websequenciediagrams.com source of the architecture diagram
```
title Lambda execution sequence

Lambda-Container->+index.js: Call handler (index.handler)
index.js->index.js: Check event type
index.js->+api-gateway-request-handler.js: prepare request and response objects
api-gateway-request-handler.js-->-index.js:
index.js->+logger.js: setup logs
logger.js-->-index.js:
index.js->index.js: setup AWS dependencies
index.js->+task-minute-warmer.js: start(request, response, support)
task-minute-warmer.js->task-minute-warmer.js: do cool stuff
task-minute-warmer.js-->-index.js: error and response handling
index.js-->-Lambda-Container: callback()
```
