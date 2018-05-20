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
let logger, dynamoDb, sqs;

const eventNameMapping = {
  'INSERT' : 'NewImage',
  'REMOVE' : 'OldImage'
};

const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/472249637553/DELAYER_wait-queue";

module.exports = {
  start(request, response, support){

    const { converter } = support;
    logger = support.logger;
    dynamoDb = support.dynamoDb;
    sqs = support.sqs;

    logger.info(`Starting ingestion of ${request.Records.length} records`);

    request.Records.forEach(record => {
      const aux = record.dynamodb[eventNameMapping[record.eventName]];
      const image = converter.unmarshall(aux);
      const pointInTime = moment.unix(image.pointInTime);

      logger.info(`eventName: ${record.eventName}, In delayer zone: ${isInDelayerQueueZone(pointInTime)}, eventID: ${record.eventID}, mapped: ${eventNameMapping[record.eventName]}`);

      const streamType = record.eventName;

      if( isInDelayerQueueZone(pointInTime) ){
        if( streamType === 'INSERT' ){
          addDeleteOperation(image.scheduleId, image.pointInTime);
        } else if ( streamType === 'REMOVE' ){
          sendToQueue(sqs, image);
        }
      }

    });

    flushDeleteOperation();
  }

};

function isInDelayerQueueZone(pointInTime){
  const within14Mins = moment.utc().add(14, 'm').unix();
  const now = moment.utc().unix();

  const pit = pointInTime.unix();

  return pit >= now && pit <= within14Mins;
}

function sendToQueue(sqs, item){
  const delay = (item.pointInTime - moment.utc().unix());
  logger.info(`Publishing message id [${item.scheduleId}] ${delay}s of delay time`);

  const params = {
    MessageBody: JSON.stringify(item),
    QueueUrl: QUEUE_URL,
    DelaySeconds: delay
  };

  return sqs.sendMessage(params).promise();
}

let deleteBuffer = [];

function addDeleteOperation(scheduleId, pointInTime){
  const params = {
    DeleteRequest: {
      Key:{
        "scheduleId": scheduleId,
        "pointInTime": pointInTime
      }
    }
  };

  deleteBuffer.push(params);
  if( deleteBuffer.length == 10 ){
    flushDeleteOperation();
  }
}

function flushDeleteOperation(){
  let copy = [];
  deleteBuffer.forEach(i => copy.push(i));
  deleteBuffer = [];

  const requests = {
    RequestItems: {
      'schedule': copy
    }
  };

  if( copy.length > 0 ){
    dynamoDb.batchWrite(requests, (err, ok) => {
      if( err ){
        logger.error(`Fudeu: ${JSON.stringify(err)}`);
      } else {
        logger.info(`${copy.length} deletes performed: ${JSON.stringify(ok)}`);
      }
    });
  }

}
