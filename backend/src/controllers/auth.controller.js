import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import cloudinary from "../lib/cloudinary.js";
import { sendOtpEmail } from "../lib/mail.js";

export async function signup(req, res) {
  const { email, password, fullName } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists, please use a diffrent one" });
    }

    const idx = Math.floor(Math.random() * 100) + 1; // generate a num between 1-100
    const randomAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,

      otp: otp,
      otpExpires: Date.now() + 10 * 60 * 1000, // 10 mins
    });

    await sendOtpEmail(email, otp);

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user created for ${newUser.fullName}`);
    } catch (error) {
      console.log("Error creating Stream user:", error);
    }

    return res.status(201).json({
      success: true,
      message: "OTP generated successfully",
    });
    
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid email or password" });

    res.status(201).json({
      success: true,
      message: "OTP sent to email",
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logout successful" });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullName, bio, location, profilePic } = req.body;

    if (!fullName || !bio || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !location && "location",
        ].filter(Boolean),
      });
    }

    let imageUrl;

    if (profilePic) {
      const uploadRes = await cloudinary.uploader.upload(profilePic, {
        folder: "talkstream/profile_pics",
      });
      imageUrl = uploadRes.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        bio,
        location,
        profilePic: imageUrl || profilePic,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic,
        location: updatedUser.location, // 🔥 THIS IS THE KEY
      });
    } catch (err) {
      console.log("Stream update error:", err.message);
    }

    res.status(200).json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    // 🔍 find user with this OTP
    const user = await User.findOne({ otp });

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ⏰ check expiry
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // ✅ mark verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    // 🔐 generate JWT (login user)
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    // 🍪 set cookie
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict", // for local dev
      secure: false,
    });

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.log("Error in verifyOtp:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}