#!/usr/bin/env node

const index = require('./index');

const event = {};

index.handler(event, null, (err, out) => {
    console.log(">>>>>>> END");
    console.log(">>>>>>> err: ", err);
    console.log(">>>>>>> out: ", out);
    process.exit( err ? 1 : 0 );
  }
);
