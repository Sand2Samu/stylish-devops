/**
 * AWS Lambda Function: Order Notification
 * Sends email notifications when a purchase is made
 * 
 * Triggered by the Stylish app when a purchase is recorded
 */

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
    console.log('Order Notification Lambda triggered');
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        // Parse the incoming event
        const orderData = typeof event.body === 'string' ? JSON.parse(event.body) : event;

        const {
            orderId,
            customerEmail,
            customerName,
            products,
            totalAmount,
            shippingAddress
        } = orderData;

        // Validate required fields
        if (!customerEmail || !orderId) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Missing required fields: customerEmail and orderId are required'
                })
            };
        }

        // Format product list for email
        const productList = products && products.length > 0
            ? products.map(p => `• ${p.productName} x${p.quantity} - $${p.pricePerItem}`).join('\n')
            : 'No product details available';

        // Email content
        const emailSubject = `Order Confirmation - #${orderId}`;
        const emailBody = `
Hello ${customerName || 'Valued Customer'},

Thank you for your order from Stylish Shoes!

ORDER DETAILS
─────────────────────────────
Order ID: ${orderId}
Date: ${new Date().toLocaleDateString()}

ITEMS
─────────────────────────────
${productList}

TOTAL: $${totalAmount || '0.00'}

SHIPPING ADDRESS
─────────────────────────────
${shippingAddress || 'Address not provided'}

─────────────────────────────

Thank you for shopping with us!

Best regards,
Stylish Shoes Team

---
This is an automated message. Please do not reply directly to this email.
        `.trim();

        // Send email via SES
        const sendEmailParams = {
            Source: process.env.SENDER_EMAIL || 'noreply@stylish-shoes.com',
            Destination: {
                ToAddresses: [customerEmail]
            },
            Message: {
                Subject: {
                    Data: emailSubject,
                    Charset: 'UTF-8'
                },
                Body: {
                    Text: {
                        Data: emailBody,
                        Charset: 'UTF-8'
                    }
                }
            }
        };

        console.log('Sending email to:', customerEmail);

        const command = new SendEmailCommand(sendEmailParams);
        const result = await sesClient.send(command);

        console.log('Email sent successfully. MessageId:', result.MessageId);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Order notification sent successfully',
                messageId: result.MessageId,
                orderId: orderId
            })
        };

    } catch (error) {
        console.error('Error sending notification:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to send order notification',
                error: error.message
            })
        };
    }
};
