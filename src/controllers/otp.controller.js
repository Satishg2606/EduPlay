import { OTP } from "../models/otp.model.js";
import { User } from "../models/user.model.js";
import nodemailer from "nodemailer"
import crypto from "crypto";
import bcrypt from "bcrypt";

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate OTP
const generateOTP = () => crypto.randomInt(100000, 1000000); 
// Send OTP to email
export const sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the email already exists in the user collection
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // const existingOTP = await OTP.findOne({email:email});
    // if(existingOTP){
    //    return res.status(200).json({ message: "OTP already sent." });
    // }
    // Generate OTP and save it to the database
    const otp = generateOTP();
    
    const otpEntry = new OTP({ email, otp });
    await otpEntry.save();

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'OTP for Registration',
      text: `Your OTP for registration is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Error sending OTP." });
      }
      console.log("OTP SENT.")
      res.status(200).json({ message: "OTP sent to email." });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// // Verify OTP and Register User
// export const verifyOTP = async (req, res) => {
//   const { email, otp, username, fullName, password, avatar } = req.body;

//   try {
//     // Check if OTP is valid
//     const otpEntry = await OTP.findOne({ email, otp });
//     if (!otpEntry) {
//       return res.status(400).json({ message: "Invalid or expired OTP." });
//     }

//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Register the user
//     const user = new User({
//       email,
//       username,
//       fullName,
//       password: hashedPassword,
//       avatar,
//     });

//     await user.save();

//     // Delete the OTP after successful registration
//     await OTP.deleteOne({ email, otp });

//     res.status(201).json({ message: "User registered successfully." });
//   } catch (err) {
//     res.status(500).json({ message: "Server error." });
//   }
// };
