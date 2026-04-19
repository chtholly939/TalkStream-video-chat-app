import nodemailer from "nodemailer";

export const sendOtpEmail = async (to, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"TalkStream" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your OTP Code",
      html: `
        <h2>Your OTP Code</h2>
        <p>Your verification code is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      `,
    });

    console.log("OTP email sent to:", to);
  } catch (error) {
    console.log("Error sending email:", error);
    throw new Error("Email sending failed");
  }
};