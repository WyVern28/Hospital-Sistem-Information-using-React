import { Request, Response } from "express";
import * as authService from "../services/auth.service.js";

export async function login(req: Request, res: Response) {
  try {
    const result = await authService.login(req.body);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const result = await authService.register(req.body);

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}