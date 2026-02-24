import express from "express";

import { login, logout, refreshToken, register } from "#controllers/auth.controller.js";

const authRoutes = express.Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.post("/refresh", refreshToken);

export default authRoutes;
