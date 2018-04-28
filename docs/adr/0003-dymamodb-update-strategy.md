# DynamoDB update strategy

*   Status: proposed
*   Proposers: trestini
*   Deciders:
*   Date: 2018-04-28

## Context and Problem Statement

In order to maintain the serverless nature of the project, a DynamoDB table was
chosen as main persistence mechanism, which means that a schedule is primarily
stored in DynamoDB and then distributed to other components, which in turn
goes back to DynamoDB to update state. So, DynamoDB holds both state and
historical data.

The problem here is that both *warmer* and *poller* will concur by Dynamo
resources and probably will be throttled (it's easy to reproduce this behavior
only by setting Dynamo's read and write capacity to 1 and trying to send some
hundreds of schedules while some other are moving from *WARM* state).

## Decision Drivers

*   Solution must kept as simple as possible
*   Even it could delay the problem, increase read and write capacity of
DynamoDB is not an architectural solution

## Considered Options

*   Use an event driven approach for updates
*   Use separated persistence stores for state and historical data
*   Don't use state as a field in database

## Decision Outcome

<!--
Chosen option: "[option 1]", because [justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force force | … | comes out best (see below)].

Positive Consequences:
* [e.g., improvement of quality attribute satisfaction, follow-up decisions required, …]

Negative consequences:
* [e.g., compromising quality attribute, follow-up decisions required, …]
-->

## Pros and Cons of the Options

### Use an event driven approach for updates

TODO

*   Good, because ...
*   Good, because ...
*   Bad, because ...

### Use separated persistence stores for state and historical data

TODO

*   Good, because ...
*   Good, because ...
*   Bad, because ...

### Don't use state as a field in database

The state of a schedule is noted by currentStatus/currentState attribute in
DynamoDB. The proposal of this optional is to treat state as part of the
general flow of application:

1.  When scheduled, it's COLD
1.  When *warmer* puts it on SQS, it's WARM
1.  When *poller* publishes it on SNS is DOING
1.  When *actions* execute

*   Good, simplified update policy
*   Good, reduced DynamoDB costs
*   Bad, no information about past events
