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
