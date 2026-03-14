import type { Server } from "socket.io";

import logger from "../lib/helpers/winston.helpers.js";

export type NotificationType =
  | "inquiry_received"
  | "inquiry_replied"
  | "listing_approved"
  | "listing_sold"
  | "price_changed"
  | "booking_confirmed";

export interface Notification {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: Date;
}

class NotificationService {
  private io: Server | null = null;

  init(io: Server): void {
    this.io = io;
    logger.info("NotificationService initialized");
  }

  sendToUser(userId: string, notification: Notification): void {
    if (!this.io) {
      logger.error("NotificationService not initialized");
      return;
    }

    this.io.to(`user:${userId}`).emit("notification", notification);

    logger.info(`Notification sent → userId: ${userId} | type: ${notification.type}`);
  }

  sendToAgents(notification: Notification): void {
    if (!this.io) return;
    this.io.to("agents").emit("notification", notification);
    logger.info(`Notification sent → all agents | type: ${notification.type}`);
  }

  sendToAdmins(notification: Notification): void {
    if (!this.io) return;
    this.io.to("admins").emit("notification", notification);
    logger.info(`Notification sent → all admins | type: ${notification.type}`);
  }

  sendToListingWatchers(listingId: string, notification: Notification): void {
    if (!this.io) return;
    this.io.to(`listing:${listingId}`).emit("notification", notification);
    logger.info(`Notification sent → listing watchers: ${listingId} | type: ${notification.type}`);
  }

  notifyAgentOfInquiry(
    agentId: string,
    buyerName: string,
    listingTitle: string,
    listingId: string,
  ): void {
    this.sendToUser(agentId, {
      type: "inquiry_received",
      title: "New Inquiry",
      message: `${buyerName} is interested in "${listingTitle}"`,
      data: { listingId },
      createdAt: new Date(),
    });
  }

  notifyBuyerOfReply(
    buyerId: string,
    agentName: string,
    listingTitle: string,
    listingId: string,
  ): void {
    this.sendToUser(buyerId, {
      type: "inquiry_replied",
      title: "Agent Replied",
      message: `${agentName} replied to your inquiry about "${listingTitle}"`,
      data: { listingId },
      createdAt: new Date(),
    });
  }

  notifyAgentListingApproved(agentId: string, listingTitle: string, listingId: string): void {
    this.sendToUser(agentId, {
      type: "listing_approved",
      title: "Listing Approved! 🎉",
      message: `Your listing "${listingTitle}" is now live`,
      data: { listingId },
      createdAt: new Date(),
    });
  }

  notifyPriceChange(
    listingId: string,
    listingTitle: string,
    oldPrice: number,
    newPrice: number,
  ): void {
    this.sendToListingWatchers(listingId, {
      type: "price_changed",
      title: "Price Drop! 🔥",
      message: `"${listingTitle}" dropped from $${oldPrice.toLocaleString()} to $${newPrice.toLocaleString()}`,
      data: { listingId, oldPrice, newPrice },
      createdAt: new Date(),
    });
  }
}

export const notificationService = new NotificationService();
