const { nanoid } = require('nanoid');
const employeeProjectScope = require('../../utils/employeeProjectScope');

function generateComplaintId() {
  const prefix = 'MD';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const short = nanoid(8).toUpperCase();
  return `${prefix}-${date}-${short}`;
}

function buildListWhere(status, priority, city, scopeWhere) {
  const filters = [];
  if (scopeWhere && Object.keys(scopeWhere).length) filters.push(scopeWhere);
  if (status) filters.push({ status });
  if (priority) filters.push({ priority });
  if (city) filters.push({ city: { contains: city, mode: 'insensitive' } });
  if (filters.length === 0) return {};
  if (filters.length === 1) return filters[0];
  return { AND: filters };
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

async function getMyComplaints(prisma, userId, page = 1, limit = 10, status, priority) {
  const skip = (page - 1) * limit;
  const where = { userId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  const [items, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      include: { media: true, project: { select: { id: true, name: true } } },
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
      adminResponses: true,
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

async function getComplaintByComplaintId(prisma, complaintId, userId) {
  const complaint = await prisma.complaint.findFirst({
    where: { complaintId, userId },
    include: { media: true, adminResponses: true, project: { select: { id: true, name: true } } },
  });
  if (!complaint) {
    const err = new Error('Complaint not found');
    err.statusCode = 404;
    throw err;
  }
  return complaint;
}

async function adminListComplaints(prisma, page = 1, limit = 10, status, priority, city, scopeWhere = null) {
  const skip = (page - 1) * limit;
  const where = buildListWhere(status, priority, city, scopeWhere);
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

async function getHighPriority(prisma, page = 1, limit = 20, scopeWhere = null) {
  return adminListComplaints(prisma, page, limit, null, 'HIGH', null, scopeWhere);
}

async function updateStatus(prisma, id, status, priority = null, options = {}) {
  const { employeeUserId = null } = options;
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
  const data = { status: status.toUpperCase() };
  if (priority != null && priority !== '') {
    const validPriority = ['HIGH', 'MEDIUM', 'LOW'];
    if (validPriority.includes(priority.toUpperCase())) {
      data.priority = priority.toUpperCase();
    }
  }
  return prisma.complaint.update({
    where: { id },
    data,
    include: { media: true, user: true, project: { select: { id: true, name: true } } },
  });
}

module.exports = {
  generateComplaintId,
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getComplaintByComplaintId,
  adminListComplaints,
  getHighPriority,
  updateStatus,
};
