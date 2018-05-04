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

const moment = require('moment');

module.exports = {


  scheduleTimeFromEvent(scheduleObj){
    let scheduleTime = undefined;
    scheduleTime = Utils.checkers.date(scheduleObj.pointInTime);
    if( !scheduleTime ){
      throw `${scheduleObj.pointInTime} is not a valid date`;
    }

    const now = moment.utc();
    const constraint = now.add(90, 's');
    if( !scheduleTime.isAfter(constraint) ){
      throw `Unable to create a schedule before ${constraint} (UTC)`;
    } else {
      return scheduleTime;
    }
  }

};

const Utils = {
  checkers: {
    date(strDate){
      let parsed;
      if( Utils.isNumberic(strDate) ){
        parsed = moment.unix(strDate).utc();
      } else {
        parsed = moment.utc(strDate, moment.ISO_8601);
      }

      return parsed.isValid() ? parsed : undefined;
    }
  },
  isNumberic(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
};
