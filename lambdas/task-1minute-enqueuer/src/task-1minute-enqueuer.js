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

module.exports = {
  start(request, response, support){

    const { logger, dynamoDb } = support;

    const now = moment.utc().unix();
    const fromNow14mins = moment.utc().add(14,'m').unix();

    const params = {
      TableName: "schedule",
      FilterExpression: "#pit between :now and :in14mins",
      ExpressionAttributeNames: {
        "#pit": "pointInTime",
      },
      ExpressionAttributeValues: {
        ":now": now,
        ":in14mins": fromNow14mins
      }
    };

    const scanHandler = (err, result) => {
      if( !err ){
        Promise.all(result.Items.map(item => {
          const params = {
            TableName: "schedule",
            Key:{
              "scheduleId": item.scheduleId,
              "pointInTime": item.pointInTime
            },
            ReturnValues: "NONE"
          };
          return dynamoDb.delete(params).promise();
        }))
        .then(() => {
          if (typeof result.LastEvaluatedKey != "undefined") {
            logger.info("Scanning for more...");
            params.ExclusiveStartKey = result.LastEvaluatedKey;
            dynamoDb.scan(params, scanHandler);
          }
        })
        .catch(err => {
          logger.error(`Scan failed: ${err}`);
        });
      } else {
        logger.error(`Scan failed: ${err}`);
      }
    };

    dynamoDb.scan(params, scanHandler);

  }

};
