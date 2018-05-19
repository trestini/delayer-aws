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
const Timeframe = require('./timeframe');

module.exports = {
  start(request, response, support){

    const { logger, dynamoDb } = support;

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

        let dedupObj = {};

        queries.forEach(q => {
          q.Items.forEach(e => {
            dedupObj[e.scheduleId] = e;
          });
        });

        const items = Object.keys(dedupObj).map(k => dedupObj[k]);

        items
        .filter(item => {
          logger.info(`item.scheduleId: ${item.scheduleId}, item.currentStatus: ${item.currentStatus}, item.pointInTime: ${item.pointInTime}, now is: ${now.unix()}, is future? ${item.pointInTime > now.unix()}, < 14mins? ${item.pointInTime < fromNow14mins.unix()}`);

          return item.pointInTime > now.unix()
            && item.pointInTime < fromNow14mins.unix();
        })
        .forEach(item => {
          const timeframe = Timeframe.fromTimestamp(moment.unix(item.pointInTime).utc());
          deleteItem(dynamoDb, timeframe, item.scheduleId)
          .then(() => {
            logger.info(`Item ${item.scheduleId} transitioned to delayer queue`);
            response.ok();
          })
          .catch(err => {
            logger.error(`Item ${item.scheduleId} could not be deleted`);
            response.error(err);
          });
        });
      })
      .catch(err => {
        logger.error(err);
        response.error(err);
      });

  }

};

function deleteItem(dynamoDb, timeframe, scheduleId){
  const params = {
    TableName: "schedule",
    IndexName: "scheduleId-pointInTime-index",
    Key:{
      "scheduleTimeframe": timeframe,
      "scheduleId": scheduleId
    },
    ReturnValues: "ALL_OLD"
  };

  return dynamoDb.delete(params).promise();
}
