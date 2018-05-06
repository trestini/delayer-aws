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
const shortid = require('shortid');

const schedule = require('./schedule');

module.exports = {
  start(request, response, support){

    const { logger, dynamoDb } = support;

    const apiKey = request.requestContext.identity.apiKey;
    const scheduleId = shortid.generate();

    const body = request.body;

    try {

      let scheduleTime = undefined;

      try{
        scheduleTime = schedule.scheduleTimeFromEvent(body.schedule);
      } catch (e) {
        logger.warn(e);
        response.badRequest({message : e });
        return;
      }

      logger.info(`Schedule will be created in ${scheduleTime}`);

      const timeframePrefix = scheduleTime.format('YYYY-MM-DD_HH');
      const timeframeIndex = parseInt(scheduleTime.minute() / 15);

      const scheduleTimeframe = timeframePrefix + "-" + timeframeIndex;

      const pointInTime = scheduleTime.unix();
      const purgeAt = pointInTime + (60 * 60); // 1 hour after scheduled time

      let dbobj = {
        /* indexes */
        scheduleTimeframe: scheduleTimeframe,
        scheduleId: scheduleId,
        pointInTime: pointInTime,
        /* /indexes */
        currentStatus: 'NEW',
        apiKey: apiKey,
        actionConfig: body.action.httpConfig,
        notification: body.notification,
        context: body.context,
        createdOn: moment.utc().unix(),
        purgeAt: purgeAt
      };

      // console.log("Sending object to dynamodb:\n", JSON.stringify(dbobj, null, 2));

      const dynamoRequest = {
        TableName: 'schedule',
        Item: dbobj
      };

      dynamoDb.put(dynamoRequest, (err) => {
        if (err) {
          logger.error(`Failed to add schedule: ${err.message}`);

          if( err.code === 'ProvisionedThroughputExceededException' ){
            logger.warn("DynamoDB provisioning problem");
          }

          response.internalServerError({message: "Unable to add a schedule"});
        } else {
          const ret = {
            scheduleId: scheduleId,
            pointInTime: scheduleTime.format()
          };

          response.created(ret);
        }
      });

    } catch (e) {
      logger.error(e);
      response.internalServerError({ message : e });
    }

  }
};
