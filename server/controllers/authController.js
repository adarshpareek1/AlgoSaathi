import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { OAuth2Client } from 'google-auth-library'

export const register = async (req, res) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error("JWT_SECRET is missing in .env");
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      success: true, 
      token, 
      user: { 
        id: user._id, 
        name: user.username, 
        email: user.email, 
        avatar: user.avatar 
      } 
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server Error during Registration" });
  }
};

export const login = async (req, res) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error("JWT_SECRET is missing in .env");
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user._id, 
        name: user.username, 
        email: user.email, 
        avatar: user.avatar 
      } 
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error during Login" });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const JWT_SECRET = process.env.JWT_SECRET;
    
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, picture } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        username: name, 
        email,
        password: hashedPassword,
        avatar: picture
      });
    }

    const appToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token: appToken,
      user: {
        id: user._id,
        name: user.username, 
        email: user.email,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(400).json({ message: "Google Login Failed: " + error.message });
  }
};