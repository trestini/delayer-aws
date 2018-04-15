const AWS = require('aws-sdk');
const shortid = require('shortid');
const moment = require('moment');

/* validators */
const schedule = require('./schedule');

AWS.config.update({
  region: 'us-east-1'
});

const ddb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

exports.handler = (event, context, callback) => {

  try {
    let scheduleTime = schedule.scheduleTimeFromEvent(event);
    console.log(`Schedule will be created in ${scheduleTime}`);

    const scheduleId = shortid.generate();

    let dbobj = {
      scheduleId: scheduleId,
      pointInTime: scheduleTime.unix(),
      actionType: event.action.type,
      actionConfig: event.action.httpConfig,
      notification: event.notification,
      context: event.context,
      createdOn: moment.utc().unix(),
    };

    const dynamoRequest = {
      TableName: 'schedules',
      Item: dbobj
    };

    ddb.put(dynamoRequest, (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null, { status: ":ok", httpCode: 201, response: { scheduleId: scheduleId } });
      }
    });

  } catch (e) {
    callback(e);
  }

};
