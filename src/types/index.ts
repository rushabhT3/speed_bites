// src/types/index.ts

export interface IdentifyRequestBody {
  // ? meaning optional fields
  email?: string;
  phoneNumber?: string;
}

export interface IdentifyResponse {
  contact: {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export interface ContactData {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type LinkPrecedence = "primary" | "secondary";

export interface CreateContactData {
  email?: string;
  phoneNumber?: string;
  linkedId?: number;
  linkPrecedence: LinkPrecedence;
}

