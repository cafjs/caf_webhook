# Caf.js

Co-design cloud assistants with your web app and IoT devices.

See https://www.cafjs.com

## Library to handle web hook notifications

[![Build Status](https://github.com/cafjs/caf_webhook/actions/workflows/push.yml/badge.svg)](https://github.com/cafjs/caf_webhook/actions/workflows/push.yml)


This library provides a plugin to handle external web hook notifications, and map them into our internal `pubsub` notifications.

## API

Configuration is managed by one CA  (e.g., `root-admin`) by using a SharedMap with a well known name (e.g., `webhook`) to store the routing table.

Bindings in that table are of the form `id -> channel_id`, where `id` is provided in the webhook target URL path, e.g., `https://root-hello.cafjs.com/webhook/${id}` that was previously configured. The `channel_id` is the name of the `pubsub` channel to forward the notification.

See {@link module:caf_webhook/proxy_webhook}

## Configuration Example

### framework.json

See {@link module:caf_webhook/plug_webhook}
```
    {
     "name": "top",
     "components" : [
        {
            "name": "pubsub"
        },
        {
            "module": "caf_webhook/plug",
            "name": "webhook",
            "description": "Webhook plugin\n Properties: ",
             "env": {
                         "webhookCA": "process.env.WEBHOOK_CA||root-admin",
                         "webhookMap": "process.env.WEBHOOK_MAP||webhook"
                    }
        }
      ]
    }
```
### ca.json

See {@link module:caf_webhook/plug_ca_webhook}
