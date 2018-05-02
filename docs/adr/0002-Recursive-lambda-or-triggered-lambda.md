# Recursive lambda or CloudWatch-triggered lambda

*   Status: proposed
*   Proposers: trestini
*   Deciders:
*   Date: 2018-04-28

## Context and Problem Statement

In the WARM stage, messages become visible in SQS queue after delayed period.
However, those messages must be published in corresponding *action topic*, and
it cannot be done automatically, being needed to use a lambda function to do
this publishing.

## Decision Drivers

*   This project is a scheduler, so the latency is an important concern
*   Flexibility: ability to be good enough in high or low concurrent executions

## Considered Options

*   Recursive lambdas
*   CloudWatch-triggered lambda

## Decision Outcome

<!--
Chosen option: "[option 1]", because [justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force force | … | comes out best (see below)].

Positive Consequences:
* [e.g., improvement of quality attribute satisfaction, follow-up decisions required, …]

Negative consequences:
* [e.g., compromising quality attribute, follow-up decisions required, …]

-->

## Pros and Cons of the Options

### Recursive lambdas

In this case, lambdas do their jobs and at the end, they call recursivelly the
same function.

*   Good, by the simplicity
*   Bad, an error could stop the chain of calls
*   Bad, can introduce latency

### CloudWatch-triggered lambdas

In this case, each lambda keep doing their jobs until some time before their
configured timeouts while CloudWatch triggers new executions in some intervals.

*   Good, provide reduced latency due to concurrency capability of lambdas
*   Bad, complicated.

## Links

*   https://github.com/serverless/examples/blob/master/aws-node-recursive-function/handler.js
*   https://theburningmonk.com/2017/08/write-recursive-aws-lambda-functions-the-right-way/
