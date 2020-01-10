import { Injectable } from "@nestjs/common";
import { DatabaseServide } from "src/shared/services/database.service";
import { NewUserType, NewFullUserType } from "./user.type";
import NewUser from "./new-user";
import { BadRequestFilter } from "src/shared/filters/error.filter";
import { take } from "rxjs/operators";
import { Observable } from "rxjs";
import { AuthService } from "src/shared/services/auth.service";

@Injectable()
export class UserService {

    constructor(private readonly databaseService: DatabaseServide, private readonly authService: AuthService) { }

    createUser(user: NewUserType): Observable<NewFullUserType> {
        return Observable.create(observer => {
            const newUser = new NewUser(user, this.databaseService);

            newUser.validate().pipe(take(1)).subscribe(valid => {
                if(valid) {
                    newUser.save().pipe(take(1)).subscribe(
                    user => {
                        observer.next(user);
                        observer.complete();
                    },
                    (err) => observer.error(err));
                } else {
                    observer.error(new BadRequestFilter(newUser.createErrorRaport()));
                }
            });
        });
    }

    getUser() {

    }

    getUsers() {

    }

}