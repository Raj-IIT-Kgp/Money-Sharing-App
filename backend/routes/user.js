// backend/routes/user.js
const express = require('express');
const router = express.Router();
const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const  { authMiddleware } = require("../middleware");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const otpStore = {};
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "your.email@gmail.com", // replace with your email
        pass: "your_app_password"     // replace with your app password (not your email password)
    }
});

const signupBody = zod.object({
    username: zod.string().email(),
    firstName: zod.string(),
    lastName: zod.string(),
    password: zod.string()
})

router.post("/signup", async (req, res) => {
    const { success } = signupBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }
    const existingUser = await User.findOne({
        username: req.body.username
    })

    if (existingUser) {
        return res.status(411).json({
            message: "Email already taken"
        })
    }

    const user = new User({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    })
    await user.save()
    const userId = user._id;

    const account = new Account({
        userId,
        balance: (1 + Math.random() * 10000).toFixed(2)
    })

    await account.save()

    const token = jwt.sign({
        userId
    }, JWT_SECRET);

    res.json({
        message: "User created successfully",
        token: token,

    })
})


const signinBody = zod.object({
    username: zod.string().email().nonempty({message : "Email is required"}),
    password: zod.string().nonempty({message : "Password is required"})
})


router.post("/signin/request-otp", async (req, res) => {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[username] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5 min expiry

    // Send OTP via email
    await transporter.sendMail({
        from: "your.email@gmail.com",
        to: username,
        subject: "Your OTP Code",
        text: `Your OTP code is: ${otp}`
    });

    res.json({ message: "OTP sent to your email" });
});

// Route to verify OTP and sign in
router.post("/signin/verify-otp", async (req, res) => {
    const { username, otp } = req.body;
    const record = otpStore[username];
    if (!record || record.otp !== otp || Date.now() > record.expires) {
        return res.status(401).json({ message: "Invalid or expired OTP" });
    }
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    delete otpStore[username];
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ message: "Logged in with OTP", token });
});



router.post("/signin", async (req, res) => {
    try {
        const username = req.body.username
        const password = req.body.password
        const {success} = signinBody.safeParse(req.body)
        if (!success) {
            return res.status(411).json({
                message: " Incorrect inputs"
            })
        }

        const user = await User.findOne({
            username: username,
            password: password
        });

        if (user) {
            const token = jwt.sign({
                userId: user._id
            }, JWT_SECRET);

            res.json({
                message: "Logged in successfully",
                token: token,
            })

        } else {
            res.status(411).json({
                message: "Incorrect username or password"
            })
        }
    }
    catch (e) {
        res.status(411).json({
            message: "Error while logging in"
        })
    }
})

const updateBody = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
})

router.put("/update", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body)
    if (!success) {
        res.status(411).json({
            message: "Error while updating information"
        })
    }

    await User.updateOne({ _id: req.userId }, req.body)

    res.json({
        message: "Updated successfully"
    })
})

router.get("/info", authMiddleware, async (req, res) => {
    const user = await User.findOne({
        _id: req.userId
    });
    res.json({
      user : user
    })
});


router.get("/bulk", authMiddleware, async (req, res) => {
    const filter = req.query.filter || "";
    const user = await User.findOne({
        _id: req.userId
    });

    const loggedInUsername = user.username;

    const users = await User.find({
        $and: [
            { username: { $ne: loggedInUsername } },
            {
                $or: [
                    { firstName: { "$regex": filter } },
                    { lastName: { "$regex": filter } }
                ]
            }
        ]
    })

    res.json({
       users : users
    })
})

module.exports = router;