import { ContactData, LinkPrecedence } from "../types";

/**
 * Checks if a contact is primary
 */
export const isPrimaryContact = (contact: ContactData): boolean => {
  return contact.linkPrecedence === "primary";
};

/**
 * Checks if a contact is secondary
 */
export const isSecondaryContact = (contact: ContactData): boolean => {
  return contact.linkPrecedence === "secondary";
};

/**
 * Gets the primary contact from a group of contacts
 */
export const getPrimaryFromGroup = (
  contacts: ContactData[]
): ContactData | null => {
  return contacts.find(isPrimaryContact) || null;
};

/**
 * Gets all secondary contacts from a group
 */
export const getSecondariesFromGroup = (
  contacts: ContactData[]
): ContactData[] => {
  return contacts.filter(isSecondaryContact);
};

/**
 * Sorts contacts by creation date (oldest first)
 */
export const sortByCreatedAt = (contacts: ContactData[]): ContactData[] => {
  return [...contacts].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
};

/**
 * Checks if two contacts have matching email or phone
 */
export const contactsMatch = (
  contact1: ContactData,
  contact2: ContactData
): boolean => {
  const emailMatch =
    contact1.email && contact2.email && contact1.email === contact2.email;
  const phoneMatch =
    contact1.phoneNumber &&
    contact2.phoneNumber &&
    contact1.phoneNumber === contact2.phoneNumber;

  return !!(emailMatch || phoneMatch);
};

/**
 * Extracts unique emails from contacts, maintaining order (primary first)
 */
export const extractUniqueEmails = (
  primary: ContactData,
  secondaries: ContactData[]
): string[] => {
  const emails: string[] = [];

  // Add primary email first
  if (primary.email && !emails.includes(primary.email)) {
    emails.push(primary.email);
  }

  // Add secondary emails
  for (const contact of secondaries) {
    if (contact.email && !emails.includes(contact.email)) {
      emails.push(contact.email);
    }
  }

  return emails;
};

/**
 * Extracts unique phone numbers from contacts, maintaining order (primary first)
 */
export const extractUniquePhoneNumbers = (
  primary: ContactData,
  secondaries: ContactData[]
): string[] => {
  const phoneNumbers: string[] = [];

  // Add primary phone first
  if (primary.phoneNumber && !phoneNumbers.includes(primary.phoneNumber)) {
    phoneNumbers.push(primary.phoneNumber);
  }

  // Add secondary phone numbers
  for (const contact of secondaries) {
    if (contact.phoneNumber && !phoneNumbers.includes(contact.phoneNumber)) {
      phoneNumbers.push(contact.phoneNumber);
    }
  }

  return phoneNumbers;
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Basic validation - adjust based on your requirements
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return (
    phoneRegex.test(phoneNumber) && phoneNumber.replace(/\D/g, "").length >= 7
  );
};
