'use strict';

/**
 * @global
 * @typedef {Object | Array | string | number | null | boolean} jsonType
 *
 */

/**
 * @global
 * @typedef {Object} webhookType
 * @property {string} topic A private pubsub topic to publish webhook
 * notifications.
 * @property {string=} secret A secret to authenticate requests.
 */


/**
 * @global
 * @typedef {Object} webhookRequestType
 * @property {string} id An identifier for the webhook.
 * @property {string=} signature An optional signature to authenticate requests.
 * @property {string} body The utf-8 body of the webhook notification.
 */

/**
 * @global
 * @typedef {Object} webhookInfoType
 * @property {string} topic A private pubsub topic to publish webhook
 * notifications.
 * @property {boolean} authenticated True if authentication with a secret is on.
 * @property {boolean=} active Whether it is confirmed to be active. This
 * field is missing if we do not know either way.
 */
