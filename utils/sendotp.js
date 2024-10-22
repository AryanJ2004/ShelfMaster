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
        htmlContent: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                }
                .header h1 {
                    color: #333;
                }
                .content {
                    text-align: center;
                    font-size: 18px;
                }
                .otp {
                    font-size: 22px;
                    font-weight: bold;
                    color: #1a73e8;
                    margin: 20px 0;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 14px;
                    color: #888;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Verify Your Account</h1>
                </div>
                <div class="content">
                    <p>Thank you for registering with <strong>ShelfMaster</strong>.</p>
                    <p>Please use the following OTP to verify your account:</p>
                    <div class="otp">${otp}</div>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you did not request this email, you can safely ignore it.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 ShelfMaster. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `
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
