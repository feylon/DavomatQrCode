import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";
import { ROLE } from "types/global.types";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ROLE[]>(
  ROLES_KEY,
  [context.getHandler(), context.getClass()],
);

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException("Role topilmadi");
    }

const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException("Sizda ruxsat yo‘q");
    }

    return true;
  }
}
