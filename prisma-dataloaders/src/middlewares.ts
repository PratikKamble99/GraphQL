import { AuthenticationError, ForbiddenError } from "apollo-server";

export function requireAuth(userId?: number){
    if(!userId){
        throw new AuthenticationError("Authentication required");
    }
}

export function requireRole(allowedRoles: string[], userRole?: string, ){
    if(!userRole || !allowedRoles.includes(userRole)){
        throw new ForbiddenError("Insufficient permissions");
    }
}

export function requireOwnership(resourceOwnerId: number, userId?: number){
    if(resourceOwnerId !== userId){
        throw new ForbiddenError("You do not own this resource");
    }
}