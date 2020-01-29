import { Injectable, CanActivate } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { Observable } from "rxjs";
import { sameId } from "../functions/same-id";
import { UnauthorizedErrorFilter } from "../filters/error.filter";

@Injectable()
export class TeamModeratorGuard implements CanActivate {

    canActivate(context: ExecutionContextHost): Observable<boolean> {

        return Observable.create( observer => {
            const req = context.getArgs()[2].req;

            const { meInTeam } = req;
            const { user_id } = req.authUser;

            if(!meInTeam) {
                return observer.error(new UnauthorizedErrorFilter('Unauthorized user permission'));
            }
    
            if(sameId(meInTeam.owner, user_id)) {
                observer.next(true);
                return observer.complete();
            }

            if(meInTeam.permission !== 2) {
                return observer.error(new UnauthorizedErrorFilter('Unauthorized user permission'));
            }
    
            observer.next(true);
            return observer.complete();        

        });

    }

}

@Injectable()
export class TeamOwnerGuard implements CanActivate {

    canActivate(context: ExecutionContextHost): Observable<boolean> {

        return Observable.create( observer => {
            const req = context.getArgs()[2].req;

            const { meInTeam } = req;
            const { user_id } = req.authUser;

            if(!meInTeam) {
                return observer.error(new UnauthorizedErrorFilter('Unauthorized user permission'));
            }
    
            if(sameId(meInTeam.owner, user_id)) {
                observer.next(true);
                return observer.complete();
            }

            return observer.error(new UnauthorizedErrorFilter('Unauthorized user permission'));

        });

    }

}