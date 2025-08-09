import { Request, Response } from 'express';
import { loginService, cookieLoginService, signupService, logoutService } from '@services/authServices.ts';
import { RESPONSE_CODES, sendResponseWithStatus, sendResponseWithStatusAndJSON } from '@utils/httpUtils.ts';
import { logger } from "@utils/loggerUtil.ts";


export const cookieLogin = async (req: Request, res: Response) => {
  logger.debug("Recieved Cookie Login Request.")
  const cookies = req.cookies;
  const sessionID = cookies.sessionID as string;

  const [status, cookieOptions] = await cookieLoginService(sessionID);

  if (status == RESPONSE_CODES.NOT_FOUND) {
    res.clearCookie('sessionID');
  }
  else {
    res.cookie('sessionID', sessionID, cookieOptions);
  }

  sendResponseWithStatus(res, status);
  logger.debug("Cookie Login Response Sent.\n")

};


export const loginUser = async (req: Request, res: Response) => {
  logger.debug("Recieved Login Request.")
  const username = req.body.username;
  const password = req.body.password;
  const rememberSession = req.body.rememberSession;

  const [status, sessionID, cookieOptions] = await loginService(username, password, rememberSession);

  res.cookie('sessionID', sessionID, cookieOptions)
  sendResponseWithStatus(res, status)

  logger.debug("Login Response Sent.\n")
}


export const signupUser = async (req: Request, res: Response) => {
  logger.debug("Recieved Signup Request.")
  const username = req.body.username;
  const password = req.body.password;

  const status = await signupService(username, password);

  sendResponseWithStatus(res, status);
  logger.debug("Signup Response Sent.\n")
};


export const logoutUser = async (req: Request, res: Response) => {
  logger.debug("Recieved Logout Request.")
  if (!req.cookies) sendResponseWithStatus(res, RESPONSE_CODES.BAD_REQUEST)
  if (!req.cookies.sessionID) sendResponseWithStatus(res, RESPONSE_CODES.BAD_REQUEST)

  await logoutService(req.cookies.sessionID);

  res.clearCookie('sessionID');
  sendResponseWithStatus(res, RESPONSE_CODES.OK);
  logger.debug("Logout Response Sent.\n")
};
