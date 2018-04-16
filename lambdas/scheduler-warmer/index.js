const AWS = require('aws-sdk');
const moment = require('moment');

AWS.config.update({
  region: 'us-east-1'
});

const ddb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

exports.handler = (request, context, callback) => {

  const params = {
    ExpressionAttributeValues: {
      ':d1': moment.utc(),
      ':d2': moment.utc().add(14, 'm')
    },
    KeyConditionExpression: 'pointInTime > :d1 and pointInTime < :d2',
    TableName: 'schedules'
  };

  ddb.query(params, (err, data) => {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.Items);
    }
  });

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
