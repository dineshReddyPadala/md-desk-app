const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function getTransporter() {
  if (!config.mail?.from || !config.mail?.password) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: config.mail.from,
      pass: String(config.mail.password).trim(),
    },
  });
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const trans = getTransporter();
  if (!trans) return;
  try {
    await trans.sendMail({
      from: config.mail.from,
      to,
      subject,
      text: text || undefined,
      html: html || undefined,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

async function sendAcknowledgmentEmail(toEmail, userName, complaintId) {
  await sendMail({
    to: toEmail,
    subject: `Complaint received - ${complaintId}`,
    text: `Dear ${userName || 'Customer'},\n\nThank you for submitting your complaint. Your complaint ID is: ${complaintId}.\n\nYou can track the status anytime using this ID.\n\nBest regards,\nMD Desk - Techno Paints`,
    html: `<p>Dear ${userName || 'Customer'},</p><p>Thank you for submitting your complaint. Your complaint ID is: <strong>${complaintId}</strong>.</p><p>You can track the status anytime using this ID.</p><p>Best regards,<br/>MD Desk - Techno Paints</p>`,
  });
}

async function sendStatusUpdateEmail(toEmail, userName, complaintId, newStatus) {
  const statusLabel = newStatus.replace(/_/g, ' ');
  await sendMail({
    to: toEmail,
    subject: `Complaint ${complaintId} - Status updated to ${statusLabel}`,
    text: `Dear ${userName || 'Customer'},\n\nYour complaint ${complaintId} has been updated to: ${statusLabel}.\n\nBest regards,\nMD Desk - Techno Paints`,
    html: `<p>Dear ${userName || 'Customer'},</p><p>Your complaint <strong>${complaintId}</strong> has been updated to: <strong>${statusLabel}</strong>.</p><p>Best regards,<br/>MD Desk - Techno Paints</p>`,
  });
}

async function sendOtpEmail(toEmail, otp) {
  await sendMail({
    to: toEmail,
    subject: 'Your MD Desk verification code',
    text: `Your verification code is: ${otp}\n\nIt expires in 10 minutes. Do not share this code.\n\nMD Desk - Techno Paints`,
    html: `<p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 10 minutes. Do not share this code.</p><p>MD Desk - Techno Paints</p>`,
  });
}

async function sendPasswordResetEmail(toEmail, resetLink) {
  await sendMail({
    to: toEmail,
    subject: 'Reset your MD Desk password',
    text: `You requested a password reset. Click the link below to set a new password:\n\n${resetLink}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.\n\nMD Desk - Techno Paints`,
    html: `<p>You requested a password reset. <a href="${resetLink}">Click here to set a new password</a>.</p><p>This link expires in 1 hour. If you did not request this, ignore this email.</p><p>MD Desk - Techno Paints</p>`,
  });
}

async function sendNewClientEmail(toEmail, userName, temporaryPassword) {
  await sendMail({
    to: toEmail,
    subject: 'Your MD Desk client account',
    text: `Dear ${userName || 'Customer'},\n\nAn MD Desk client account has been created for you.\n\nEmail: ${toEmail}\nTemporary password: ${temporaryPassword}\n\nPlease sign in and change your password. You can use the Forgot Password option on the login page if needed.\n\nBest regards,\nMD Desk - Techno Paints`,
    html: `<p>Dear ${userName || 'Customer'},</p><p>An MD Desk client account has been created for you.</p><p><strong>Email:</strong> ${toEmail}<br/><strong>Temporary password:</strong> ${temporaryPassword}</p><p>Please sign in and change your password. You can use the Forgot Password option on the login page if needed.</p><p>Best regards,<br/>MD Desk - Techno Paints</p>`,
  });
}

async function sendNewEmployeeEmail(toEmail, employeeName, designation, temporaryPassword) {
  const designationLine = designation ? `\nDesignation: ${designation}` : '';
  const loginLine = temporaryPassword
    ? `\n\nSign in to MD Desk Admin with:\nEmail: ${toEmail}\nTemporary password: ${temporaryPassword}\n\nPlease change your password after first login (Forgot Password on the login page if needed).`
    : '';
  const loginHtml = temporaryPassword
    ? `<p><strong>Sign in to MD Desk Admin</strong></p><p><strong>Email:</strong> ${toEmail}<br/><strong>Temporary password:</strong> ${temporaryPassword}</p><p>Please change your password after first login.</p>`
    : '';
  await sendMail({
    to: toEmail,
    subject: 'Your MD Desk employee account',
    text: `Dear ${employeeName || 'Team Member'},\n\nYou have been added to the MD Desk team.${designationLine}${loginLine}\n\nBest regards,\nMD Desk - Techno Paints`,
    html: `<p>Dear ${employeeName || 'Team Member'},</p><p>You have been added to the MD Desk team.${designation ? `<br/><strong>Designation:</strong> ${designation}` : ''}</p>${loginHtml}<p>Best regards,<br/>MD Desk - Techno Paints</p>`,
  });
}

module.exports = { sendMail, sendAcknowledgmentEmail, sendStatusUpdateEmail, sendOtpEmail, sendPasswordResetEmail, sendNewClientEmail, sendNewEmployeeEmail };
