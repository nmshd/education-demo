export interface SendCustomMessageRequest {
  username?: string;
  content?: Content;
  attachments?: Attachment[];
  data?: {
    insurance: string;
    sum: number;
  };
}

interface Content extends Record<string, any> {
  subject: string;
  body: string;
}

export interface Attachment extends Record<string, any> {
  title: string;
  description: string;
  path: string;
  filename: string;
}
