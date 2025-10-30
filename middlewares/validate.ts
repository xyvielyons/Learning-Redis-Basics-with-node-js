import type { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const Validate = <T>(schema: ZodSchema<T>) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.format(), // ✅ properly formatted Zod errors
    });
  }

  next();
};
