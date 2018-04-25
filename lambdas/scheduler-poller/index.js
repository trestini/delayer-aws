const AWS = require('aws-sdk');
const moment = require('moment');

AWS.config.update({
  region: 'us-east-1'
});

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10'
});
const sqs = new AWS.SQS();
const sns = new AWS.SNS();

const queueURL = "https://sqs.us-east-1.amazonaws.com/472249637553/warm-tasks";
const topicArn = "arn:aws:sns:us-east-1:472249637553:http_action";

exports.handler = (request, context, callback) => {

  let naoFizNada = 0;

  const handleThen = (resp) => {
    if( !resp.processed ){
      naoFizNada++;
    }

    if( naoFizNada < 3000 ){
      Messages.receiveMessage()
        .then(handleThen)
        .catch(err => {});
    } else {
      console.log("Hora de morrer");
      callback(null, true);
    }

  };

  Messages.receiveMessage()
    .then(handleThen)
    .catch(err => {});

};

const Messages = {

  receiveMessage(){

    const params = {
      QueueUrl: queueURL,
      WaitTimeSeconds: 10,
      MaxNumberOfMessages: 10
    };

    return sqs.receiveMessage(params)
      .promise()
      .then( resp => {

        console.log(`Read ${resp.Messages ? resp.Messages.length : 0} messages`);

        return resp.Messages ?
          Promise.all(resp.Messages.map(Messages.process))
          : {processed: false};

      } )
      .catch( err => {
        console.error("Error readeing sqs: ", err);
      } );
  },

  process(sqsMessage){

    const msg = JSON.parse(sqsMessage.Body);
    const scheduledTime = moment(msg.pointInTime);
    const now = moment.utc();

    const drift = now.unix() - scheduledTime.unix();

    console.log(`Publicando no SNS: ${msg.scheduleId} with ${drift}ms of difference`);

    return sns.publish({
      Message: sqsMessage.Body,
      TopicArn: topicArn
    })
      .promise()
      .then( result => {

        console.log("sns result: ", result);

        return sqs.deleteMessage({
          QueueUrl: queueURL,
          ReceiptHandle: sqsMessage.ReceiptHandle
        })
          .promise()
          .then( data => {
            return { processed: true, result : data };
          })
          .catch( err => {
            return { processed: false, err: err };
          });
      })
      .catch( err => {
        console.error("err ", err);
        return { processed: false, err: err };
      });

  }

};
