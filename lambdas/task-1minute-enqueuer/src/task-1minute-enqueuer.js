/*
 * Copyright (c) 2018 delayer-aws
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

module.exports = {
  start(request, response, support){

    const { sqs, dynamoDb } = support;
    logger = support.logger;

    const now = moment.utc();
    const fromNow14mins = moment.utc().add(14,'m');

    const timeframes = {
      ini: Utils.timeframe(now),
      end: Utils.timeframe(fromNow14mins)
    };

    Promise.all([
      Utils.queryTimeframe(dynamoDb, timeframes.ini),
      Utils.queryTimeframe(dynamoDb, timeframes.end)
    ])
      .then(queries => {
        logger.info(JSON.stringify(queries[0]));
        logger.info(JSON.stringify(queries[1]));
        let items = queries[0].Items;
        Array.prototype.push.apply(items, queries[1].Items);

        Promise.all(
          items.filter(item => {
            return item.pointInTime > now.unix()
              && item.pointInTime < fromNow14mins.unix();
          })
            .map(item => Enqueuer.sendToQueue(sqs, item))
        )
        .then(ok => {
          logger.info("OK: ", JSON.stringify(ok));
          response.ok();
        })
        .catch(err => {
          logger.error("OK: ", JSON.stringify(err));
          response.error(err);
        });

      })
      .catch(err => {
        logger.error(err);
        response.error(err);
      });

  }

};

const Utils = {
  timeframe(timestamp){
    if( !moment.isMoment(timestamp) ){
      throw "moment.js date required";
    }
    const timeframePrefixIni = timestamp.format('YYYY-MM-DD_HH');
    const timeframeIndexIni = parseInt(timestamp.minute() / 15);

    const ret = `${timeframePrefixIni}-${timeframeIndexIni}`;
    return ret;
  },

  queryTimeframe(dynamoDb, timeframe){
    let params = {
      TableName : "schedule",
      KeyConditionExpression: "scheduleTimeframe = :param",
      ExpressionAttributeValues: {
        ":param": timeframe
      }
    };

    return dynamoDb.query(params).promise();
  }
};

const Enqueuer = {
  sendToQueue(sqs, item){
    const delay = (item.pointInTime - moment.utc().unix());
    console.log(`Publishing message id [${item.scheduleId}] ${delay}s of delay time`);

    const params = {
      MessageBody: JSON.stringify(item),
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/472249637553/warm-tasks',
      DelaySeconds: delay
    };

    return sqs.sendMessage(params).promise();
  }
};
