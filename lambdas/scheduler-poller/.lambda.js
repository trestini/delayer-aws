#!/usr/bin/env node

const index = require('./index');

const event = {};

const timeout = 60000;
const start = new Date().getTime();

const context = {
  getRemainingTimeInMillis(){
    const now = new Date().getTime();
    console.log("Remaining: ", timeout - (now - start));
    return timeout - (now - start);
  }
};

index.handler(event, context, (err, out) => {
    console.log(">>>>>>> END");
    console.log(">>>>>>> err: ", err);
    console.log(">>>>>>> out: ", out);
    process.exit( err ? 1 : 0 );
  }
);
