#!/usr/bin/env node

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

/*eslint no-console:0*/
const moment = require('moment');
const request = require('request');

const qtd = parseInt(process.argv[2]);
const concentracao = parseInt(process.argv[3]);
const from = process.argv[4];

if (!qtd || !concentracao || !from) {
  console.error("Usage: schedule-creator.js QTY_SCHEDULES CONCENTRATION INIT_TIME");
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
  //console.log(`${i}: ${current}`);
  list.push(moment(current));
  current.add(equally, 's');
}

list.map(mountBody).forEach(e => {
  // console.log(`time: ${e.schedule.pointInTime}, url: ${e.action.httpConfig.url}`);
  request.post({
    url: 'https://sdzp92wil0.execute-api.us-east-1.amazonaws.com/dev/schedule',
    method: 'POST',
    headers: headers,
    json: true,
    body: e
  }, (error, response, body) => {
    if (error) {
      console.error("ERR ", error);
    } else {
      console.log(`OK  ${body.scheduleId};${body.pointInTime}`);
    }
  });

});
