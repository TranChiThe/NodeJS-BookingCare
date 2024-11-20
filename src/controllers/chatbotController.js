import chatbotService from '../services/chatbotService'

let handleSendMessage = async (req, res) => {
    const sessionId = req.body.sessionId || 'unique-session-id';  // Session ID duy nhất cho mỗi cuộc trò chuyện
    const query = req.body.query;  // Câu hỏi của người dùng từ Dialogflow
    try {
        const fulfillmentText = await chatbotService.getResponseFromIntent(query, sessionId)
        if (!res.headersSent) {
            res.json({
                fulfillmentText
            });
        }
    } catch (error) {
        console.error('Error detecting intent:', error);
        res.status(500).send('Error detecting intent');
    }
}
module.exports = {
    handleSendMessage,
}