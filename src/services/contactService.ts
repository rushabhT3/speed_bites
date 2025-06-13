import { PrismaClient, Contact } from "@prisma/client";
import {
  IdentifyRequestBody,
  IdentifyResponse,
  ContactData,
  LinkPrecedence,
  CreateContactData,
} from "../types";
import {
  isPrimaryContact,
  sortByCreatedAt,
  extractUniqueEmails,
  extractUniquePhoneNumbers,
} from "../utils/contactUtils";

const prisma = new PrismaClient();

export class ContactService {
  async identify(data: IdentifyRequestBody): Promise<IdentifyResponse> {
    const { email, phoneNumber } = data;

    if (!email && !phoneNumber) {
      throw new Error("Either email or phoneNumber must be provided");
    }

    // Find existing contacts that match email or phone
    const existingContacts = await this.findMatchingContacts(
      email,
      phoneNumber
    );

    if (existingContacts.length === 0) {
      // Scenario 1: No existing contact
      return this.createNewPrimaryContact(email, phoneNumber);
    }

    // Get all primary contacts from the matches
    const primaryContacts = this.getPrimaryContacts(existingContacts);

    if (primaryContacts.length === 1) {
      const primaryContact = primaryContacts[0];

      // Check if exact match exists
      const exactMatch = existingContacts.find(
        (contact) =>
          contact.email === email && contact.phoneNumber === phoneNumber
      );

      if (exactMatch) {
        // Scenario 3: Complete match - return existing data
        return this.consolidateContactData(primaryContact.id);
      } else {
        // Scenario 2: Partial match - create secondary contact
        return this.createSecondaryContact(
          primaryContact.id,
          email,
          phoneNumber
        );
      }
    } else if (primaryContacts.length > 1) {
      // Scenario 4: Two separate primaries match - merge them
      return this.mergePrimaryContacts(primaryContacts, email, phoneNumber);
    }

    // This shouldn't happen, but handle it gracefully
    return this.consolidateContactData(
      existingContacts[0].linkedId || existingContacts[0].id
    );
  }

  private async findMatchingContacts(
    email?: string,
    phoneNumber?: string
  ): Promise<ContactData[]> {
    const whereConditions = [];

    if (email) {
      whereConditions.push({ email });
    }

    if (phoneNumber) {
      whereConditions.push({ phoneNumber });
    }

    const contacts = (await prisma.contact.findMany({
      where: {
        OR: whereConditions,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    })) as ContactData[];

    // Also get all contacts linked to these contacts
    const linkedContactIds = new Set<number>();

    for (const contact of contacts) {
      if (contact.linkPrecedence === "primary") {
        // Get all secondary contacts linked to this primary
        const secondaryContacts = (await prisma.contact.findMany({
          where: {
            linkedId: contact.id,
            deletedAt: null,
          },
        })) as ContactData[];
        secondaryContacts.forEach((c) => linkedContactIds.add(c.id));
        linkedContactIds.add(contact.id);
      } else if (contact.linkedId) {
        // Get the primary contact and all its linked contacts
        const primaryContact = (await prisma.contact.findUnique({
          where: { id: contact.linkedId },
        })) as ContactData | null;
        if (primaryContact) {
          linkedContactIds.add(primaryContact.id);
          const allLinkedContacts = (await prisma.contact.findMany({
            where: {
              linkedId: primaryContact.id,
              deletedAt: null,
            },
          })) as ContactData[];
          allLinkedContacts.forEach((c) => linkedContactIds.add(c.id));
        }
        linkedContactIds.add(contact.id);
      }
    }

    // Return all unique contacts
    const allRelevantContacts = (await prisma.contact.findMany({
      where: {
        id: { in: Array.from(linkedContactIds) },
        deletedAt: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    })) as ContactData[];

    return allRelevantContacts.length > 0 ? allRelevantContacts : contacts;
  }

  private getPrimaryContacts(contacts: Contact[]): Contact[] {
    const primaryContacts = contacts.filter(
      (c) => c.linkPrecedence === "primary"
    );
    const linkedIds = [
      ...new Set(contacts.filter((c) => c.linkedId).map((c) => c.linkedId)),
    ];

    // Get primary contacts that are referenced by linkedId
    const referencedPrimaries = contacts.filter(
      (c) => linkedIds.includes(c.id) && c.linkPrecedence === "primary"
    );

    return [...new Set([...primaryContacts, ...referencedPrimaries])];
  }

  private async createNewPrimaryContact(
    email?: string,
    phoneNumber?: string
  ): Promise<IdentifyResponse> {
    const newContact = (await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "primary",
      },
    })) as ContactData;

