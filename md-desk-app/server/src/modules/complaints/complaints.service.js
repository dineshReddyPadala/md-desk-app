const { nanoid } = require('nanoid');

function generateComplaintId() {
  const prefix = 'MD';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const short = nanoid(8).toUpperCase();
  return `${prefix}-${date}-${short}`;
}

async function createComplaint(prisma, userId, data, fileUrls = []) {
  const complaintId = generateComplaintId();
  const category = (data.category || 'PRODUCT').toUpperCase();
  if (!['PRODUCT', 'SERVICE', 'DELIVERY', 'TECHNICAL'].includes(category)) {
    const err = new Error('Invalid category');
    err.statusCode = 400;
    throw err;
  }
  const complaint = await prisma.complaint.create({
    data: {
      complaintId,
      userId,
      category,
      productUsed: data.product_used && String(data.product_used).trim() ? String(data.product_used).trim() : '—',
      projectLocation: data.project_location,
      description: data.description,
      name: data.name,
      phone: data.phone,
      city: data.city,
      media: fileUrls.length
        ? { create: fileUrls.map(({ file_url, file_type }) => ({ fileUrl: file_url, fileType: file_type })) }
        : undefined,
    },
    include: { media: true },
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
      include: { media: true },
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
    include: { media: true, user: { select: { name: true, email: true, phone: true, city: true } }, adminResponses: true },
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
    include: { media: true, adminResponses: true },
  });
  if (!complaint) {
    const err = new Error('Complaint not found');
    err.statusCode = 404;
    throw err;
  }
  return complaint;
}

async function adminListComplaints(prisma, page = 1, limit = 10, status, priority, city) {
  const skip = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (city) where.city = { contains: city, mode: 'insensitive' };
  const [items, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      include: { media: true, user: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.complaint.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getHighPriority(prisma, page = 1, limit = 20) {
  return adminListComplaints(prisma, page, limit, null, 'HIGH');
}

async function updateStatus(prisma, id, status, priority = null) {
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
    include: { media: true, user: true },
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
