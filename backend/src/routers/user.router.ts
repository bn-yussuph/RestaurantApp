import { Router } from "express";
import { sample_users } from "../data";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { User, UserModel } from "../models/user.model";
import { HTTP_BAD_REQUEST } from "../constants/http_status";
import bcrypt from "bcryptjs";
import auth from "../middlewares/auth.mid";
import adminMid from "../middlewares/admin.mid";

const JWT_SECRET = "00f037ae51cd7ba6e878e7c8b6ddf63934ef050f2822112482b3362b69b9763a9ad034215aa0395d890105884bbc9f747663c6f368a169e31bb013087987379718a5e6d21b6f75fb24f794136174b80b7f05e0cee59ff35f7c7b686dcd05f0995aa9eade7274c6543c54ed749111dbd88e6a00d183be03308d2539e073a9ee0731c5e0a230e718ca8aad0f1fc42a7696e4567f54a57a187d1c16a9618989790f4692bb7792563db42b4b9bb2d02d51f7bfd7c2be561408d24f00247f95ac324308b0e529990481d79edc8ba7f377fcff1b4d996d62c3e6c0328f6d5163764f197851ba731c289af6541a5d3a0ff68ba2a5d05edd9a1cc1fc571dc189cca4310b";

const router = Router();

// Endpoint to seed sample users into the database
router.get(
    "/seed",
    asyncHandler(async (req, res) => {
        // Check if users are already seeded
        const usersCount = await UserModel.countDocuments();
        if (usersCount > 0) {
            res.send("Sample users already seeded");
            return;
        }

        // Hash passwords and create users in the database
        for (let user of sample_users) {
            user.password = await bcrypt.hash(user.password, 10);
            await UserModel.create(user);
        }

        // Send success message
        res.send("Sample users seeded successfully");
    })
);

// Endpoint for user login
router.post(
    "/login",
    asyncHandler(async (req, res) => {
        // const body = req.body;
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.send(generateTokenResponse(user));
        } else {
            res.status(HTTP_BAD_REQUEST).send("User name or password is not valid!");
        }
    })
);

// Endpoint for user registration
router.post(
    "/register",
    asyncHandler(async (req, res) => {
        const { name, email, password, address } = req.body;
        const user = await UserModel.findOne({ email });
        if (user) {
            res.status(HTTP_BAD_REQUEST).send("User already exists!, please login!");
        } else {
            // Encrypt password and create a new user in the database
            const encryptedPassword = await bcrypt.hash(password, 10);

            const newUser: User = {
                id: "",
                name: name,
                email: email.toLowerCase(),
                password: encryptedPassword,
                address: address,
                isAdmin: false,
                isBlocked: false,
            };
            const dbUser = await UserModel.create(newUser);
            // Send token response for the newly registered user
            res.send(generateTokenResponse(dbUser));
        }
    })
);

// Endpoint to update user profile
router.put(
    "/updateProfile",
    auth,
    asyncHandler(async (req: any, res) => {
        const { name, address } = req.body;
        const user = await UserModel.findByIdAndUpdate(
            req.user.id,
            { name, address },
            { new: true }
        );

        if (user) {
            // Send token response if profile update is successful
            res.send(generateTokenResponse(user));
        } else {
            res.status(HTTP_BAD_REQUEST).send("User not found!");
        }

        // OR res.send(generateTokenResponse(user!));
    })
);

// Endpoint to change user password
router.put(
    "/changePassword",
    auth,
    asyncHandler(async (req: any, res) => {
        const { currentPassword, newPassword } = req.body;
        const user = await UserModel.findById(req.user.id);

        if (!user) {
            res.status(HTTP_BAD_REQUEST).send("User not found!");
            return;
        }

        // Check if current password is correct
        const equal = await bcrypt.compare(currentPassword, user.password);
        if (!equal) {
            res.status(HTTP_BAD_REQUEST).send("Curent Password Is Not Correct!");
        } else {
            // Update password and save the user
            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();

            res.send();
        }
    })
);

// Endpoint to get all users (with optional search term)
router.get(
    "/getAll/:searchTerm?",
    adminMid,
    asyncHandler(async (req, res) => {
        const { searchTerm } = req.params;

        // Define filter based on search term
        const filter = searchTerm
            ? { name: { $regex: new RegExp(searchTerm, "i") } }
            : {};

        // Retrieve users from the database, excluding passwords
        const users = await UserModel.find(filter, { password: 0 });
        res.send(users);
    })
);

// Endpoint to toggle user block status (admin only)
router.put(
    "/toggleBlock/:userId",
    adminMid,
    asyncHandler(async (req: any, res) => {
        const { userId } = req.params;

        if (userId === req.user.id) {
            // Send error response if attempting to block oneself
            res.status(HTTP_BAD_REQUEST).send("You cannot block yourself!");
            return;
        }

        // Find user by ID and toggle block status
        const user = await UserModel.findById(userId);
        user!.isBlocked = !user!.isBlocked;
        user!.save();

        // Send updated block status as the response
        res.send(user!.isBlocked);
    })
);

// Endpoint to get a user by ID (admin access required)
router.get(
    "/getById/:userId",
    adminMid, // Middleware to ensure admin access
    asyncHandler(async (req, res) => {
        // Extract user ID from request parameters
        const { userId } = req.params;
        // Find user by ID, excluding the password field
        const user = await UserModel.findById(userId, { password: 0 });
        // Check if user is found and send the user data, otherwise send an error response
        if (user) {
            res.send(user);
        } else {
            res.status(HTTP_BAD_REQUEST).send("User not found!");
        }
    })
);

// Endpoint to update user details (admin access required)
router.put(
    "/update/:userId",
    adminMid, // Middleware to ensure admin access
    asyncHandler(async (req, res) => {
        const id = req.params.userId;
        // Extract user details from the request body
        const { name, email, address, isAdmin } = req.body;
        // Update user details in the database based on the provided ID
        await UserModel.findByIdAndUpdate(id, {
            name,
            email,
            address,
            isAdmin,
        });

        res.send();
    })
);

// Function to generate a token response for a user
const generateTokenResponse = (user: User) => {
    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin,
        },
        JWT_SECRET!,
        {
            expiresIn: "30d",
        }
    );

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        address: user.address,
        isAdmin: user.isAdmin,
        token: token,
    };
};

export default router;
