export const DEPARTMENTS = [
  'Labour Dept',
  'Police',
  'EOBI',
  'Social Security',
  'FBR',
  'Excise & Taxation',
  'Civil Defense',
  'District Administration'
] as const;

export type DepartmentName = typeof DEPARTMENTS[number];

export const ROLE_PERMISSIONS = {
  super_admin: {
    canManageUsers: true,
    canViewAll: true,
    canEditAll: true,
    allowedRoutes: ['*']
  },
  wwb_admin: {
    canManageUsers: false,
    canViewAll: true,
    canEditAll: true,
    allowedRoutes: ['/workers', '/employers', '/reports', '/verification']
  },
  dept_officer: {
    canManageUsers: false,
    canViewAll: false, // filtered by dept
    canEditAll: false,
    allowedRoutes: ['/dashboard', '/verification', '/workers', '/employers']
  },
  employer: {
    canManageUsers: false,
    canViewAll: false, // only own workers
    canEditAll: false,
    allowedRoutes: ['/dashboard', '/workers/new', '/workers']
  }
};
