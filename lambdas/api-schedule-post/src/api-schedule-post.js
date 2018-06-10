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

const Schedule = require('./schedule');
const ActionConfig = require('./action-config');

module.exports = {
  start(request, response, support){

    const { logger, dynamoDb } = support;

    // logger.info(`raw request: ${JSON.stringify(request, null, 2)}`);

    const apiKey = request.requestContext.identity.apiKey;
    const scheduleId = request.awsRequestId;

    const body = request.body;

    // logger.info(`parsed body: ${JSON.stringify(body, null, 2)}`);

    try {

      let scheduleTime = undefined;

      try{
        scheduleTime = Schedule.scheduleTimeFromEvent(body.schedule);
      } catch (e) {
        logger.warn(e);
        response.badRequest({message : e });
        return;
      }

      const pointInTime = scheduleTime.unix();

      const actionObj = ActionConfig.getConfigObject(body.action);
      const topicArn = ActionConfig.getTopicArn(request, body.action);

      // logger.info(`ActionConfig Object ${JSON.stringify(actionObj)}`);

      let dbobj = {
        /* indexes */
        scheduleId: scheduleId,
        pointInTime: pointInTime,
        /* /indexes */

        apiKey: apiKey,
        topicArn: topicArn,
        actionConfig: actionObj,
        context: body.context
      };

      // logger.info("Sending object to dynamodb:\n", JSON.stringify(dbobj, null, 2));

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
          logger.info(`Schedule created with: ${JSON.stringify(ret)}. Returning code 201`);

          response.created(ret);
        }
      });

    } catch (e) {
      logger.error(e);
      response.internalServerError({ message : e });
    }

  }
};
