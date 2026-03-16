const complaintsService = require('./complaints.service');
const notificationsService = require('../notifications/notifications.service');
const emailService = require('../../services/email.service');
const { getIo } = require('../../socket');

async function createComplaint(req, reply) {
  const body = req.body || {};
  const fileUrls = req.fileUrls || [];
  const complaint = await complaintsService.createComplaint(
    req.server.prisma,
    req.user.id,
    body,
    fileUrls
  );
  try {
    await notificationsService.create(req.server.prisma, {
      userId: req.user.id,
      type: 'complaint_raised',
      title: 'Complaint submitted',
      body: `Your complaint ID: ${complaint.complaintId}. Use it to track status.`,
    });
    const io = getIo();
    if (io) {
      io.to(`user:${req.user.id}`).emit('notification', { type: 'complaint_raised', title: 'Complaint submitted', body: `Your complaint ID: ${complaint.complaintId}. Use it to track status.` });
    }
  } catch (err) {
    req.log?.error?.(err) || console.error('Notification create failed:', err);
  }
  try {
    await notificationsService.notifyAdmins(req.server.prisma, {
      type: 'complaint_received',
      title: 'New complaint received',
      body: `Complaint ${complaint.complaintId} submitted.`,
    });
    const ioAdmin = getIo();
    if (ioAdmin) {
      ioAdmin.to('admin').emit('notification', { type: 'complaint_received', title: 'New complaint received', body: `Complaint ${complaint.complaintId} submitted.` });
    }
  } catch (err) {
    req.log?.error?.(err) || console.error('Notification notifyAdmins failed:', err);
  }
  if (req.user.email) {
    emailService.sendAcknowledgmentEmail(
      req.user.email,
      body.name || 'Customer',
      complaint.complaintId
    ).catch((err) => { req.log?.error?.(err) || console.error('Acknowledgment email failed:', err); });
  }
  return reply.status(201).send({
    success: true,
    complaint_id: complaint.complaintId,
    id: complaint.id,
    message: 'Complaint submitted. Use complaint_id to track.',
  });
}

async function myComplaints(req, reply) {
  const { page = 1, limit = 10, status, priority } = req.query || {};
  const result = await complaintsService.getMyComplaints(
    req.server.prisma,
    req.user.id,
    Number(page),
    Number(limit),
    status,
    priority
  );
  return reply.send({ success: true, ...result });
}

async function getComplaint(req, reply) {
  const { id } = req.params;
  const complaint = await complaintsService.getComplaintById(
    req.server.prisma,
    id,
    req.user?.role === 'CUSTOMER' ? req.user.id : null
  );
  return reply.send({ success: true, complaint });
}

async function getByComplaintId(req, reply) {
  const { complaintId } = req.params;
  const complaint = await complaintsService.getComplaintByComplaintId(
    req.server.prisma,
    complaintId,
    req.user.id
  );
  return reply.send({ success: true, complaint });
}

async function adminList(req, reply) {
  const { page = 1, limit = 10, status, priority, city } = req.query || {};
  const result = await complaintsService.adminListComplaints(
    req.server.prisma,
    Number(page),
    Number(limit),
    status,
    priority,
    city
  );
  return reply.send({ success: true, ...result });
}

async function highPriority(req, reply) {
  const { page = 1, limit = 20 } = req.query || {};
  const result = await complaintsService.getHighPriority(
    req.server.prisma,
    Number(page),
    Number(limit)
  );
  return reply.send({ success: true, ...result });
}

async function updateStatus(req, reply) {
  const { id } = req.params;
  const { status } = req.body;
  const complaint = await complaintsService.updateStatus(req.server.prisma, id, status);
  try {
    await notificationsService.create(req.server.prisma, {
      userId: complaint.userId,
      type: 'status_updated',
      title: 'Complaint status updated',
      body: `Your complaint ${complaint.complaintId} is now ${status.replace(/_/g, ' ')}.`,
    });
    const ioStatus = getIo();
    if (ioStatus) {
      ioStatus.to(`user:${complaint.userId}`).emit('notification', { type: 'status_updated', title: 'Complaint status updated', body: `Your complaint ${complaint.complaintId} is now ${status.replace(/_/g, ' ')}.` });
    }
  } catch (err) {
    req.log?.error?.(err) || console.error('Notification create failed:', err);
  }
  if (complaint.user?.email) {
    emailService.sendStatusUpdateEmail(
      complaint.user.email,
      complaint.user.name || 'Customer',
      complaint.complaintId,
      status
    ).catch((err) => { req.log?.error?.(err) || console.error('Status update email failed:', err); });
  }
  return reply.send({ success: true, complaint });
}

module.exports = {
  createComplaint,
  myComplaints,
  getComplaint,
  getByComplaintId,
  adminList,
  highPriority,
  updateStatus,
};
