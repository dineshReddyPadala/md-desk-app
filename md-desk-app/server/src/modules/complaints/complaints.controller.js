const complaintsService = require('./complaints.service');
const employeeProjectScope = require('../../utils/employeeProjectScope');
const notificationsService = require('../notifications/notifications.service');
const emailService = require('../../services/email.service');
const { getIo } = require('../../socket');
const { sendWorkbook } = require('../../utils/excel');

async function createComplaint(req, reply) {
  if (req.user?.role !== 'CUSTOMER') {
    return reply.status(403).send({ success: false, message: 'Only customers can raise complaints' });
  }
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
  try {
    const admins = await req.server.prisma.user.findMany({
      where: { role: 'ADMIN', email: { not: null } },
      select: { email: true },
    });
    const assignedEmployees = complaint.projectId
      ? await req.server.prisma.projectEmployee.findMany({
          where: { projectId: complaint.projectId },
          select: { employee: { select: { email: true } } },
        })
      : [];
    const recipients = [...new Set([
      ...admins.map((user) => user.email).filter(Boolean),
      ...assignedEmployees.map((assignment) => assignment.employee?.email).filter(Boolean),
    ])];
    await Promise.all(recipients.map((toEmail) => emailService.sendComplaintRaisedStaffEmail(toEmail, {
      complaintId: complaint.complaintId,
      customerName: body.name || req.user.name || 'Customer',
      category: complaint.category,
      projectName: complaint.project?.name,
      projectLocation: complaint.projectLocation,
      description: complaint.description,
    })));
  } catch (err) {
    req.log?.error?.(err) || console.error('Complaint raised staff email failed:', err);
  }
  return reply.status(201).send({
    success: true,
    complaint_id: complaint.complaintId,
    id: complaint.id,
    message: 'Complaint submitted. Use complaint_id to track.',
  });
}

async function myComplaints(req, reply) {
  const { page = 1, limit = 10, status, priority, fromDate, toDate } = req.query || {};
  let complaintOwnerId = req.user.id;
  let scopeWhere = null;
  if (req.user?.role === 'EMPLOYEE') {
    complaintOwnerId = null;
    scopeWhere = await employeeProjectScope.employeeComplaintWhere(req.server.prisma, req.user.id);
  }
  const result = await complaintsService.getMyComplaints(
    req.server.prisma,
    complaintOwnerId,
    Number(page),
    Number(limit),
    status,
    priority,
    fromDate,
    toDate,
    { scopeWhere }
  );
  return reply.send({ success: true, ...result });
}

async function getComplaint(req, reply) {
  const { id } = req.params;
  const role = req.user?.role;
  if (role === 'CUSTOMER') {
    const complaint = await complaintsService.getComplaintById(req.server.prisma, id, req.user.id);
    return reply.send({ success: true, complaint });
  }
  if (role === 'EMPLOYEE') {
    const allowed = await employeeProjectScope.canEmployeeAccessComplaint(req.server.prisma, req.user.id, id);
    if (!allowed) return reply.status(404).send({ success: false, message: 'Complaint not found' });
    const complaint = await complaintsService.getComplaintById(req.server.prisma, id, null);
    return reply.send({ success: true, complaint });
  }
  const complaint = await complaintsService.getComplaintById(req.server.prisma, id, null);
  return reply.send({ success: true, complaint });
}

async function getByComplaintId(req, reply) {
  const { complaintId } = req.params;
  let complaintOwnerId = req.user.id;
  let scopeWhere = null;
  if (req.user?.role === 'EMPLOYEE') {
    complaintOwnerId = null;
    scopeWhere = await employeeProjectScope.employeeComplaintWhere(req.server.prisma, req.user.id);
  }
  if (req.user?.role === 'ADMIN') {
    complaintOwnerId = null;
  }
  const complaint = await complaintsService.getComplaintByComplaintId(
    req.server.prisma,
    complaintId,
    complaintOwnerId,
    { scopeWhere }
  );
  return reply.send({ success: true, complaint });
}

