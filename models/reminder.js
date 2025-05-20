const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    scheduledTime: {
        type: Date,
        required: true,
        get: (date) => date.toISOString(),
        set: (date) => new Date(date)
    },
    sent: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

module.exports = mongoose.model('Reminder', reminderSchema);

