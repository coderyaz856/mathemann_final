const Message = require('../models/Message');
const User = require('../models/User');

// Get all messages in user's inbox
exports.getInbox = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const messages = await Message.find({
            to: userId,
            parentMessage: { $exists: false } // Only get primary messages, not replies
        })
        .populate('from', 'name email role')
        .populate('to', 'name email role')
        .sort({ createdAt: -1 });
        
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching inbox messages:', error);
        res.status(500).json({
            message: 'Failed to fetch inbox messages',
            error: error.message
        });
    }
};

// Get all sent messages
exports.getSentMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const messages = await Message.find({
            from: userId,
            parentMessage: { $exists: false } // Only get primary messages, not replies
        })
        .populate('from', 'name email role')
        .populate('to', 'name email role')
        .sort({ createdAt: -1 });
        
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching sent messages:', error);
        res.status(500).json({
            message: 'Failed to fetch sent messages',
            error: error.message
        });
    }
};

// Get a specific message with its thread (replies)
exports.getMessageThread = async (req, res) => {
    try {
        const userId = req.user.id;
        const messageId = req.params.id;
        
        // Get the primary message
        const primaryMessage = await Message.findById(messageId)
            .populate('from', 'name email role')
            .populate('to', 'name email role');
            
        if (!primaryMessage) {
            return res.status(404).json({ message: 'Message not found' });
        }
        
        // Ensure the user is either the sender or recipient
        if (
            primaryMessage.from._id.toString() !== userId && 
            primaryMessage.to._id.toString() !== userId
        ) {
            return res.status(403).json({ message: 'Not authorized to view this message' });
        }
        
        // Get all replies in this thread
        const replies = await Message.find({
            parentMessage: messageId
        })
        .populate('from', 'name email role')
        .populate('to', 'name email role')
        .sort({ createdAt: 1 });
        
        res.status(200).json({
            primaryMessage,
            replies
        });
    } catch (error) {
        console.error('Error fetching message thread:', error);
        res.status(500).json({
            message: 'Failed to fetch message thread',
            error: error.message
        });
    }
};

// Send a new message
exports.sendMessage = async (req, res) => {
    try {
        const { recipientId, subject, body } = req.body;
        const senderId = req.user.id;
        
        // Validate recipient
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }
        
        const message = new Message({
            from: senderId,
            to: recipientId,
            subject,
            body,
            isRead: false
        });
        
        await message.save();
        
        res.status(201).json({
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            message: 'Failed to send message',
            error: error.message
        });
    }
};

// Reply to a message
exports.replyToMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const { body } = req.body;
        const senderId = req.user.id;
        
        // Get the original message
        const parentMessage = await Message.findById(messageId);
        
        if (!parentMessage) {
            return res.status(404).json({ message: 'Original message not found' });
        }
        
        // Ensure user is part of the conversation
        if (
            parentMessage.from.toString() !== senderId && 
            parentMessage.to.toString() !== senderId
        ) {
            return res.status(403).json({ message: 'Not authorized to reply to this message' });
        }
        
        // Determine the recipient (the other person in the conversation)
        const recipientId = parentMessage.from.toString() === senderId 
            ? parentMessage.to 
            : parentMessage.from;
            
        const reply = new Message({
            from: senderId,
            to: recipientId,
            subject: `Re: ${parentMessage.subject}`,
            body,
            isRead: false,
            parentMessage: messageId
        });
        
        await reply.save();
        
        res.status(201).json({
            message: 'Reply sent successfully',
            data: reply
        });
    } catch (error) {
        console.error('Error sending reply:', error);
        res.status(500).json({
            message: 'Failed to send reply',
            error: error.message
        });
    }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.id;
        
        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        
        // Ensure the user is the recipient
        if (message.to.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this message' });
        }
        
        message.isRead = true;
        await message.save();
        
        res.status(200).json({
            message: 'Message marked as read',
            data: message
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({
            message: 'Failed to mark message as read',
            error: error.message
        });
    }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.id;
        
        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        
        // Ensure the user is either the sender or recipient
        if (
            message.from.toString() !== userId && 
            message.to.toString() !== userId
        ) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }
        
        await Message.findByIdAndDelete(messageId);
        
        // Also delete any replies in the thread
        if (!message.parentMessage) {
            await Message.deleteMany({ parentMessage: messageId });
        }
        
        res.status(200).json({
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
            message: 'Failed to delete message',
            error: error.message
        });
    }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const count = await Message.countDocuments({
            to: userId,
            isRead: false,
            parentMessage: { $exists: false } // Only count primary messages
        });
        
        res.status(200).json({ unreadCount: count });
    } catch (error) {
        console.error('Error fetching unread message count:', error);
        res.status(500).json({
            message: 'Failed to fetch unread message count',
            error: error.message
        });
    }
};