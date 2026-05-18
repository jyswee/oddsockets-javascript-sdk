const OddSockets = require('./OddSockets');
const Channel = require('./Channel');
const PubNubCompat = require('./PubNubCompat');

// Create the main export object that works with UMD
const OddSocketsSDK = OddSockets;

// Attach additional exports to the main constructor
OddSocketsSDK.OddSockets = OddSockets;
OddSocketsSDK.Channel = Channel;
OddSocketsSDK.PubNubCompat = PubNubCompat;

// Version info
OddSocketsSDK.version = require('../package.json').version;

// Convenience factory function
OddSocketsSDK.create = function(config) {
  return new OddSockets(config);
};

// PubNub compatibility factory
OddSocketsSDK.createPubNubCompat = function(config) {
  return new PubNubCompat(config);
};

// Export the main object
module.exports = OddSocketsSDK;
