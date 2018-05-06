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
  fromTimestamp(timestamp){
    if( !moment.isMoment(timestamp) ){
      throw "moment.js date required";
    }
    const timeframePrefixIni = timestamp.format('YYYY-MM-DD_HH');
    const timeframeIndexIni = parseInt(timestamp.minute() / 15);

    const ret = `${timeframePrefixIni}-${timeframeIndexIni}`;
    return ret;
  },

  getSchedules(dynamoDb, timeframe){
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
