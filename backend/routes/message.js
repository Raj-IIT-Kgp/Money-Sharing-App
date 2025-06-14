const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware');
const { Message } = require('../db');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// Send a message (stores in DB)
router.post('/send', authMiddleware, async (req, res) => {
    const { to, content } = req.body;
    if (!to || !content) {
        return res.status(400).json({ message: 'Recipient and content required' });
    }
    const msg = new Message({
        from: req.userId,
        to,
        content
    });
    await msg.save();
    res.json({ message: 'Message sent', msg });
});

// Get chat history with a user
router.get('/history/:userId', authMiddleware, async (req, res) => {
    const otherUserId = req.params.userId;
    const messages = await Message.find({
        $or: [
            { from: req.userId, to: otherUserId },
            { from: otherUserId, to: req.userId }
        ]
    }).sort({ timestamp: 1 });
    res.json({ messages });
});

// Get all conversations (unique users chatted with)
router.get('/conversations', authMiddleware, async (req, res) => {
    const userId = req.userId;
    const messages = await Message.find({
        $or: [{ from: userId }, { to: userId }]
    }).sort({ timestamp: -1 });

    const users = new Set();
    messages.forEach(msg => {
        if (msg.from.toString() !== userId) users.add(msg.from.toString());
        if (msg.to.toString() !== userId) users.add(msg.to.toString());
    });

    res.json({ users: Array.from(users) });
});

// Mark messages as read
router.post('/read', authMiddleware, async (req, res) => {
    const { from } = req.body;
    await Message.updateMany(
        { from, to: req.userId, read: false },
        { $set: { read: true } }
    );
    res.json({ message: 'Messages marked as read' });
});

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Send a file message
router.post("/send-file", authMiddleware, upload.single("file"), async (req, res) => {
    const { to } = req.body;
    if (!to || !req.file) {
        return res.status(400).json({ message: "Recipient and file required" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    const msg = new Message({
        from: req.userId,
        to,
        content: "",
        fileUrl,
        fileName: req.file.originalname
    });
    await msg.save();
    res.json({ message: "File sent", msg });
});

module.exports = router;