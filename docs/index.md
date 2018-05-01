# delayer-aws documentation

Simplistic cloud-native distributed scheduler, serverlessly built on top of AWS services

## Getting started

tl;dr

*   if using aws-cli, be sure that your [credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html)
are properly configured;
*   create a cloudformation stack with `examples/basic-cf-setup.yaml`

[TODO]
*   [ ] Provide instruction on how to build with cloudformation
*   [ ] Provide instruction on how to build with terrform?

## Architecture overview

The delayer-aws' core values are:

*   simplistic: set a point in time in the future and let delayer call an HTTP request or put message in a SQS queue in a reliable way for you
*   serverless: as a consequence of simplicity, there's no need to take care about servers

Check out [adr docs](adr/) for some architectural decisions.
