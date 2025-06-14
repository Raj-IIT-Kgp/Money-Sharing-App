const mongoose = require("mongoose");

// Use this complete URI with required options
const uri = "mongodb+srv://rajstark:Raj9339822084@cluster0.hbdk2hp.mongodb.net/paytm?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Log connection events
mongoose.connection.on("connected", () => {
    console.log("✅ Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
    console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
    console.log("⚠️ Mongoose disconnected");
});

// Define schemas
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    profileImage: {
        type: String,
        default: "" // Optional: default to empty string if not provided
    }
});
const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        required: true
    }
});

const transactionSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fromFullName: {
        type: String,
        required: true
    },
    toFullName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const messageSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

// Create models
const User = mongoose.model('User', userSchema);
const Account = mongoose.model('Account', accountSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Message = mongoose.model('Message', messageSchema);

// Export models
module.exports = {
    User,
    Account,
    Transaction,
    Message
};
