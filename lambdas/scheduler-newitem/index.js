const AWS = require('aws-sdk');
const schedule = require('./schedule');
const shortid = require('shortid');

AWS.config.update({
  region: 'us-east-1'
});

const ddb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

exports.handler = (event, context, callback) => {

  try {
    let scheduleTime = schedule.scheduleTimeFromEvent(event);
    console.log(`Schedule will be created for ${scheduleTime} local time`);

    const schedule_id = shortid.generate();

    let dbobj = {
      schedule_id: schedule_id,
      point_in_time: scheduleTime.toISOString(),
      action_type: event.action.type,
      action_config: event.action.httpConfig,
      notification: event.notification,
      state: event.context
    };

    const dynamoRequest = {
      TableName: 'schedules',
      Item: dbobj
    };

    ddb.put(dynamoRequest, (err, data) => {
      if (err) {
        callback(err);
      } else {
        callback(null, { status: ":ok", httpCode: 201, response: { schedule_id: schedule_id } });
      }
    });

  } catch (e) {
    callback(e);
  }

};
