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

module.exports = {
  updateStatus(dynamoDb, timeframe, scheduleId){
    const params = {
      TableName: "schedule",
      IndexName: "scheduleId-pointInTime-index",
      Key:{
        "scheduleTimeframe": timeframe,
        "scheduleId": scheduleId
      },
      UpdateExpression: "set currentStatus = :status",
      ExpressionAttributeValues:{
        ":status": "PROCESSED"
      },
      ReturnValues: "UPDATED_NEW"
    };

    return dynamoDb.update(params).promise();
  },

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
