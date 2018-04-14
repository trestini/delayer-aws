const moment = require('moment');

module.exports = {

  scheduleTimeFromEvent(event){
    let scheduleTime = undefined;
    if( event.schedule.pointInTime ){
      scheduleTime = Utils.checkers.date(event.schedule.pointInTime);
      const now = moment().utc();
      const constraint = now.add(3, 'm');
      if( !scheduleTime.isAfter(constraint) ){
        throw `Schedules are constrained to 3 minutes from now. Scheduled for: ${scheduleTime}, Constraint: ${constraint} (times in UTC)`;
      }
    } else {
      const fromNow = event.schedule.fromNow;
      scheduleTime = moment().add(fromNow.amount, Utils.trToTime(fromNow.unit));
    }

    return scheduleTime;
  }

};

const Utils = {
  checkers: {
    date(strDate){
      const d = moment(strDate, moment.ISO_8601).utc();
      return d.isValid() ? d : undefined;
    }
  },

  trToTime(en){
    switch (en) {
    case "MINUTE":
      return "m";
    case "HOUR":
      return "h";
    case "DAY":
      return "d";
    default:
      return undefined;
    }
  }
};
