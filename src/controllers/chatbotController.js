import chatbotService from '../services/chatbotService'

let handleSendMessageChatbot = async (req, res) => {
    let query = req.body.query;
    try {
        const fulfillmentText = await chatbotService.getResponseMessageFromIntent(query)
        return res.json({
            fulfillmentText
        });
    } catch (error) {
        console.error('Error detecting intent:', error);
        res.status(500).send('Error detecting intent');
    }
}
module.exports = {
    handleSendMessageChatbot
}