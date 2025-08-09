import { randomBytes } from 'node:crypto';
import { handleError } from '@utils/handlerUtils.ts';
import { tenYearsIn_ms, twelveHoursIn_ms } from '@utils/timeUtils.ts';
import * as bcrypt from 'bcrypt-ts';
import { logger } from './loggerUtil.ts';


const bcryptSaltRounds = 10;


export const generateRandomSessionID = (l = 56) => {
  logger.debug("Generating random Session ID")
  const randomSessionID = Buffer.from(randomBytes(l)).toString('hex');
  logger.debug("Done!")
  return randomSessionID;
}


export const createSessionCookieData = (rememberSession: Boolean) => {

  logger.debug("Creating cookie data with session ID and requested max age: " + (rememberSession) ? "10 years" : "session cookie")

  const sessionID = generateRandomSessionID(64);

  const cookieOptions : {[k: string]: any} = {
    httpOnly: true
  };

  const sessionExpireTime = new Date(0);

  if (rememberSession) {
    sessionExpireTime.setUTCMilliseconds(Date.now() + tenYearsIn_ms);
    cookieOptions.maxAge = tenYearsIn_ms;
  }
  else {
    sessionExpireTime.setUTCMilliseconds(Date.now() + twelveHoursIn_ms);
  }

  logger.debug("Cookie created!")
  return [sessionID, cookieOptions, sessionExpireTime] as const;
}


export const checkIfPasswordIsCorrect = async (submittedPassword: string, correctHashedPassword: string) => {
  return await bcrypt.compare(submittedPassword, correctHashedPassword).catch(err => handleError(err, 'bcrypt Compare Passwords'))
}


export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, bcryptSaltRounds).catch(err => handleError(err, 'Hashing password'));
}
