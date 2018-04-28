const AWS = require('aws-sdk');
const moment = require('moment');

AWS.config.update({
  region: 'us-east-1'
});

/*
  Fluxo simples:
  A cada 1 minuto, um novo lambda é invocado pelo CloudWatch Events.
  Quando invocado, esse lambda vai fazer o polling na fila SQS com o
  tempo estipulado em POLLING_TIME_IN_SECS. Se esse polling nao retornar
  mensagens pelo numero de vezes em EMPTY_POLL_LIMIT sequencialmente,
  ele é finalizado.

  O evento END_OF_LIFE ocorre 15 segundos antes do tempo de timeout
  configurado, e ele faz com que o lambda pare de fazer poll na fila SQS e
  seja finalizado por callback, para prevenir o hard stop por timeout. A
  cada execucao do evento END_OF_LIFE, uma metrica sera publicada no
  CloudWatch.

  Em uma situação onde hajam poucas mensagens, a tendência é que os
  EMPTY_POLLs ocorram com mais frequencia e que o lambda seja finalizado,
  por outro lado, com alta concorrência, a tendência é que o lambda corrente
  continue sendo executado e outros lambdas concorrentes sejam executados
  em paralelo.

  Cuidados:
  - Configurar o limite de concorrencia para esse lambda
  - Configura
  - Ser cauteloso na configuracao do POLLING_TIME_IN_SECS e do
  EMPTY_POLL_LIMIT: imagine uma situacao onde o POLLING_TIME_IN_SECS seja
  5s e o EMPTY_POLL_LIMIT seja 3. Se nao houver mensagens na fila, o lambda
  vai rodar por 15s e vai ser finalizado. Por 45s, nao havera a possibilidade
  de ele ser executado. Por outro lado, no mesmo cenario se o EMPTY_POLL_LIMIT
  for 50, muito provavelmente ele vai consumir tempo ocioso em concorrencia
  (a partir do segundo minuto ele vai estar sem fazer nada junto com outro
  lambda ocioso), até que o evento de END_OF_LIFE seja levantado.
*/

/*
  Tempo total do long polling na fila sqs, limitado a 20s
*/
const POLLING_TIME_IN_SECS = process.env.POLLING_TIME_IN_SECS || 3;
/*
  Quantidade de
*/
const EMPTY_POLL_LIMIT = process.env.POLLING_EXECUTIONS || 3;

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10'
});
const sqs = new AWS.SQS();
const sns = new AWS.SNS();

const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/472249637553/warm-tasks";

const poller = require('./poller');

exports.handler = (request, context, callback) => {

  const shouldKeepRunning = () => {
    const remaining = context.getRemainingTimeInMillis();
    const pollingTime = POLLING_TIME_IN_SECS * 1000;

    return (remaining - pollingTime) > 2000;
  };

  const tryRun = (hnd) => {
    if( shouldKeepRunning() ){
      poller.pollForMessages(QUEUE_URL, POLLING_TIME_IN_SECS).then(hnd);
    }
  };

  const msgHandler = (messages) => {
    if( messages.length > 0 ) {
      Promise.all(messages.map(poller.processMessage))
        .then(results => {
          console.log(`Processed ${results.length} messages. Will keep running? ${shouldKeepRunning()}`);
          tryRun(msgHandler);
        })
        .catch(err => callback(err));
    } else {
      tryRun(msgHandler);
    }
  };

  tryRun(msgHandler);

  // let emptyPollCurrentCount = 0;
  // const emptyPollHandler = (messages) => {
  //   if( messages.length > 0 ) {
  //     emptyPollCurrentCount = 0;
  //     console.log(">>>>>>>>>> received messages: ", messages);
  //     return Promise.all(messages.map(poller.processMessage));
  //   } else {
  //     return emptyPollCurrentCount++ > EMPTY_POLL_LIMIT ?
  //       null
  //       : poller.pollForMessages(QUEUE_URL, POLLING_TIME_IN_SECS)
  //         .then(emptyPollHandler);
  //   }
  // };
  //
  // let process = poller.pollForMessages(QUEUE_URL, POLLING_TIME_IN_SECS)
  //   .then(emptyPollHandler)
  //   .catch( error => callback(error, null) );
  //
  // process
  //   .then( results => {
  //     const remaining = context.getRemainingTimeInMillis();
  //     if( remaining > 2000 ){
  //       process = poller.pollForMessages(QUEUE_URL, POLLING_TIME_IN_SECS)
  //         .then(emptyPollHandler)
  //         .catch( error => callback(error, null) );
  //     } else {
  //       console.log("I'm too old. Time to go.");
  //       callback(null);
  //     }
  //   } )
  //   .catch( errors => {
  //     console.error(">>>>>>>>>> final errors: ", JSON.stringify(errors, null, 2));
  //   } );

};
