import { Router } from "express";
import UserModel from "../models/User.js";
import { signToken, verifyToken } from "../modules/jwtauth.js";
import ResponseQueue from "../models/ResponseQueue.js";

const router = Router();

router.post('/register', async (req, res)=> {
    try {
        
        const {email, password} = req.body;
        const newUser = UserModel({email, password});
        await newUser.save();
        res.status(201).json({message: "User Registered Successfully"});
    } catch(error) {
        console.error(error);
        res.status(500).json({message: "Registration Failed"});
    }
});

router.post('/login', async (req, res)=> {
    try {
        const { email, password } = req.body;
    
        // Find the user by email
        const user = await UserModel.findByEmail(email);
    
        if (!user || !(await user.comparePassword(password))) {
          return res.status(401).json({ message: 'Invalid email or password.' });
        }
    
        // Sign a JWT token with the user's ID as the payload
        const token = signToken({ userId: user._id });
    
        res.cookie('authToken', token, { httpOnly: true });

        res.json({ user: {id: user._id, email: user.email} });
      } catch (error) {
        console.error('Error during sign in:', error);
        res.status(500).json({ message: 'Internal server error.' });
      }

});

router.post('/logout', (req, res) => {


  // Clear the authToken cookie
  
  // ResponseQueue.clearQueueByUserId(req.user.userId);
  
  res.clearCookie('authToken');
  res.json({ message: 'Logged out successfully.' });
});


export default router;