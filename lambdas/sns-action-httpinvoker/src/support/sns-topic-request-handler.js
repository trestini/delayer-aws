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

module.exports = {


/*
event
{
    "Records": [
        {
            "EventSource": "aws:sns",
            "EventVersion": "1.0",
            "EventSubscriptionArn": "arn:aws:sns:us-east-1:472249637553:DELAYER_ACTION_HTTP:5c174613-6c47-45ea-8447-9768c90b735e",
            "Sns": {
                "Type": "Notification",
                "MessageId": "b773bd6b-0f00-5c95-9bd0-ee1a4d109747",
                "TopicArn": "arn:aws:sns:us-east-1:472249637553:DELAYER_ACTION_HTTP",
                "Subject": null,
                "Message": "{\n\t\"schedule\": {\n\t\t\"pointInTime\": \"2018-05-12T16:20:35-0300\"\n\t},\n\t\"context\": {},\n\t\"action\": {\n\t\t\"type\": \"HTTP\",\n\t\t\"httpConfig\": {\n\t\t\t\"method\": \"GET\",\n\t\t\t\"url\": \"https://www.google.com\",\n\t\t\t\"requestType\": \"FIRE_FORGET\"\n\t\t}\n\t}\n}",
                "Timestamp": "2018-05-12T19:26:08.800Z",
                "SignatureVersion": "1",
                "Signature": "xangapeoV4wnJRHVAGUnByo6vJ9xtoLOnOiURHWGzlWQYJqqUgFxgOWU2dym1nZXjpEV2a5cY+IjRoJ4x9T1Qb/LA41xvWsLZw5sZ/rFXzS++l0Td/8h2AWojJvvcnpwHLEgpyYjKFAJzoOAuSKflinBGr1ZkgaEuO4Ut8vWtLeR6Ye8ABMDGLf4o2aHoSAU3nSxB+94zB/Q7ZsrhIQDP0SD4us/ARcaMBKgz1Lb6zaTarAHlShGVkxg8xz0FXOy3ArhxlT3Az3zhXXWTqWdQBfeY3PJyotGnIHNVsvE9dZHJrhIGqO0dtNeNxBdKfjkkLu9zAVYqSDO8yzT79ekvw==",
                "SigningCertUrl": "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-eaea6120e66ea12e88dcd8bcbddca752.pem",
                "UnsubscribeUrl": "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:472249637553:DELAYER_ACTION_HTTP:5c174613-6c47-45ea-8447-9768c90b735e",
                "MessageAttributes": {
                    "AWS.SNS.MOBILE.MPNS.Type": {
                        "Type": "String",
                        "Value": "token"
                    },
                    "AWS.SNS.MOBILE.MPNS.NotificationClass": {
                        "Type": "String",
                        "Value": "realtime"
                    },
                    "AWS.SNS.MOBILE.WNS.Type": {
                        "Type": "String",
                        "Value": "wns/badge"
                    }
                }
            }
        }
    ]
}
*/

  request(event, context) {
    const record = event.Records[0];
    const ret = Object.assign({}, record.Sns, context);
    ret.EventSubscriptionArn = record.EventSubscriptionArn;
    ret.Message = JSON.parse(record.Sns.Message);
    return ret;
  },

  response(callback) {

    return {
      ok: () => callback(null),
      error: (errorMessage) => callback(errorMessage)
    };

  }
};
