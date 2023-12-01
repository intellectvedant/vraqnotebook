const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetchuser = require('../middleware/fetchuser')

// const jwtsecret = process.env.JWT_SECRET_FILE;
const jwtsecret =
  "you'rebeingtrickedexistenseisrandomreligionisopiumforthemasses";



// ROUTE: 1 - create a user using: POST "/api/auth/createuser". doesn't require auth

router.post(
  "/createuser",
  [
    body("name", "Enter a valid value").isLength({ min: 3 }),
    body("email", "Enter a valid value").isEmail(),
    body("password", "Enter a valid value").isLength({ min: 7 }),
  ],
  async (req, res) => {
    const success = false;
    // if there are errors, return bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success,errors: errors.array() });
    }

    try {
      // check whether the user with this email exists already

      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ success,error: " Sorry a user with this email already exists" });
      }
      const salt = await bcrypt.genSaltSync(10);
      const securePass = await bcrypt.hash(req.body.password, salt);

      // create a new user
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: securePass,
      });

      const data = {
        user: {
          id: user.id,
        },
      };

      const authtoken = jwt.sign(data, jwtsecret);
      const success = true;
      res.json({success, authtoken });

    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server error");
    }

    // .then((user) => res.json(user))
    // .catch((err) => {
    //     console.log(err);
    //     return res.json({ error: 'Please enter a valid email', message: err.message });
    // });
  }
);

// ROUTE: 2 - Authenticate a user using: POST "/api/auth/login". no login required

router.post(
  "/login",
  [
    body("email", "Enter valid email").isEmail(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {

    let success = false;
    // if there are eeors return bad request and errors

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }

    const {email, password} = req.body;

    try {
      let user = await User.findOne({email});
      if (!user) {
        return res
          .status(400)
          .json({success, error: "Please enter valid credentials"});
      }

      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        success = false;
        return res.status(400).json({success, error: "Please enter valid credentials"});
      }

      const data = {
        user: {
          id: user.id,
        },
      };

      const authtoken = jwt.sign(data, jwtsecret);
      success= true;
      res.json({success, authtoken});

    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server error");
    }
  }
);

// ROUTE: 3 - Get loggedin user details using: POST "/api/auth/getuser".login required

router.post("/getuser", fetchuser, async (req, res)=>{

  try {

    userId = req.user.id
    const user = await User.findById(userId).select("-password")
    res.send(user);

    
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server error");
    
  }



})







module.exports = router;
