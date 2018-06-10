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

const requestjs = require('request');

module.exports = {

  start(request, response, support){

    const { logger } = support;

    logger.info(`raw request arrived: ${JSON.stringify(request, null, 2)}`);

    const body = request.Message;
    const config = body.actionConfig;

    logger.info(`parsed body: ${JSON.stringify(body, null, 2)}`);

    const customUri = `${config.requestType === "FIRE_FORGET" ? "fireforget" : "withwait"}/${body.scheduleId}/${body.pointInTime}`;

    const requestParams = {
      url: `${config.url}/${customUri}`,
      method: config.method,
      json: true,
      headers: body.context.headers,
      body: body.context.payload
    };

    if( config.requestType === 'FIRE_FORGET' ) {
      requestParams.timeout = 1000;  // set timeout to 1ms in order to "forget" the response
    }

    logger.info(`Requesting with parameters: ${JSON.stringify(requestParams)}`);

    requestjs(requestParams, (error, resp, ret) => {
      if( error ){

        if( error.code === "ETIMEDOUT" && config.requestType === 'FIRE_FORGET' ) {
          // request of type FIRE_FORGET ok
          response.ok();
          return;
        }

        logger.error(`HTTP request failed: ${error}`);
        response.error(error);
      } else {
        logger.info('statusCode:' + response && response.statusCode);
        logger.info(`body: ${ret}`);
        response.ok();
      }
    });

  }

};
