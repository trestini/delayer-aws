const AWS = require('aws-sdk');
const moment = require('moment');

AWS.config.update({
  region: 'us-east-1'
});

const ddb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const sqs = new AWS.SQS();

exports.handler = (request, context, callback) => {

  const now = moment.utc();
  const daquiA14 = moment.utc().add(14,'m');

  const timeframeIni = Utils.timeframe(now);
  const timeframeEnd = Utils.timeframe(daquiA14);

  // console.log(`Quering from ${timeframeIni} and ${timeframeEnd}`);

  let params1 = {
    TableName : "schedule",
    KeyConditionExpression: "scheduleTimeframe = :ini",
    ExpressionAttributeValues: {
      ":ini": timeframeIni
    }
  };

  let params2 = {
    TableName : "schedule",
    KeyConditionExpression: "scheduleTimeframe = :end",
    ExpressionAttributeValues: {
      ":end": timeframeEnd
    }
  };

  const query1 = new Promise((resolve, reject) => {
    ddb.query(params1, function(err, data) {
      if( err ) console.error(err);
      // console.log("Query1 items: ", data.Items);
      err ? reject(err) : resolve(data);
    });
  });

  const query2 = new Promise((resolve, reject) => {
    ddb.query(params2, function(err, data) {
      if( err ) console.error(err);
      // console.log("Query2 items: ", data.Items);
      err ? reject(err) : resolve(data);
    });
  });

  Promise.all([query1, query2])
    .then(queries => {
      let items = [];
      queries.forEach(result => {
        result.Items.forEach(i => items.push(i));
      });

      items
        .filter(item => {
          return item.currentStatus === 'COLD'
          && item.pointInTime > now.unix()
          && item.pointInTime < daquiA14.unix();
        })
        .forEach(item => {
          Transition.warmIt(item);
        });
    })
    .catch(err => {
      console.error(err);
      Utils.buildResponse(callback, 500, {err: err});
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
  },

  timeframe(timestamp){
    if( !moment.isMoment(timestamp) ){
      throw "moment.js date required";
    }
    const timeframePrefixIni = timestamp.format('YYYY-MM-DD_HH');
    const timeframeIndexIni = parseInt(timestamp.minute() / 15);

    const ret = `${timeframePrefixIni}-${timeframeIndexIni}`;
    return ret;
  }
};

const Transition = {
  warmIt(item){

    const delay = (item.pointInTime - moment.utc().unix());

    console.log(`Publicando mensagem com delay de ${delay}s`);

    const params = {
      MessageBody: JSON.stringify(item),
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/472249637553/warm-tasks',
      DelaySeconds: delay
    };

    console.log(params);
    sqs.sendMessage(params, function(err, data) {
      if (err) {
        console.error(err); // an error occurred
      } else {
        const params = {
          TableName: "schedule",
          IndexName: "scheduleId-pointInTime-index",
          Key:{
            "scheduleTimeframe": Utils.timeframe(moment.unix(item.pointInTime).utc()),
            "scheduleId": item.scheduleId
          },
          UpdateExpression: "set currentStatus = :status, sqsMessageId = :mId",
          ExpressionAttributeValues:{
            ":status": "WARM",
            ":mId": data.MessageId,
          },
          ReturnValues: "UPDATED_NEW"
        };

        ddb.update(params, (err, data) => {
          if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
          } else {
            console.log("UpdateItem succeeded:", data);
          }
        });
      }
    });
  }
};
