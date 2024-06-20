// backend/routes/user.js
const express = require('express');
const router = express.Router();
const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const  { authMiddleware } = require("../middleware");



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
      firstName : user.firstName,
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
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

module.exports = router;