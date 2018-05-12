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

const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/472249637553/DELAYER_wait-queue";

let logger;

module.exports = {

  logger(_logger){
    logger = _logger;
  },

  /**
   * This function do the transition between the schedules repository
   * to the delayer queue. It must happen in a "transitional" fashion:
   * 1. schedule is updated in DynamoDB with status "PROCESSED"
   * 2. schedule is sent to SQS delayer queue
   *
   * If step 1. completes with error, the promise is rejected with a
   * DynamoDb error.
   * If step 1. completes sucessfully and step 2. with error, a trial
   * to re-update dynamodb's record is done, and if this re-update
   * succeeds, the promise is rejected with sqs error. If this re-update
   * fails, the promise is rejected with both sqs and compensation errors.
   *
   * @param {AWS.DynamoDB} dynamoDb current DynamoDb instance
   * @param {AWS.SQS} sqs current SQS instance
   * @param {*} item schedule item
   *
   * @returns a Promise with the following states:
   * - resolved: object with keys `dynamoDbResult` and `sqsResult` containing
   * their respectives AWS raw objects;
   * - rejected: an object with a key `errorOn` containing the name of the
   * key with the real error. If a compensation occurs, the compensation
   * error will be in `compensationError` attribute
   */
  transition(dynamoDb, sqs, item){
    return new Promise( (resolve, reject) => {
      const timeframe = Timeframe.fromTimestamp(moment.unix(item.pointInTime).utc());
      this.updateStatus(dynamoDb, timeframe, item.scheduleId, "PROCESSED")
      // update item status
      .then(ddbOk => {
        // since update is ok, send message to sqs
        this.sendToQueue(sqs, item)
        .then(sqsOk => {
          // since sms sent is ok, resolve whole promise
          resolve({
            dynamoDbResult: ddbOk,
            sqsResult: sqsOk
          });
        })
        .catch(sqsError => {
          // inconsistent state, should try to compensate
          logger.warn(`Error on submit message to sqs queue. Rolling back dynamodb status`);
          this.updateStatus(dynamoDb, timeframe, item.scheduleId, "NEW")
          .then(() => {
            // compensation succeeded, return sqs error, state become consistent
            logger.info(`Rollback of item ${item.scheduleId} succeeded`);
            reject({
              errorOn: 'sqsError',
              sqsError: sqsError
            });
          })
          .catch(compError => {
            // fail on compensation routine, critical error, inconsistent state
            reject({
              errorOn: 'sqsError',
              sqsError: sqsError,
              compensationError: compError
            });
          });
        });
      })
      .catch(ddbError => {
        // update failed, reject promise
        reject({ errorOn: 'dynamoDbError', dynamoDbError: ddbError });
      });
    });
  },

  updateStatus(dynamoDb, timeframe, scheduleId, status){
    const params = {
      TableName: "schedule",
      IndexName: "scheduleId-pointInTime-index",
      Key:{
        "scheduleTimeframe": timeframe,
        "scheduleId": scheduleId
      },
      UpdateExpression: "set currentStatus = :status",
      ExpressionAttributeValues:{
        ":status": status
      },
      ReturnValues: "UPDATED_NEW"
    };

    return dynamoDb.update(params).promise();
  },

  sendToQueue(sqs, item){
    const delay = (item.pointInTime - moment.utc().unix());
    logger.info(`Publishing message id [${item.scheduleId}] ${delay}s of delay time`);

    const params = {
      MessageBody: JSON.stringify(item),
      QueueUrl: QUEUE_URL,
      DelaySeconds: delay
    };

    return sqs.sendMessage(params).promise();
  }
};
