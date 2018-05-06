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
const moment = require('moment');

AWS.config.update({
  region: 'us-east-1'
});

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10'
});
const sqs = new AWS.SQS();
const sns = new AWS.SNS();

const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/472249637553/warm-tasks";
const TOPIC_ARN = "arn:aws:sns:us-east-1:472249637553:http_action";

const Poller = {
  pollForMessages(queueUrl, pollingTime){
    console.log(`Polling for ${pollingTime}s for messages`);
    const params = {
      QueueUrl: queueUrl,
      WaitTimeSeconds: pollingTime,
      MaxNumberOfMessages: 10
    };

    return new Promise( (resolve, reject) => {
      sqs.receiveMessage(params)
        .promise()
        .then((result) => {
          result.Messages ?
            resolve(result.Messages)
            : resolve([]);
        })
        .catch( (err) => reject(err) );
    });
  },

  processMessage(sqsMessage){

    // console.log("Processando msg: ", sqsMessage);

    const msg = JSON.parse(sqsMessage.Body);
    const now = moment.utc();

    //console.log(`now: ${now.format()} / ${now.unix()} -> scheduled: ${scheduledTime.format()} / ${scheduledTime.unix().utc()} => ${msg.pointInTime}`);

    const drift = now.unix() - parseInt(msg.pointInTime);

    console.log(`Drift on ${msg.scheduleId}: ${drift} secs`);

    Promise.all([
      Poller.publishOnTopic(TOPIC_ARN, sqsMessage.Body),
      Poller.updateDynamo(msg, { currentStatus: 'DOING' })
    ])
      .then( results => {
        // Poller.deleteMessage(QUEUE_URL, sqsMessage);
        return { result: sqsMessage };
      } )
      .catch( err => {
        console.log("errors do promise all: ", err);
        return { error: sqsMessage };
      } );

  },

  publishOnTopic(topicArn, message){
    // console.log(`Publicando [${message}] no topico [${topicArn}]`);
    return sns.publish({
      Message: message,
      TopicArn: topicArn
    })
      .promise();
  },

  /**
  * Este obj deve estar no formato: { field: value },
  * sendo que a operacao a ser usada sera a SET
  */
  updateDynamo(item, obj){
    // console.log(`Atualizando item ${item} com parametros ${obj}`);
    const k = Object.keys(obj)[0], v = obj[k];
    const params = {
      TableName: "schedule",
      IndexName: "scheduleId-pointInTime-index",
      Key:{
        "scheduleTimeframe": Utils.timeframe(moment.unix(item.pointInTime).utc()),
        "scheduleId": item.scheduleId
      },
      UpdateExpression: "set #field = :value",
      ExpressionAttributeNames: {
        "#field": k
      },
      ExpressionAttributeValues:{
        ":value": v
      },
      ReturnValues: "UPDATED_NEW"
    };

    return ddb.update(params).promise();
  },

  deleteMessage(queueUrl, sqsMessage){
    // console.log("deleteMessage: deleting message: ", sqsMessage);
    return sqs.deleteMessage({
      QueueUrl: queueUrl,
      ReceiptHandle: sqsMessage.ReceiptHandle
    })
      .promise()
  }

};

const Utils = {
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

module.exports = Poller;
