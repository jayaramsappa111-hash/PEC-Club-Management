import { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser } from './auth';

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as AuthenticatedUser;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Super Admin always allowed
    if (user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    const hasRole = user.roles.some(r => allowedRoles.includes(r));
    if (!hasRole) {
      res.status(403).json({
        error: 'Forbidden: Insufficient privileges',
        requiredRoles: allowedRoles,
        currentRoles: user.roles
      });
      return;
    }

    next();
  };
}

export function requirePermission(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as AuthenticatedUser;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    if (!user.permissions.includes(requiredPermission)) {
      res.status(403).json({
        error: `Forbidden: Missing required permission [${requiredPermission}]`,
        requiredPermission,
        userPermissions: user.permissions
      });
      return;
    }

    next();
  };
}
