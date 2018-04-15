#!/usr/bin/env node

const index = require('./index');

const amount = process.argv[2];
const unit = process.argv[3];

console.log(`Amount: ${amount}, Unit: ${unit}`);

const event = {
  "schedule" : {
    // "pointInTime": "2018-04-15T10:00:00-0300"
    "fromNow" : {
      "amount" : amount,
      "unit" : unit
    }
  },
  "context": {
    "headers" : [
      { "x-strange-header" : 123 }
    ],
    "payload" : "my fine content"
  },
  "action": {
    "type" : "HTTP",
    "httpConfig" : {
      "method": "POST",
      "url": "http://...",

      "requestType": "WAIT_RETURN",
      "returnExpected": {
        "code": [200, 201],
        "body": "/regex here/"
      },

      "preCheck": {
        "method": "HEAD",
        "url": "http://"
      }
    }
  },
  "notification": {
    "slack": {
      "account": "ifood",
      "recipients": ["#channel"]
    }
  }

};

index.handler(event, null, (err, out) => {
    console.log(">>>>>>> END");
    console.log(">>>>>>> err: ", err);
    console.log(">>>>>>> out: ", out);
    process.exit( err ? 1 : 0 );
  }
);