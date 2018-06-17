/*
 * Copyright (c) 2018 delayer-aws (https://github.com/trestini/delayer-aws)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/
const lambda = require('./sns_action_lambda-call');
const logger = require('./support/logger');

const AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-east-1'
});

exports.handler = (event, context, callback) => {

  try {
    let handler = require('./support/sns-topic-request-handler');
    const request = handler.request(event, context);
    const response = handler.response(callback);
    const support = {
      logger: logger
    };

    try {
      lambda.start(request, response, support);
    } catch (e) {
      logger.error(`Unexpected error on lambda execution: ${JSON.stringify(e)}`);
      callback(e);
      return;
    }

  } catch (e) {
    logger.error(`Unexpected error on lambda execution setup: ${JSON.stringify(e)}`);
    callback(e);
    return;
  }

};
