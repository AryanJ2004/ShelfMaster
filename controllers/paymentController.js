const Razorpay = require('razorpay');
const Listing = require('../models/listing');
require('dotenv').config();
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});

const createOrder = async (req, res) => {
    try {
        const listingId = req.params.id;
        const listing = await Listing.findById(listingId);

        if (!listing) {
            return res.status(404).send({ success: false, msg: 'Listing not found' });
        }

        const amount = listing.price * 100; 
        
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: `receipt_${listingId}`
        };

        const order = await razorpayInstance.orders.create(options);

        res.status(200).json({
            success: true,
            msg: 'Order Created',
            order_id: order.id,
            amount: amount,
            key_id: RAZORPAY_ID_KEY,
            product_name: listing.title,
            description: listing.description
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).send({ success: false, msg: 'Internal Server Error' });
    }
};


const capturePayment = async (req, res) => {
    const { paymentId, amount } = req.body;

    if (!paymentId) {
        return res.status(400).send({ success: false, msg: 'payment_id is mandatory' });
    }

    try {
  
        const paymentDetails = await razorpayInstance.payments.fetch(paymentId);
        console.log('Payment Details:', paymentDetails);


        if (paymentDetails.status === 'captured') {
            return res.status(200).send({ success: true, msg: 'Payment already captured', data: paymentDetails });
        }


        const captureResponse = await razorpayInstance.payments.capture(paymentId, amount);
        console.log('Payment captured successfully:', captureResponse);

        res.status(200).send({ success: true, msg: 'Payment captured successfully', data: captureResponse });
    } catch (error) {
        console.error('Error capturing payment:', error);


        if (error.code) {
            return res.status(500).send({ success: false, msg: `Payment capture failed: ${error.message}`, error });
        }

        res.status(500).send({ success: false, msg: 'Payment capture failed', error });
    }
};


module.exports = {
    createOrder,
    capturePayment
};
