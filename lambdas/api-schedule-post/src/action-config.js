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

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, function (m, w) {
    return w.toUpperCase();
  });
}

const actionConfig = {

  getConfigObject(apiActionObject){
    const configKey = toCamelCase(apiActionObject.type) + "Config";
    return apiActionObject[configKey];
  },

  getTopicArn(request, apiActionObject){
    const topicName = this.getTopicName(apiActionObject);
    const arnRegex = /^arn:aws:sns:/i;

    if( topicName.match(arnRegex) ){
      return topicName;
    } else {
      const accountId = request.requestContext.accountId;
      const { invokedFunctionArn } = request;
      const region = invokedFunctionArn.split(":")[3];
      return `arn:aws:sns:${region}:${accountId}:${topicName}`;
    }
  },

  getTopicName(apiActionObject){
    if( apiActionObject.type === "custom" ){
      return apiActionObject.topicArn;
    } else {
      return apiActionObject.type + "_action_topic";
    }
  }

};

module.exports = actionConfig;
