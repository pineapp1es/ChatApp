import express from 'express';
import {
    cookieLogin,
    signupUser,
    loginUser,
    logoutUser
    } from '@controllers/authController.ts';


const router = express.Router();

router.post("/login", loginUser);
router.post("/cookieLogin", cookieLogin);
router.post("/signup", signupUser);
router.post("/logout", logoutUser);

export default router;
