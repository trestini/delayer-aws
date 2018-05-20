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

module.exports = {
  start(request, response, support){

    const { logger, sqs, sns } = support;
    Poller.logger(logger);

    poller([]);
    poller([]);
    poller([]);
    poller([]);
    poller([]);

    function poller(buffer){
      // logger.info(`Buffer size: ${buffer.length}`);
      Poller.pollForMessages(sqs, POLLING_TIME_IN_SECS)
      .then(msgs => handler(msgs, buffer))
      .catch(error => {
        const errorMsg = `Poll for message failed: ${JSON.stringify(error)}`;
        logger.error(errorMsg);
        response.error(errorMsg);
      });
    }

    function handler(messages, buffer){
      if( messages.length > 0 ){
        // logger.info(`Handling ${messages.length} messages`);
        const bag = messageBufferizer(messages, buffer);
        if( bag.length >= 50 ){
          // logger.info(`Buffer full [${bag.length}], flushing...`);
          publishAndDelete(bag);
        } else {
          poller(bag);
        }
      } else {
        if( buffer.length > 0 ){
          publishAndDelete(buffer);
        }
      }
    }

    function publishAndDelete(messages){
      Promise.all(messages.map(msg => Poller.processMessage(sns, sqs, msg)))
      .then(results => {
        logger.info(`Processed ${results.length} messages. Will keep running? ${shouldKeepRunning()}`);
        if( shouldKeepRunning() ){
          poller([]);
        }
      })
      .catch(err => response.error(err));
    }

    function messageBufferizer(messages, buffer){
      messages.forEach(i => buffer.push(i));
      return buffer;
    }

    function shouldKeepRunning(){
      const remaining = request.getRemainingTimeInMillis();
      const pollingTime = POLLING_TIME_IN_SECS * 1000;
      return Math.abs(remaining - pollingTime) > 2000;
    }

  }

};
