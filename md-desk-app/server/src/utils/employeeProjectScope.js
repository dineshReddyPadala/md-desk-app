/**
 * Employees see complaints linked to assigned projects (projectId) or legacy rows
 * (no projectId) from clients of those projects.
 */
async function getEmployeeProjectScope(prisma, employeeUserId) {
  const rows = await prisma.projectEmployee.findMany({
    where: { employeeId: employeeUserId },
    select: { projectId: true, project: { select: { clientId: true } } },
  });
  const projectIds = rows.map((r) => r.projectId);
  const clientIds = [...new Set(rows.map((r) => r.project.clientId).filter(Boolean))];
  return { projectIds, clientIds };
}

/** Prisma where clause for complaints visible in this employee scope */
function complaintsWhereFromScope(projectIds, clientIds) {
  if (!projectIds.length) {
    return { id: { in: [] } };
  }
  const or = [{ projectId: { in: projectIds } }];
  if (clientIds.length) {
    or.push({
      AND: [{ projectId: null }, { userId: { in: clientIds } }],
    });
  }
  return { OR: or };
}

async function employeeComplaintWhere(prisma, employeeUserId) {
  const { projectIds, clientIds } = await getEmployeeProjectScope(prisma, employeeUserId);
  return complaintsWhereFromScope(projectIds, clientIds);
}

async function canEmployeeAccessComplaint(prisma, employeeUserId, complaintId) {
  const scopeWhere = await employeeComplaintWhere(prisma, employeeUserId);
  const n = await prisma.complaint.count({
    where: { AND: [{ id: complaintId }, scopeWhere] },
  });
  return n > 0;
}

module.exports = {
  getEmployeeProjectScope,
  complaintsWhereFromScope,
  employeeComplaintWhere,
  canEmployeeAccessComplaint,
};
