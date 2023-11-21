// jwtMiddleware.js

import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwtConfig.js'; // Replace with your own secret key

const {sign, verify} = jwt;
const {secretKey} = jwtConfig;
// Middleware to sign a JWT token
export const signToken = (payload, expiresIn = '2h') => {
  return sign(payload, secretKey, { expiresIn });
};

// Middleware to verify a JWT token
export const verifyToken = (req, res, next) => {
//   const token = req.header('Authorization');


  //read the authToken from cookie
  const token = req.cookies.authToken;
  // console.log("token", token);  
  // console.log("token", token);

  //extract token from Authorization header that contains bearer token
    // const token = req.header('Authorization').split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    req.user = decoded; // Set the decoded user information in the request object
    next();
  });
};

export default { signToken, verifyToken };