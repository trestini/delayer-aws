#!/usr/bin/env node

/*
 * Copyright (c) 2018 delayer-aws
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

const index = require('./index');

const body = {
  "schedule": {
    "pointInTime": "2018-04-22T00:45:00-0300"
  },
  "context": {
    "headers": [{
      "x-strange-header": 123
    }],
    "payload": "my fine content"
  },
  "action": {
    "type": "HTTP",
    "httpConfig": {
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

const event = {
  "requestContext": {
    "identity": {
      "apiKey": "test_api_key"
    }
  },
  "body": JSON.stringify(body)
};

index.handler(event, null, (err, out) => {
  console.log(">>>>>>> END");
  console.log(">>>>>>> err: ", err);
  console.log(">>>>>>> out: ", out);
  process.exit(err ? 1 : 0);
});
