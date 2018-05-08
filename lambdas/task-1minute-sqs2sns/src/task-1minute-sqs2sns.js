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

const POLLING_TIME_IN_SECS = process.env.POLLING_TIME_IN_SECS || 3;
const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/472249637553/warm-tasks";

const Poller = require('./poller');

module.exports = {
  start(request, response, support){

    const { logger, sqs } = support;

    Poller.logger(logger);

    const shouldKeepRunning = () => {
      const remaining = request.getRemainingTimeInMillis();
      const pollingTime = POLLING_TIME_IN_SECS * 1000;

      return (remaining - pollingTime) > 2000;
    };

    const tryRun = (hnd) => {
      if( shouldKeepRunning() ){
        Poller.pollForMessages(sqs, QUEUE_URL, POLLING_TIME_IN_SECS).then(hnd);
      }
    };

    const msgHandler = (messages) => {
      if( messages.length > 0 ) {
        Promise.all(messages.map(msg => Poller.processMessage(sqs, msg)))
          .then(results => {
            logger.info(`Processed ${results.length} messages. Will keep running? ${shouldKeepRunning()}`);
            tryRun(msgHandler);
          })
          .catch(err => response.error(err));
      } else {
        tryRun(msgHandler);
      }
    };

    tryRun(msgHandler);

  }

};
