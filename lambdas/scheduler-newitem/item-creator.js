const moment = require('moment');
const request = require('request');

const qtd = parseInt(process.argv[2]);
const concentracao = parseInt(process.argv[3]);
const from = process.argv[4];

if (!qtd || !concentracao || !from) {
  console.error("Usage: item-creator.js QTD CONC FROM");
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': 'nVMIr6J5Do1qutXsZt1dhaaJfjyq4YgzThPQWkQ1'
};


const mountBody = (time) => {
  const body = {
    "schedule": {
      "pointInTime": "2018-04-23T22:53:45-0300"
    },
    "context": {},
    "action": {
      "type": "HTTP",
      "httpConfig": {
        "method": "GET",
        "url": "https://www.google.com",
        "requestType": "FIRE_FORGET"
      }
    }
  };
  body.schedule.pointInTime = time;
  // console.log(`Returning body with time: ${aux.schedule.pointInTime}`);
  return body;
};

const ini = moment.utc(from);

const equally = concentracao / qtd;

let current = ini,
  list = [];
for (let i = 0; i < qtd; i++) {
  console.log(`${i}: ${current}`);
  list.push(moment(current));
  current.add(equally, 's');
}

list.map(mountBody).forEach(e => {
  console.log(`time: ${e.schedule.pointInTime}, url: ${e.action.httpConfig.url}`);
  request.post({
    url: 'https://sdzp92wil0.execute-api.us-east-1.amazonaws.com/dev/schedule',
    method: 'POST',
    headers: headers,
    json: true,
    body: e
  }, (error, response, body) => {
    if (error) {
      console.error("=( ", error);
    } else {
      console.log("=) ", body);
    }
  });

});
