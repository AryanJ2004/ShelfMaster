require('dotenv').config();
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;

const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

const sendOTP = async (email, otp) => {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const sendSmtpEmail = {
        to: [{ email: email }],
        sender: { email: '8jc66.test@inbox.testmail.app', name: 'ShelfMaster' },
        subject: 'Your OTP for Account Verification',
        htmlContent: `<strong>Your OTP is ${otp}. It will expire in 10 minutes. Thank You For Registering With Us!</strong>`
    };

    try {
        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('OTP sent successfully', response);
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Could not send OTP');
    }
};

module.exports = sendOTP;
