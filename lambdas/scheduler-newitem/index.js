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
  const currentState = "COLD";

  const body = JSON.parse(request.body);

  try {
    let scheduleTime = schedule.scheduleTimeFromEvent(body.schedule);
    console.log(`Schedule will be created in ${scheduleTime}`);

    let dbobj = {
      /* indexes */
      scheduleId: scheduleId,
      pointInTime: scheduleTime.unix(),
      /* /indexes */
      apiKey: apiKey,
      currentState: currentState,
      actionType: body.action.type,
      actionConfig: body.action.httpConfig,
      notification: body.notification,
      context: body.context,
      createdOn: moment.utc().unix(),
    };

    console.log("Sending object to dynamodb:\n", JSON.stringify(dbobj, null, 2));

    const dynamoRequest = {
      TableName: 'schedules',
      Item: dbobj
    };

    ddb.put(dynamoRequest, (err) => {
      if (err) {
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
    Utils.handleError(callback, e, 400);
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
      errmsg = "Internal Server Error";
    }
    this.buildResponse(callback, statusCode ? statusCode : 500, {message : errmsg});
  }
};
