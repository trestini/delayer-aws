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

let POLLING_TIME_IN_SECS = process.env.POLLING_TIME_IN_SECS || 3;

const Poller = require('./poller');

let bag = [];
let count = 0;

module.exports = {
  start(request, response, support){

    const { logger, sqs, sns } = support;
    Poller.logger(logger);

    const shouldKeepRunning = () => {
      const remaining = request.getRemainingTimeInMillis();
      const pollingTime = POLLING_TIME_IN_SECS * 1000;

      return Math.abs(remaining - pollingTime) > 2000;
    };

    const tryRun = (hnd) => {
      if( shouldKeepRunning() ){
        Poller.pollForMessages(sqs, POLLING_TIME_IN_SECS)
          .then(hnd)
          .catch(error => {
            const errorMsg = `Poll for message failed: ${JSON.stringify(error)}`;
            logger.error(errorMsg);
            response.error(errorMsg);
          });
      }
    };

    const msgHandler = (messages) => {
      logger.info(`Handling ${messages.length} messages`);
      if( messages.length > 0 ) {
        POLLING_TIME_IN_SECS = 0.5;

        messages.forEach(m => {
          bag.push(m);
          count++;
        });

        logger.info(`Count: ${count}`);

        if( count >= 50 ){
          count = 0;
          logger.info("Flushing...");

          Promise.all(bag.map(msg => Poller.processMessage(sns, sqs, msg)))
          .then(results => {
            logger.info(`Processed ${results.length} messages. Will keep running? ${shouldKeepRunning()}`);
            bag = [];
            // tryRun(msgHandler);
          })
          .catch(err => response.error(err));
        }
      } else {
        if( count > 0 ){
          count = 0;
          logger.info("Flushing no messages...");

          Promise.all(bag.map(msg => Poller.processMessage(sns, sqs, msg)))
          .then(results => {
            logger.info(`Processed ${results.length} messages. Will keep running? ${shouldKeepRunning()}`);
            bag = [];
            // tryRun(msgHandler);
          })
          .catch(err => response.error(err));
        }

        POLLING_TIME_IN_SECS = 3;
      }

      tryRun(msgHandler);
    };

    tryRun(msgHandler);
    tryRun(msgHandler);
    tryRun(msgHandler);
    tryRun(msgHandler);
    tryRun(msgHandler);

  }

};


