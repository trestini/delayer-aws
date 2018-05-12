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

const TOPIC_ARN = "arn:aws:sns:us-east-1:472249637553:DELAYER_ACTION_HTTP";
const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/472249637553/DELAYER_wait-queue";

let logger;

const Poller = {

  logger(_logger){
    logger = _logger;
  },

  pollForMessages(sqs, pollingTime){
    logger.info(`Polling for ${pollingTime}s for messages`);
    const params = {
      QueueUrl: QUEUE_URL,
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

  processMessage(sns, sqs, sqsMessage){

    return new Promise( (resolve, reject) => {

      try {

        logger.info("Processando msg: ", sqsMessage);
        const msg = JSON.parse(sqsMessage.Body);
        const now = moment.utc();

        //console.log(`now: ${now.format()} / ${now.unix()} -> scheduled: ${scheduledTime.format()} / ${scheduledTime.unix().utc()} => ${msg.pointInTime}`);

        const drift = now.unix() - parseInt(msg.pointInTime);

        logger.info(`Drift on ${msg.scheduleId}: ${drift} secs`);

        Poller.publishOnTopic(sns, TOPIC_ARN, sqsMessage.Body)
          .then( () => {
            Poller.deleteMessage(sqs, QUEUE_URL, sqsMessage);
            resolve({ result: sqsMessage });
          } )
          .catch( err => {
            reject({ error: sqsMessage, err: err });
          } );
      } catch(e) {
        reject(e);
      }
    });

  },

  publishOnTopic(sns, topicArn, message){
    // console.log(`Publicando [${message}] no topico [${topicArn}]`);
    return sns.publish({
      Message: message,
      TopicArn: topicArn
    })
      .promise();
  },

  deleteMessage(sqs, queueUrl, sqsMessage){
    // console.log("deleteMessage: deleting message: ", sqsMessage);
    return sqs.deleteMessage({
      QueueUrl: queueUrl,
      ReceiptHandle: sqsMessage.ReceiptHandle
    })
      .promise();
  }

};

module.exports = Poller;
