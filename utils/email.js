const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOrderConfirmation = async (order) => {
  if (!process.env.EMAIL_USER) return; // Skip if email not configured

  const itemsList = order.items.map(item =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #f0e8d8">${item.petName}</td>
      <td style="padding:8px;border-bottom:1px solid #f0e8d8;text-align:right">$${item.price.toLocaleString()}</td>
    </tr>`
  ).join('');

  const html = `
    <div style="font-family:'Jost',sans-serif;max-width:600px;margin:0 auto;background:#faf6ef">
      <div style="background:#0d1b2e;padding:30px;text-align:center">
        <h1 style="color:#c9a84c;font-family:Georgia,serif;margin:0">Royal Maltipoos</h1>
        <p style="color:#d4c4a0;margin:8px 0 0">Order Confirmation</p>
      </div>
      <div style="padding:30px">
        <h2 style="color:#0d1b2e">Thank you, ${order.customerInfo?.name || 'Customer'}!</h2>
        <p style="color:#555">Your order has been confirmed. Here are your details:</p>
        <div style="background:#fff;border:1px solid #f0e8d8;padding:20px;margin:20px 0">
          <p><strong>Order Reference:</strong> ${order.orderRef}</p>
          <p><strong>Delivery Method:</strong> ${order.deliveryMethod === 'home_delivery' ? 'Home Delivery' : 'In-Store Pickup'}</p>
          <p><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f0e8d8">
              <th style="padding:10px;text-align:left">Pet</th>
              <th style="padding:10px;text-align:right">Price</th>
            </tr>
          </thead>
          <tbody>${itemsList}</tbody>
          <tfoot>
            <tr>
              <td style="padding:10px;font-weight:bold">Total</td>
              <td style="padding:10px;font-weight:bold;text-align:right;color:#c9a84c">$${order.totalAmount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
        <p style="color:#555;margin-top:20px">We'll be in touch shortly with next steps. Thank you for choosing Royal Maltipoos! 🐾</p>
      </div>
      <div style="background:#0d1b2e;padding:20px;text-align:center">
        <p style="color:#d4c4a0;font-size:12px;margin:0">© ${new Date().getFullYear()} Royal Maltipoos. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Royal Maltipoos" <noreply@royalmaltipoos.com>',
    to: order.customerInfo?.email,
    subject: `Order Confirmed — ${order.orderRef} 🐾`,
    html
  });
};

const sendWelcomeEmail = async (user) => {
  if (!process.env.EMAIL_USER) return;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Welcome to Royal Maltipoos! 🐾',
    html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2 style="color:#c9a84c">Welcome, ${user.name}!</h2>
      <p>Thank you for joining the Royal Maltipoos family. Browse our beautiful Maltipoo puppies and find your perfect companion.</p>
      <p>Visit us at <a href="${process.env.FRONTEND_URL}">Royal Maltipoos</a></p>
    </div>`
  });
};

module.exports = { sendOrderConfirmation, sendWelcomeEmail };
