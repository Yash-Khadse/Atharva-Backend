require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const PORT = process.env.PORT || 7887;

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensure email is unique
  },
  phoneNumber: {
    type: String, // Assuming phone number is stored as string for simplicity
    required: true,
    validate: {
      validator: function (v) {
        // Regular expression to validate phone number format (10 digits)
        return /\d{10}/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid phone number! Please provide a 10-digit phone number.`,
    },
  },
  password: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  roll: {
    type: String,
    required: true,
    unique: true,
  },
  semester: {
    type: String,
    required: true,
  },
  batch: {
    type: String,
    required: true,
  },
});

// Create the User model
const User = mongoose.model("User", UserSchema);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    // process.exit(1);
  }
};

app.get("/", async (req, res) => {
  res.send("Hello");
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Listing on port ${PORT}`);
  });
});

// Route to handle user login
app.post("/login", async (req, res) => {
  try {
    // Extract roll number and password from request body
    const { roll, password } = req.body;

    // Find the user with the provided roll number
    const user = await User.findOne({ roll });

    // Check if user exists and password is correct
    if (!user || user.password !== password) {
      // If user does not exist or password is incorrect, send unauthorized response
      return res.status(401).json({ error: "Invalid roll number or password" });
    }

    // Send response indicating successful login
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to handle user signup
app.post("/signup", async (req, res) => {
  try {
    // Extract required fields from request body
    const { name, roll, email, phoneNumber, password, semester, batch } =
      req.body;

    // // Check if phoneNumber is provided
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Create a new User instance
    const newUser = new User({
      name,
      roll,
      email,
      phoneNumber,
      password,
      semester,
      batch,
    });

    // Save the new user to the database
    await newUser.save();

    // Send response with created user data
    res.status(201).json(newUser).message("user registered");
  } catch (error) {
    console.error("Error saving user:", error);

    // Check if the error is a validation error
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    } else if (error.code === 11000 && error.keyPattern.email) {
      // Check if the error is a duplicate key error for email
      return res.status(400).json({ error: "Email already exists" });
    } else if (error.code === 11000 && error.keyPattern.roll) {
      // Check if the error is a duplicate key error for roll number
      return res.status(400).json({ error: "Roll number already exists" });
    } else {
      // For other errors, return internal server error
      return res.status(500).json({ error: "Internal server error" });
    }
  }
});
