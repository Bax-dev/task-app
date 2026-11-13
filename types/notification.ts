export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  items: Notification[];
  nextCursor: string | null;
  unreadCount: number;
}
