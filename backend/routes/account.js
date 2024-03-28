// backend/routes/account.js
const express = require('express');
const { authMiddleware } = require('../middleware');
const { Account, Transaction, User} = require('../db');
const { default: mongoose } = require('mongoose');

const router = express.Router();


router.get("/balance", authMiddleware, async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId
    });
    res.json({
        balance: account.balance
    })
});

router.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const { amount, to } = req.body;

    // Fetch the accounts within the transaction
    const account = await Account.findOne({ userId: req.userId }).session(session);

    if (!account || account.balance < amount) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "Insufficient balance"
        });
    }
    if (amount < 0) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "abe ma**chod kar kya raha hai"
        });
    }
    const toAccount = await Account.findOne({ userId: to }).session(session);

    if (!toAccount) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "Invalid account"
        });
    }

    // Perform the transfer
    await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
    await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

    const fromUser =await User.findOne({
        _id : req.userId
    })
    const toUser  = await User.findOne({
        _id : to
    })

    const transaction = new Transaction({
        from : req.userId,
        to : to,
        fromFullName : fromUser.firstName + " " + fromUser.lastName,
        toFullName : toUser.firstName + " " + toUser.lastName,
        amount : amount,
        date : Date.now()
    })
    await transaction.save()

    // Commit the transaction
    await session.commitTransaction();
    res.json({
        message: "Transfer successful"
    });
});
// backend/routes/account.js

router.get("/transactions", authMiddleware, async (req, res) => {
    const transactions = await Transaction.find({
        $or: [
            { from: req.userId },
            { to: req.userId }
        ]
    })
        .select('fromFullName toFullName amount date') // select only these fields
        .sort({ date: -1 }); // sort by date in descending order
    async function deleteOldTransactions() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        await Transaction.deleteMany({ date: { $lt: oneWeekAgo } });
    }
    await deleteOldTransactions();
    res.json(transactions);

});
module.exports = router;