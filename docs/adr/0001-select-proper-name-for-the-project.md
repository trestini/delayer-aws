# Select a proper name for the project

*   Status: proposed
*   Proposers: trestini
*   Deciders:
*   Date: 2018-04-27

## Context and Problem Statement

Even this is not essentially a technical decision, I believe that this "simple"
name probably will drive some other important decisions, like the creation of
terminologies, naming packages and other stuff, helping defining
functionalities, etc. According to [1] naming things figures out as one of the
hardest things in computer science. Apart of a joke, I believe that choose a
good name is a good success factor, but this is not a technical decision, which
can make things harder.

## Decision Drivers

*   Consider the serverless nature of the project
*   Consider the simplicity
*   Consider the vendor specific nature
*   Consider the fact that this could not be a scheduler

## Considered Options

*   scheduler-service
*   aws-scheduler
*   serverless-scheduler
*   aws-timemachine
*   delayer

## Decision Outcome

<!--
Chosen option: "[option 1]", because [justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force force | … | comes out best (see below)].

Positive Consequences:
* [e.g., improvement of quality attribute satisfaction, follow-up decisions required, …]

Negative consequences:
* [e.g., compromising quality attribute, follow-up decisions required, …]
-->

## Pros and Cons of the Options

### scheduler-service

This is the name originally chosen (the repository was created with this name).

*   Good, is simple and shows the main purpose of software
*   Bad, because is totally generic and doesn't reflects things that's should
makes it different from the other schedulers

## Links

*   [1]: [Two Hard Things](https://martinfowler.com/bliki/TwoHardThings.html) in computer science
