import { StaffRole, UserType, CustomerUserRole } from '@prisma/client';

export class AuthContext {
  userId: string;
  email: string;
  fullName: string;
  userType: UserType;
  organizationId: string;
  staffRole?: StaffRole;
  customerId?: string;
  customerRole?: CustomerUserRole;
}