    return {
      contact: {
        primaryContactId: newContact.id,
        emails: email ? [email] : [],
        phoneNumbers: phoneNumber ? [phoneNumber] : [],
        secondaryContactIds: [],
      },
    };
  }

  private async createSecondaryContact(
    primaryId: number,
    email?: string,
    phoneNumber?: string
  ): Promise<IdentifyResponse> {
    (await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkedId: primaryId,
        linkPrecedence: "secondary",
      },
    })) as ContactData;

    return this.consolidateContactData(primaryId);
  }

  private async mergePrimaryContacts(
    primaryContacts: ContactData[],
    email?: string,
    phoneNumber?: string
  ): Promise<IdentifyResponse> {
    // Sort by createdAt to find the oldest (which remains primary)
    const sortedPrimaries = sortByCreatedAt(primaryContacts);

    const oldestPrimary = sortedPrimaries[0];
    const contactsToConvert = sortedPrimaries.slice(1);

    // Convert newer primaries to secondary
    for (const contact of contactsToConvert) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          linkedId: oldestPrimary.id,
          linkPrecedence: "secondary",
        },
      });

      // Update all contacts that were linked to this primary
      await prisma.contact.updateMany({
        where: { linkedId: contact.id },
        data: { linkedId: oldestPrimary.id },
      });
    }

    // Check if we need to create a new contact with the provided email/phone
    const needsNewContact = await this.checkIfNewContactNeeded(
      oldestPrimary.id,
      email,
      phoneNumber
    );

    if (needsNewContact) {
      (await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkedId: oldestPrimary.id,
          linkPrecedence: "secondary",
        },
      })) as ContactData;
    }

    return this.consolidateContactData(oldestPrimary.id);
  }

  private async checkIfNewContactNeeded(
    primaryId: number,
    email?: string,
    phoneNumber?: string
  ): Promise<boolean> {
    const allLinkedContacts = (await prisma.contact.findMany({
      where: {
        OR: [{ id: primaryId }, { linkedId: primaryId }],
        deletedAt: null,
      },
    })) as ContactData[];

    // Check if exact combination already exists
    const exactMatch = allLinkedContacts.find(
      (contact) =>
        contact.email === email && contact.phoneNumber === phoneNumber
    );

    return !exactMatch;
  }

  private async consolidateContactData(
    primaryId: number
  ): Promise<IdentifyResponse> {
    const primaryContact = (await prisma.contact.findUnique({
      where: { id: primaryId },
    })) as ContactData | null;

    if (!primaryContact) {
      throw new Error("Primary contact not found");
    }

    const secondaryContacts = (await prisma.contact.findMany({
      where: {
        linkedId: primaryId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    })) as ContactData[];

    const allContacts = [primaryContact, ...secondaryContacts];

    // Extract unique emails and phone numbers using utility functions
    const emails = extractUniqueEmails(primaryContact, secondaryContacts);
    const phoneNumbers = extractUniquePhoneNumbers(
      primaryContact,
      secondaryContacts
    );

    return {
      contact: {
        primaryContactId: primaryId,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaryContacts.map((c) => c.id),
      },
    };
  }
}
