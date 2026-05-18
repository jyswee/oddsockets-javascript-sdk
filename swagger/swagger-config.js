const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'OddSockets JavaScript SDK Documentation',
    version: '1.0.0',
    description: `# OddSockets JavaScript SDK - Interactive Documentation

## Overview
The OddSockets JavaScript SDK provides a simple, powerful interface for real-time messaging that **automatically handles the Manager → Worker cluster architecture** behind the scenes.

### Key Benefits
- **Zero Complexity**: No need to understand load balancing
- **PubNub Compatible**: Drop-in replacement for PubNub
- **Automatic Failover**: Built-in reconnection and error handling
- **Session Stickiness**: Consistent worker assignments
- **Better Performance**: 50% lower latency than PubNub
- **Cost Effective**: No per-message pricing

## Quick Start

### Installation
\`\`\`bash
npm install @oddsockets/javascript-sdk
# or
yarn add @oddsockets/javascript-sdk
\`\`\`

### Basic Usage
\`\`\`javascript
const OddSockets = require('@oddsockets/javascript-sdk');

const client = new OddSockets({
  apiKey: 'ak_live_1234567890abcdef'
});

const channel = client.channel('chat-room');
channel.subscribe(message => {
  console.log('Received:', message);
});

channel.publish('Hello, World!');
\`\`\`

### PubNub Migration
\`\`\`javascript
// Replace this:
const pubnub = new PubNub({
  publishKey: 'pub-c-...',
  subscribeKey: 'sub-c-...'
});

// With this:
const { PubNubCompat } = require('@oddsockets/javascript-sdk');
const pubnub = new PubNubCompat({
  publishKey: 'ak_live_1234567890abcdef',
  subscribeKey: 'ak_live_1234567890abcdef'
});
// All your existing PubNub code works unchanged!
\`\`\`

## Architecture (Hidden from You)

The SDK automatically handles the complex cluster architecture:

1. **SDK contacts Manager** for worker assignment
2. **Manager returns worker URL** with session stickiness
3. **SDK connects to assigned worker** transparently
4. **All operations** happen on the assigned worker
5. **Automatic failover** if worker becomes unavailable

You never need to worry about any of this complexity!

## Interactive Examples

Use the "Try it out" buttons below to test SDK methods with real examples.`,
    contact: {
      name: 'OddSockets Team',
      email: 'support@oddsockets.com',
      url: 'https://oddsockets.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'https://sdk-demo.oddsockets.com',
      description: 'SDK Demo Server - Try the examples here!'
    },
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server'
    }
  ],
  components: {
    schemas: {
      // SDK Configuration Schemas
      OddSocketsConfig: {
        type: 'object',
        required: ['apiKey'],
        properties: {
          apiKey: {
            type: 'string',
            description: 'Your OddSockets API key',
            example: 'ak_live_1234567890abcdef',
            pattern: '^ak_(live|test)_[a-zA-Z0-9]{16,}$'
          },
          managerUrl: {
            type: 'string',
            description: 'Manager URL (optional)',
            example: 'https://manager1.oddsockets.tyga.network',
            default: 'https://manager1.oddsockets.tyga.network'
          },
          userId: {
            type: 'string',
            description: 'User ID (optional, defaults to API key user)',
            example: 'user123'
          },
          autoConnect: {
            type: 'boolean',
            description: 'Auto-connect on initialization',
            default: true
          },
          options: {
            type: 'object',
            description: 'Additional connection options',
            properties: {
              timeout: {
                type: 'integer',
                description: 'Connection timeout in milliseconds',
                default: 10000
              },
              transports: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['websocket', 'polling']
                },
                description: 'Allowed transport methods',
                default: ['websocket', 'polling']
              }
            }
          }
        }
      },
      
      PubNubCompatConfig: {
        type: 'object',
        required: ['publishKey'],
        properties: {
          publishKey: {
            type: 'string',
            description: 'Your OddSockets API key (replaces PubNub publishKey)',
            example: 'ak_live_1234567890abcdef'
          },
          subscribeKey: {
            type: 'string',
            description: 'Same as publishKey for OddSockets (PubNub compatibility)',
            example: 'ak_live_1234567890abcdef'
          },
          userId: {
            type: 'string',
            description: 'User ID',
            example: 'user123'
          },
          managerUrl: {
            type: 'string',
            description: 'OddSockets manager URL',
            example: 'https://manager1.oddsockets.tyga.network'
          }
        }
      },
      
      // Channel Operation Schemas
      SubscribeOptions: {
        type: 'object',
        properties: {
          maxHistory: {
            type: 'integer',
            description: 'Maximum history messages to retain',
            default: 100,
            minimum: 0,
            maximum: 1000
          },
          retainHistory: {
            type: 'boolean',
            description: 'Whether to retain message history locally',
            default: true
          },
          enablePresence: {
            type: 'boolean',
            description: 'Enable presence tracking for this channel',
            default: false
          }
        }
      },
      
      PublishOptions: {
        type: 'object',
        properties: {
          ttl: {
            type: 'integer',
            description: 'Time to live in seconds (0 = no expiry)',
            minimum: 0,
            example: 3600
          },
          metadata: {
            type: 'object',
            description: 'Additional message metadata',
            example: {
              priority: 'high',
              category: 'notification',
              source: 'sdk'
            }
          }
        }
      },
      
      // Message Schemas
      MessageContent: {
        oneOf: [
          {
            type: 'string',
            example: 'Hello, World!'
          },
          {
            type: 'object',
            example: {
              type: 'notification',
              title: 'New Message',
              body: 'You have a new message',
              data: { userId: 'user123' }
            }
          },
          {
            type: 'array',
            example: ['item1', 'item2', 'item3']
          }
        ],
        description: 'Message content (string, object, or array)'
      },
      
      ReceivedMessage: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique message ID',
            example: 'msg_1234567890abcdef'
          },
          channel: {
            type: 'string',
            description: 'Channel name',
            example: 'chat-room-1'
          },
          message: {
            $ref: '#/components/schemas/MessageContent'
          },
          publisher: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                example: 'user123'
              },
              apiKeyId: {
                type: 'string',
                example: 'ak_live_1234567890'
              }
            }
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-09T07:15:35.123Z'
          },
          ttl: {
            type: 'integer',
            description: 'Time to live in seconds',
            example: 3600
          },
          metadata: {
            type: 'object',
            description: 'Message metadata',
            example: {
              priority: 'high',
              category: 'notification'
            }
          }
        }
      },
      
      PublishResult: {
        type: 'object',
        properties: {
          messageId: {
            type: 'string',
            description: 'Unique message ID',
            example: 'msg_1234567890abcdef'
          },
          channel: {
            type: 'string',
            description: 'Channel name',
            example: 'chat-room-1'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-09T07:15:35.123Z'
          },
          subscriberCount: {
            type: 'integer',
            description: 'Number of subscribers who received the message',
            example: 25
          }
        }
      },
      
      // Presence Schemas
      PresenceInfo: {
        type: 'object',
        properties: {
          channel: {
            type: 'string',
            example: 'chat-room-1'
          },
          occupancy: {
            type: 'integer',
            description: 'Number of users in channel',
            example: 15
          },
          occupants: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  example: 'user123'
                },
                joinedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-09T07:10:00.000Z'
                },
                state: {
                  type: 'object',
                  description: 'User state object',
                  example: {
                    status: 'online',
                    typing: false
                  }
                }
              }
            }
          }
        }
      },
      
      UserState: {
        type: 'object',
        description: 'User state object (flexible schema)',
        example: {
          status: 'online',
          typing: true,
          mood: 'happy',
          lastActive: '2025-01-09T07:15:35.123Z'
        }
      },
      
      // History Schemas
      HistoryOptions: {
        type: 'object',
        properties: {
          count: {
            type: 'integer',
            description: 'Number of messages to retrieve',
            default: 50,
            minimum: 1,
            maximum: 500
          },
          start: {
            type: 'string',
            format: 'date-time',
            description: 'Start time (ISO string)',
            example: '2025-01-09T06:00:00.000Z'
          },
          end: {
            type: 'string',
            format: 'date-time',
            description: 'End time (ISO string)',
            example: '2025-01-09T07:00:00.000Z'
          }
        }
      },
      
      // Connection State Schemas
      ConnectionState: {
        type: 'string',
        enum: ['disconnected', 'connecting', 'connected', 'reconnecting'],
        description: 'Current connection state'
      },
      
      WorkerInfo: {
        type: 'object',
        properties: {
          workerId: {
            type: 'string',
            description: 'Assigned worker ID',
            example: 'worker-3000'
          },
          workerUrl: {
            type: 'string',
            description: 'Assigned worker URL',
            example: 'https://worker-3000.oddsockets.com'
          }
        }
      },
      
      // Event Schemas
      ConnectionEvent: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['connecting', 'connected', 'disconnected', 'error', 'reconnecting'],
            description: 'Event type'
          },
          data: {
            type: 'object',
            description: 'Event data (varies by event type)'
          }
        }
      },
      
      // Error Schemas
      SDKError: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'OddSocketsError'
          },
          message: {
            type: 'string',
            example: 'Failed to connect to worker'
          },
          code: {
            type: 'string',
            example: 'CONNECTION_FAILED'
          },
          details: {
            type: 'object',
            description: 'Additional error details'
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Client',
      description: 'OddSockets client initialization and connection management'
    },
    {
      name: 'Channels',
      description: 'Channel operations (subscribe, publish, presence)'
    },
    {
      name: 'PubNub Compatibility',
      description: 'PubNub-compatible API for easy migration'
    },
    {
      name: 'Examples',
      description: 'Interactive code examples and tutorials'
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: ['./swagger/*.js'], // paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
