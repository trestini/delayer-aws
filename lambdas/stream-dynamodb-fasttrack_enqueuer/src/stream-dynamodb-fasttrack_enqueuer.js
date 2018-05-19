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
const Enqueuer = require('./enqueuer');

const eventNameMapping = {
  'INSERT' : 'NewImage',
  'REMOVE' : 'OldImage'
};

module.exports = {
  start(request, response, support){

    const { logger, sqs, dynamoDb, converter } = support;

    Enqueuer.logger(logger);

    request.Records.forEach(record => {

      logger.info(`Now processing: \n${JSON.stringify(record, null, 2)}`);

      logger.info(`eventName: ${record.eventName}, mapped: ${eventNameMapping[record.eventName]}`);

      const aux = record.dynamodb[eventNameMapping[record.eventName]];

      logger.info(`image raw: ${JSON.stringify(aux, null, 2)}`);

      const image = converter.unmarshall(aux);

      logger.info(`image unmarshalled: ${JSON.stringify(image, null, 2)}`);

      const pointInTime = moment.unix(image.pointInTime);

      logger.info(`pointInTime: ${pointInTime}`);

      logger.info(`Fast track: ${isFastTrack(pointInTime)}`);

      const streamType = record.eventName;

      if( isFastTrack(pointInTime) ){
        if( streamType === 'INSERT' ){
          logger.info("I'll remove this to stream it");

          const scheduleTimeframe = record.dynamodb.Keys.scheduleTimeframe.S;
          const scheduleId = record.dynamodb.Keys.scheduleId.S;

          logger.info(`timeframe: ${scheduleTimeframe}, id: ${scheduleId}`);

          const params = {
            TableName: "schedule",
            Key:{
              "scheduleTimeframe": scheduleTimeframe,
              "scheduleId": scheduleId
            },
          };

          dynamoDb.delete(params).promise()
          .then(ok => {
            response.ok("that's all folks: ", ok);
          })
          .catch(err => {
            response.error("oh nooo: ", err);
          });

        } else if ( streamType === 'REMOVE' ){
          logger.info("Time do party! Inserting on SQS queue");
          logger.info(`Event to be enqueued: ${JSON.stringify(image, null, 2)}`);

          Enqueuer.sendToQueue(sqs, image);
        }
      }

    });

  }

};

function isFastTrack(pointInTime){
  const daquiA14Mins = moment.utc().add(14, 'm').unix();
  const now = moment.utc().unix();

  const pit = pointInTime.unix();

  return pit >= now && pit <= daquiA14Mins;
}
