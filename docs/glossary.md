# Glossary

Some common terms used on documentation and ADR.

## schedule

This is the main model of the *delayer-aws* system. The aim of the project is to provide a way to reliably delay executions for in the future, and the *schedule* is the model that hold all the information required to this.

## delayer queue

Refers to the SQS queue which will hold the delayed messages that will be ready to be executed by *Actions*. In the time where the message containing a schedule become visible in this sqs queue, the sqs2sns procedure will dispatch this schedule to the *action topic*, which will fire a lambda function to execute the proper action.

## layered concern

It's a way to keep each concern in it's own layer. Think that *delayer-aws* aims to provide a way to delay calls. Should not be a concern of the *delayer-aws* the historical data about the schedules that happened in the past. Nor even about the kind of data that is dealed inside of it's components. Those concerns should be resolved in another layer (dashboard "layer", analytics "layer", and so on).

Each layer must:
*   Have only the components and logic to resolve it's own problem;
*   Provide data in order to allow other layers to resolve theirs problems.
