import { Injectable, CanActivate } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { Observable } from "rxjs";
import { sameId } from "../functions/same-id";
import { UnauthorizedErrorFilter } from "../filters/error.filter";

@Injectable()
export class ProjectModeratorGuard implements CanActivate {
    canActivate(context: ExecutionContextHost): Observable<boolean> {
        return Observable.create( observer => {

            const [_, __, {req}] = context.getArgs();

            const { meInProject: { project: { owner, creator_id }, members }, authUser: { user_id } } = req;

            if(sameId(owner, user_id) || sameId(creator_id, user_id)) {
                observer.next(true);
                return observer.complete();
            }

            if(members.length && members[0].permission === 2) {
                observer.next(true);
                return observer.complete();
            }

            return observer.error(new UnauthorizedErrorFilter('Project permission:moderator'));

        });
    }
}

@Injectable()
export class ProjectAdminGuard implements CanActivate {
    canActivate(context: ExecutionContextHost): Observable<boolean> {
        return Observable.create( observer => {

            const [_, __, {req}] = context.getArgs();
            
            const { meInProject: { project: { owner, creator_id } }, authUser: { user_id } } = req;

            if(sameId(owner, user_id) || sameId(creator_id, user_id)) {
                observer.next(true);
                return observer.complete();
            }
            
            return observer.error(new UnauthorizedErrorFilter('Project permission:owner'));

        });
    }
}