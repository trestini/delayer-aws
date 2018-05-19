# Use of DynamoDB streams for *enqueuer*

*   Status: partially superseeds [ADR-0003]
*   Proposers: trestini
*   Deciders: 
*   Date: 2018-05-16

## Context and Problem Statement

The [ADR-0003] states that the main purpose of DynamoDB is not hold historical data and must only be used as state holder while the particular schedule is not ready to be in the delayer queue. However, the state will be changed from *NEW* to *PROCESSED* exactly when this schedule is posted in the delayer queue. This proposal aims change this behavior, removing the records that are already in delayer queue instead change it to *PROCESSED*.

## Decision Drivers

*   Cost: to be able to deal with thousands of schedules, the only way is to increase provisioned capacity of DynamoDB. Do it of hundreds of thousands, or even millions of records is acceptable, but not for few thousands.

## Considered Options

*   Move for a solution based on TTL and Dynamo Streams

## Pros and Cons of the Options

### Move for a solution based on TTL and Dynamo Streams

*   Good, increases performance and reduces cost
*   Bad, adds complexity and some not-so-obvious solutions

## Decision Outcome

(( to be taken, proof of concept in course ))

Positive Consequences:
*   

Negative consequences:
*   

## Links

*   Refers to [ADR-0003](0003-dymamodb-update-strategy.md)
