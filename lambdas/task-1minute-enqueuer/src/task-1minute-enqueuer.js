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

const moment = require('moment');
let logger;

const Enqueuer = require('./enqueuer');
const Timeframe = require('./timeframe');

module.exports = {
  start(request, response, support){

    const { sqs, dynamoDb } = support;
    logger = support.logger;
    Enqueuer.logger(logger);

    const now = moment.utc();
    const fromNow14mins = moment.utc().add(14,'m');

    const timeframes = {
      ini: Timeframe.fromTimestamp(now),
      end: Timeframe.fromTimestamp(fromNow14mins)
    };

    Promise.all([
      Timeframe.getSchedules(dynamoDb, timeframes.ini),
      Timeframe.getSchedules(dynamoDb, timeframes.end)
    ])
      .then(queries => {

        let items = queries[0].Items;
        Array.prototype.push.apply(items, queries[1].Items);

        items.filter(item => {

          logger.info(`item.currentStatus: ${item.currentStatus}, item.pointInTime: ${item.pointInTime}, now is: ${now.unix()}, > now? ${item.pointInTime > now.unix()}, < 14mins? ${item.pointInTime < fromNow14mins.unix()}`);

          return item.currentStatus === 'NEW'
            && item.pointInTime > now.unix()
            && item.pointInTime < fromNow14mins.unix();
        })
          .map(item => {
            Enqueuer.transition(dynamoDb, sqs, item)
            .then(() => {
              logger.info(`Item ${item.scheduleId} transitioned to delayer queue`);
            })
            .catch(err => {
              if( err.compensationError ){
                // critical error on item - open alert on cloudwatch
                logger.error(`Compensation error on scheduleId ${item.scheduleId}: ${JSON.stringify(err.compensationError)}`);
              } else {
                logger.error(`Fail to transition schedule do delayer queue: ${err.errorOn} : ${err[err.errorOn]}`);
              }
            });
          });
      })
      .catch(err => {
        logger.error(err);
        response.error(err);
      });

  }

};