async function adminList(req, reply) {
  const { page = 1, limit = 10, status, priority, city, fromDate, toDate, search } = req.query || {};
  let scopeWhere = null;
  if (req.user?.role === 'EMPLOYEE') {
    scopeWhere = await employeeProjectScope.employeeComplaintWhere(req.server.prisma, req.user.id);
  }
  const result = await complaintsService.adminListComplaints(
    req.server.prisma,
    Number(page),
    Number(limit),
    status,
    priority,
    city,
    scopeWhere,
    fromDate,
    toDate,
    search
  );
  return reply.send({ success: true, ...result });
}

async function highPriority(req, reply) {
  const { page = 1, limit = 20 } = req.query || {};
  let scopeWhere = null;
  if (req.user?.role === 'EMPLOYEE') {
    scopeWhere = await employeeProjectScope.employeeComplaintWhere(req.server.prisma, req.user.id);
  }
  const result = await complaintsService.getHighPriority(
    req.server.prisma,
    Number(page),
    Number(limit),
    scopeWhere
  );
  return reply.send({ success: true, ...result });
}

async function exportList(req, reply) {
  const { status, priority, city, fromDate, toDate, search } = req.query || {};
  let scopeWhere = null;
  if (req.user?.role === 'EMPLOYEE') {
    scopeWhere = await employeeProjectScope.employeeComplaintWhere(req.server.prisma, req.user.id);
  }
  const items = await complaintsService.adminListComplaintsForExport(
    req.server.prisma,
    status,
    priority,
    city,
    scopeWhere,
    fromDate,
    toDate,
    search
  );
  return sendWorkbook(reply, 'complaints_export.xlsx', [{
    name: 'Complaints',
    rows: items.map((item) => ({
      ComplaintID: item.complaintId,
      CustomerName: item.name || item.user?.name || '',
      CustomerEmail: item.user?.email || '',
      CustomerPhone: item.phone || item.user?.phone || '',
      Category: item.category || '',
      Priority: item.priority,
      Status: item.status,
      Project: item.project?.name || '',
      ProjectLocation: item.projectLocation,
      City: item.city || '',
      Description: item.description,
      CreatedAt: item.createdAt.toISOString(),
      UpdatedAt: item.updatedAt.toISOString(),
    })),
  }]);
}

async function updateStatus(req, reply) {
  const { id } = req.params;
  const { status, priority, comment } = req.body || {};
  const employeeUserId = req.user?.role === 'EMPLOYEE' ? req.user.id : null;
  const result = await complaintsService.updateStatus(req.server.prisma, id, status, priority, comment, {
    employeeUserId,
    actorUserId: req.user?.id,
    actorRole: req.user?.role,
  });
  const { complaint, changes } = result;

  if (changes.statusChanged) {
    try {
      await notificationsService.create(req.server.prisma, {
        userId: complaint.userId,
        type: 'status_updated',
        title: 'Complaint status updated',
        body: `Your complaint ${complaint.complaintId} is now ${complaint.status.replace(/_/g, ' ')}.`,
      });
      const ioStatus = getIo();
      if (ioStatus) {
        ioStatus.to(`user:${complaint.userId}`).emit('notification', {
          type: 'status_updated',
          title: 'Complaint status updated',
          body: `Your complaint ${complaint.complaintId} is now ${complaint.status.replace(/_/g, ' ')}.`,
        });
      }
    } catch (err) {
      req.log?.error?.(err) || console.error('Notification create failed:', err);
    }
    if (complaint.user?.email) {
      emailService.sendStatusUpdateEmail(
        complaint.user.email,
        complaint.user.name || 'Customer',
        complaint.complaintId,
        complaint.status
      ).catch((err) => { req.log?.error?.(err) || console.error('Status update email failed:', err); });
    }
  }
  return reply.send({ success: true, complaint, changes });
}

module.exports = {
  createComplaint,
  myComplaints,
  getComplaint,
  getByComplaintId,
  adminList,
  highPriority,
  exportList,
  updateStatus,
};
