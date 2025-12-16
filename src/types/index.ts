// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

// Email Template types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  created_at: string;
  created_by: string;
}

// Email types
export type EmailStatus = "queued" | "sent" | "failed";

export interface Email {
  id: string;
  to_email: string;
  subject: string;
  template_id: string | null;
  status: EmailStatus;
  provider: string;
  provider_message_id: string | null;
  created_at: string;
  created_by: string;
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavCategory {
  title: string;
  items: NavItem[];
}
