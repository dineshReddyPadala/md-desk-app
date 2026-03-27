const { nanoid } = require('nanoid');
const employeeProjectScope = require('../../utils/employeeProjectScope');

function generateComplaintId() {
  const prefix = 'MD';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const short = nanoid(8).toUpperCase();
  return `${prefix}-${date}-${short}`;
}

function parseDateStart(value) {
  if (!value) return null;
  const parsed = new Date(`${String(value).trim()}T00:00:00.000`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateEnd(value) {
  if (!value) return null;
  const parsed = new Date(`${String(value).trim()}T23:59:59.999`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildListWhere(status, priority, city, scopeWhere, fromDate, toDate, search) {
  const filters = [];
  if (scopeWhere && Object.keys(scopeWhere).length) filters.push(scopeWhere);
  if (status) filters.push({ status });
  if (priority) filters.push({ priority });
  if (city) filters.push({ city: { contains: city, mode: 'insensitive' } });
  if (search && String(search).trim()) {
    const term = String(search).trim();
    filters.push({
      OR: [
        { complaintId: { contains: term, mode: 'insensitive' } },
        { user: { is: { name: { contains: term, mode: 'insensitive' } } } },
        { user: { is: { email: { contains: term, mode: 'insensitive' } } } },
      ],
    });
  }
  const createdAt = {};
  const createdAfter = parseDateStart(fromDate);
  const createdBefore = parseDateEnd(toDate);
  if (createdAfter) createdAt.gte = createdAfter;
  if (createdBefore) createdAt.lte = createdBefore;
  if (Object.keys(createdAt).length) filters.push({ createdAt });
  if (filters.length === 0) return {};
  if (filters.length === 1) return filters[0];
  return { AND: filters };
}

function toTitleCase(value) {
  return String(value || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildActivityMessage(complaint, nextStatus, nextPriority, comment) {
  const parts = [];
  if (complaint.status !== nextStatus) {
    parts.push(`Status changed from ${toTitleCase(complaint.status)} to ${toTitleCase(nextStatus)}.`);
  }
  if (nextPriority && complaint.priority !== nextPriority) {
    parts.push(`Priority changed from ${toTitleCase(complaint.priority)} to ${toTitleCase(nextPriority)}.`);
  }
  if (comment) {
    parts.push(`Comment: ${comment}`);
  }
  return parts.join(' ');
}

async function resolveActorLabel(prisma, actorUserId, actorRole) {
  if (!actorUserId) return actorRole || 'Staff';
  const actor = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { name: true, email: true, role: true },
  });
  if (!actor) return actorRole || 'Staff';
  const displayName = actor.name && String(actor.name).trim() ? String(actor.name).trim() : actor.email;
  return `${displayName} (${actor.role})`;
}

async function resolveProjectForCreate(prisma, userId, projectIdRaw) {
  if (projectIdRaw == null || String(projectIdRaw).trim() === '') return { projectId: null };
  const projectId = String(projectIdRaw).trim();
  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId: userId },
    select: { id: true, name: true },
  });
  if (!project) {
    const err = new Error('Invalid project: must be one of your assigned projects');
    err.statusCode = 400;
    throw err;
  }
  return { projectId: project.id, projectName: project.name };
}

async function createComplaint(prisma, userId, data, fileUrls = []) {
  const complaintId = generateComplaintId();
  const category = (data.category || 'PRODUCT').toUpperCase();
  if (!['PRODUCT', 'SERVICE', 'DELIVERY', 'TECHNICAL'].includes(category)) {
    const err = new Error('Invalid category');
    err.statusCode = 400;
    throw err;
  }
  const { projectId, projectName } = await resolveProjectForCreate(prisma, userId, data.project_id);
  let projectLocation = data.project_location;
  if (projectId && projectName) {
    projectLocation = projectLocation && String(projectLocation).trim()
      ? String(projectLocation).trim()
      : projectName;
  }
  const complaint = await prisma.complaint.create({
    data: {
      complaintId,
      userId,
      projectId,
      category,
      productUsed: data.product_used && String(data.product_used).trim() ? String(data.product_used).trim() : '—',
      projectLocation,
      description: data.description,
      name: data.name,
      phone: data.phone,
      city: data.city,
      media: fileUrls.length
        ? { create: fileUrls.map(({ file_url, file_type }) => ({ fileUrl: file_url, fileType: file_type })) }
        : undefined,
    },
    include: { media: true, project: { select: { id: true, name: true } } },
  });
  return complaint;
}

async function getMyComplaints(prisma, userId, page = 1, limit = 10, status, priority, fromDate = null, toDate = null, options = {}) {
  const { scopeWhere = null } = options;
  const skip = (page - 1) * limit;
  const filters = [];
  if (userId) filters.push({ userId });
  if (scopeWhere && Object.keys(scopeWhere).length) filters.push(scopeWhere);
  if (status) filters.push({ status });
  if (priority) filters.push({ priority });
  const createdAt = {};
  const createdAfter = parseDateStart(fromDate);
  const createdBefore = parseDateEnd(toDate);
  if (createdAfter) createdAt.gte = createdAfter;
  if (createdBefore) createdAt.lte = createdBefore;
  if (Object.keys(createdAt).length) filters.push({ createdAt });
  const where = filters.length <= 1 ? (filters[0] || {}) : { AND: filters };
  const [items, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      include: {
        media: true,
        user: { select: { name: true, email: true, phone: true, city: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.complaint.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getComplaintById(prisma, id, userId = null) {
  const where = { id };
  if (userId) where.userId = userId;
  const complaint = await prisma.complaint.findFirst({
    where,
    include: {
      media: true,
      user: { select: { name: true, email: true, phone: true, city: true } },
      adminResponses: { orderBy: { createdAt: 'desc' } },
      project: { select: { id: true, name: true } },
    },
  });
  if (!complaint) {
    const err = new Error('Complaint not found');
    err.statusCode = 404;
    throw err;
  }
  return complaint;
}

async function getComplaintByComplaintId(prisma, complaintId, userId = null, options = {}) {
  const { scopeWhere = null } = options;
  const filters = [{ complaintId }];
  if (userId) filters.push({ userId });
  if (scopeWhere && Object.keys(scopeWhere).length) filters.push(scopeWhere);
  const complaint = await prisma.complaint.findFirst({
    where: filters.length === 1 ? filters[0] : { AND: filters },
    include: {
      media: true,
      user: { select: { name: true, email: true, phone: true, city: true } },
      adminResponses: { orderBy: { createdAt: 'desc' } },
      project: { select: { id: true, name: true } },
    },
  });
  if (!complaint) {
    const err = new Error('Complaint not found');
    err.statusCode = 404;
    throw err;
  }
  return complaint;
}

async function adminListComplaints(prisma, page = 1, limit = 10, status, priority, city, scopeWhere = null, fromDate = null, toDate = null, search = null) {
  const skip = (page - 1) * limit;
  const where = buildListWhere(status, priority, city, scopeWhere, fromDate, toDate, search);
  const [items, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      include: {
        media: true,
        user: { select: { name: true, email: true, phone: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.complaint.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function adminListComplaintsForExport(prisma, status, priority, city, scopeWhere = null, fromDate = null, toDate = null, search = null) {
  const where = buildListWhere(status, priority, city, scopeWhere, fromDate, toDate, search);
  return prisma.complaint.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, phone: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getHighPriority(prisma, page = 1, limit = 20, scopeWhere = null) {
  return adminListComplaints(prisma, page, limit, null, 'HIGH', null, scopeWhere);
}

async function updateStatus(prisma, id, status, priority = null, comment = '', options = {}) {
  const { employeeUserId = null, actorUserId = null, actorRole = null } = options;
  if (employeeUserId) {
    const ok = await employeeProjectScope.canEmployeeAccessComplaint(prisma, employeeUserId, id);
    if (!ok) {
      const err = new Error('Complaint not found');
      err.statusCode = 404;
      throw err;
    }
  }
  const validStatus = ['RECEIVED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED'];
  if (!validStatus.includes(status.toUpperCase())) {
    const err = new Error('Invalid status');
    err.statusCode = 400;
    throw err;
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    select: { id: true, complaintId: true, status: true, priority: true },
  });
  if (!complaint) {
    const err = new Error('Complaint not found');
    err.statusCode = 404;
    throw err;
  }

  const nextStatus = status.toUpperCase();
  let nextPriority = null;
  if (priority != null && priority !== '') {
    const validPriority = ['HIGH', 'MEDIUM', 'LOW'];
    if (validPriority.includes(priority.toUpperCase())) {
      nextPriority = priority.toUpperCase();
    }
  }
  const trimmedComment = typeof comment === 'string' ? comment.trim() : '';
  const statusChanged = complaint.status !== nextStatus;
  const priorityChanged = nextPriority != null && complaint.priority !== nextPriority;
  if (!statusChanged && !priorityChanged && !trimmedComment) {
    const err = new Error('Please change the status or priority, or add a comment');
    err.statusCode = 400;
    throw err;
  }

  const activityMessage = buildActivityMessage(
    complaint,
    nextStatus,
    nextPriority || complaint.priority,
    trimmedComment
  );
  const actorLabel = await resolveActorLabel(prisma, actorUserId || employeeUserId, actorRole);
  const updateData = {};
  if (statusChanged) updateData.status = nextStatus;
  if (priorityChanged) updateData.priority = nextPriority;

  const updatedComplaint = await prisma.$transaction(async (tx) => {
    if (Object.keys(updateData).length > 0) {
      await tx.complaint.update({
        where: { id },
        data: updateData,
      });
    }
    await tx.adminResponse.create({
      data: {
        complaintId: id,
        message: activityMessage,
        createdBy: actorLabel,
      },
    });
    return tx.complaint.findUnique({
      where: { id },
      include: {
        media: true,
        user: true,
        adminResponses: { orderBy: { createdAt: 'desc' } },
        project: { select: { id: true, name: true } },
      },
    });
  });

  return {
    complaint: updatedComplaint,
    changes: {
      statusChanged,
      priorityChanged,
      commentAdded: Boolean(trimmedComment),
    },
  };
}

module.exports = {
  generateComplaintId,
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getComplaintByComplaintId,
  adminListComplaints,
  adminListComplaintsForExport,
  getHighPriority,
  updateStatus,
};
