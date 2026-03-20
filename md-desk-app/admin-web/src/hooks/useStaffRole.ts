import { useAuth } from './useAuth';

/** Admin has full access; employee is read-only on most modules but can update complaint status/priority. */
export function useStaffRole() {
  const { user } = useAuth();
  const role = (user as { role?: string } | null)?.role;
  const isAdmin = role === 'ADMIN';
  const isEmployee = role === 'EMPLOYEE';
  const canMutate = isAdmin;
  const canUpdateComplaint = isAdmin || isEmployee;
  return { role, isAdmin, isEmployee, canMutate, canUpdateComplaint };
}
