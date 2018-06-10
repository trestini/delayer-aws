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
const MESSAGE_BUFFER_SIZE = process.env.MESSAGE_BUFFER_SIZE || 10;
const EXEC_STARTED = new Date().getTime();

const Poller = require('./poller');

module.exports = {
  start(request, response, support){

    const { logger, sqs, sns } = support;
    Poller.logger(logger);

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
        if( bag.length >= MESSAGE_BUFFER_SIZE ){
          // logger.info(`Buffer full [${bag.length}], flushing...`);
          publishAndDelete(bag);
        } else {
          poller(bag);
        }
      } else {
        let processed = 0;
        if( buffer.length > 0 ){
          // no new messsages, flush the buffer
          publishAndDelete(buffer);
          processed = buffer.length;
        }
        // no new messages, shoud keep running?
        if( shouldKeepRunning(processed) ) poller([]);
      }
    }

    function publishAndDelete(messages){
      Promise.all(messages.map(msg => Poller.processMessage(sns, sqs, msg)))
      .then(results => {
        logger.info(`Processed ${results.length} messages. Will keep running? ${shouldKeepRunning(results.length)}`);
        if( shouldKeepRunning(results.length) ){
          poller([]);
        }
      })
      .catch(err => response.error(JSON.stringify(err)));
    }

    function messageBufferizer(messages, buffer){
      messages.forEach(i => buffer.push(i));
      return buffer;
    }

    function shouldKeepRunning(processed){
      const now = new Date().getTime();
      // logger.info(`Now: ${now}, EXEC_STARTED: ${EXEC_STARTED}`);

      if( Math.abs(now - EXEC_STARTED) < 60000 ){
        // i'm running for less then 1 minute
        // logger.info(`I'm running for ${(now - EXEC_STARTED) / 1000}s. keep walking`);
        return true;
      } else {
        // i'm running for more then 1 minute...
        const remaining = request.getRemainingTimeInMillis();
        logger.info(`${remaining / 1000}s to timeout, ${processed} messages processed`);
        const pollingTime = POLLING_TIME_IN_SECS * 1000;
        // ... and I have processed messages in last interaction
        return (Math.abs(remaining - pollingTime) > 2000) && (processed > 0);
      }

    }

  }

};
