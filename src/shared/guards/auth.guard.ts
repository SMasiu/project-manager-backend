
import { Injectable, CanActivate } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { AuthService } from '../services/auth.service';
import { UnauthorizedErrorFilter } from '../filters/error.filter';
import { take } from 'rxjs/operators';

@Injectable()
export class AuthGuard implements CanActivate {

	constructor(private readonly authSerive: AuthService) { }

	canActivate(context: ExecutionContextHost): Observable<boolean> {

		return Observable.create( observer => {
			
			const req = context.getArgs()[2].req;
			
			this.authSerive.varifyToken(req).pipe(take(1)).subscribe(
				decoded => {
					if(decoded.id) {
						
						req.authUser = {
							user_id: decoded.id
						}

						observer.next(true);
						return observer.complete();
					}
					else {
						
						observer.error(new UnauthorizedErrorFilter('Unauthorized user'));
					}
				},
				err => observer.error(err)
			);
		})
	}
}