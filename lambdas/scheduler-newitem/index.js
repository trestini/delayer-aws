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

const AWS = require('aws-sdk');
const shortid = require('shortid');
const moment = require('moment');

/* validators */
const schedule = require('./schedule');

AWS.config.update({
  region: 'us-east-1'
});

const ddb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

exports.handler = (request, context, callback) => {

  const apiKey = request.requestContext.identity.apiKey;
  const scheduleId = shortid.generate();
  const currentStatus = "COLD";

  const body = JSON.parse(request.body);

  try {

    let scheduleTime = undefined;

    try{
      scheduleTime = schedule.scheduleTimeFromEvent(body.schedule);
    } catch (e) {
      console.warn(e);
      Utils.handleError(callback, e, 400);
      return;
    }

    console.log(`Schedule will be created in ${scheduleTime}`);

    const timeframePrefix = scheduleTime.format('YYYY-MM-DD_HH');
    const timeframeIndex = parseInt(scheduleTime.minute() / 15);

    const scheduleTimeframe = timeframePrefix + "-" + timeframeIndex;

    const pointInTime = scheduleTime.unix();
    const purgeAt = pointInTime + (60 * 60 * 24 * 30); // 30 dias

    let dbobj = {
      /* indexes */
      scheduleTimeframe: scheduleTimeframe,
      scheduleId: scheduleId,
      pointInTime: scheduleTime.unix(),
      /* /indexes */
      currentStatus: currentStatus,
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

    ddb.put(dynamoRequest, (err) => {
      if (err) {
        console.error(err);
        Utils.handleError(callback, err);
      } else {
        const ret = {
          scheduleId: scheduleId,
          pointInTime: scheduleTime.format()
        };

        Utils.buildResponse(callback, 201, ret);
      }
    });

  } catch (e) {
    console.error(e);
    Utils.handleError(callback, e, 500);
  }

};

const Utils = {
  buildResponse(callback, statusCode, body, headers){
    const response = {
      statusCode: statusCode,
      body: JSON.stringify(body)
    };

    if( headers ){
      response.headers = headers;
    }

    callback(null, response);
  },

  handleError(callback, err, statusCode){
    let errmsg = undefined;
    if( typeof(err) == 'string' ){
      errmsg = err;
    } else if( typeof(err) == 'object' && err.msg !== undefined ){
      errmsg = err.msg;
    } else {
      errmsg = "Request could not be completed";
    }
    this.buildResponse(callback, statusCode ? statusCode : 500, {message : errmsg});
  }
};
