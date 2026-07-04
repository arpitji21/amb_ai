import type { Role } from '@/types';

export const HOME_BY_ROLE: Record<Role, string> = {
  ems_command: '/ems',
  ambulance_staff: '/ambulance',
  doctor: '/doctor',
  family: '/family',
};
