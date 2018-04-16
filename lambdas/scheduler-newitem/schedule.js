const moment = require('moment');

module.exports = {


  scheduleTimeFromEvent(scheduleObj){
    let scheduleTime = undefined;
    scheduleTime = Utils.checkers.date(scheduleObj.pointInTime);
    if( !scheduleTime ){
      throw `${scheduleObj.pointInTime} is not a valid date`;
    }

    const now = moment.utc();
    const constraint = now.add(3, 'm');
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
      const d = moment.utc(strDate, moment.ISO_8601);
      return d.isValid() ? d : undefined;
    }
  }
};
