import { Request, Response } from "express";
import { ContactService } from "../services/contactService";
import { IdentifyRequestBody } from "../types";
import { isValidEmail, isValidPhoneNumber } from "../utils/contactUtils";

export class IdentifyController {
  private contactService: ContactService;

  constructor() {
    this.contactService = new ContactService();
  }

  async identify(req: Request, res: Response): Promise<void> {
    try {
      const { email, phoneNumber }: IdentifyRequestBody = req.body;

      // Validate input
      if (!email && !phoneNumber) {
        res.status(400).json({
          error: "Either email or phoneNumber must be provided",
        });
        return;
      }

      // Validate email format if provided
      if (email && !isValidEmail(email)) {
        res.status(400).json({
          error: "Invalid email format",
        });
        return;
      }

      // Validate phone number format if provided
      if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
        res.status(400).json({
          error: "Invalid phone number format",
        });
        return;
      }

      const result = await this.contactService.identify({ email, phoneNumber });

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in identify endpoint:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
}
