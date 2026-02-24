import { EventEmitter } from "events";

import type { RedisClientType } from "redis";

import { redisConnection } from "#connections/redis.js";
import logger from "#lib/helpers/winston.helpers.js";

class RedisPubSub extends EventEmitter {
  private publisher: null | RedisClientType;
  private subscriber: null | RedisClientType;
  private readonly subscriptions: Set<string>;

  constructor() {
    super();
    this.publisher = null;
    this.subscriber = null;
    this.subscriptions = new Set<string>();
  }

  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  initialize(): void {
    this.publisher = redisConnection.getPublisher();
    this.subscriber = redisConnection.getSubscriber();

    if (!this.subscriber) {
      throw new Error("Redis subscriber not initialized");
    }

    this.subscriber.on("message", (channel: string, message: string) => {
      try {
        const parsedMessage = JSON.parse(message);
        this.emit("message", channel, parsedMessage);
        this.emit(`message:${channel}`, parsedMessage);
      } catch (error) {
        logger.error("Failed to parse pub/sub message:", error);
      }
    });
  }

  async psubscribe(pattern: string): Promise<boolean> {
    try {
      if (!this.subscriber) {
        throw new Error("Redis subscriber not initialized");
      }
      await this.subscriber.pSubscribe(pattern, (message: string, channel: string) => {
        try {
          const parsedMessage = JSON.parse(message);
          this.emit("message", channel, parsedMessage);
          this.emit(`message:${channel}`, parsedMessage);
        } catch (error) {
          logger.error("Failed to parse pub/sub message:", error);
        }
      });
      logger.debug(`Pattern subscribed: ${pattern}`);
      return true;
    } catch (error) {
      logger.error("Redis psubscribe error:", error);
      return false;
    }
  }

  async publish<T>(channel: string, data: T): Promise<boolean> {
    try {
      if (!this.publisher) {
        throw new Error("Redis publisher not initialized");
      }
      const message = JSON.stringify(data);
      await this.publisher.publish(channel, message);
      logger.debug(`Published message to channel: ${channel}`);
      return true;
    } catch (error) {
      logger.error("Redis publish error:", error);
      return false;
    }
  }

  async subscribe(channel: string): Promise<boolean> {
    try {
      if (!this.subscriber) {
        throw new Error("Redis subscriber not initialized");
      }

      await this.subscriber.subscribe(channel, (message: string) => {
        try {
          const parsedMessage = JSON.parse(message);
          this.emit("message", channel, parsedMessage);
          this.emit(`message:${channel}`, parsedMessage);
        } catch (error) {
          logger.error("Failed to parse pub/sub message:", error);
        }
      });
      this.subscriptions.add(channel);
      logger.debug(`Subscribed to channel: ${channel}`);
      return true;
    } catch (error) {
      logger.error("Redis subscribe error:", error);
      return false;
    }
  }

  async unsubscribe(channel: string): Promise<boolean> {
    try {
      if (!this.subscriber) {
        throw new Error("Redis subscriber not initialized");
      }
      await this.subscriber.unsubscribe(channel);
      this.subscriptions.delete(channel);
      logger.debug(`Unsubscribed from channel: ${channel}`);
      return true;
    } catch (error) {
      logger.error("Redis unsubscribe error:", error);
      return false;
    }
  }
}

const redisPubSub = new RedisPubSub();
export default redisPubSub;
