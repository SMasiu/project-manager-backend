import { NewUserType, NewFullUserType } from "./user.type";
import * as Joi from '@hapi/joi';
import { DatabaseService } from "src/shared/services/database.service";
import { Observable } from "rxjs";
import { ServerErrorFilter } from "src/shared/filters/error.filter";
import * as bcrypt from 'bcrypt';
import { take, map } from "rxjs/operators";

class NewUser {

    id: string;

    validationShema: Joi.ObjectSchema;
    valid: boolean = false;
    validationError: string;

    constructor (private user: NewUserType, private databaseService: DatabaseService) {
        this.user.nick = this.user.nick.toLowerCase();
        this.user.email = this.user.email.toLowerCase();
    }

    private createValidationSchema() {
        this.validationShema = Joi.object({
            email: Joi.string().email().required().max(320),
            name: Joi.string().required().max(20).min(2),
            surname: Joi.string().required().max(30).min(2),
            nick: Joi.string().max(30).min(4).required().alphanum(),
            password: Joi.string().max(64).min(8).required(),
            confirmPassword: Joi.ref('password')
        })
    }

    validate(): Observable<boolean> {
        return Observable.create(async observer => {
            this.createValidationSchema();
            const { error } = this.validationShema.validate(this.user);
            if(error) {
                this.valid = false;
                this.validationError = error.message;
                observer.next(false);
                return observer.complete();
            } else {
                this.valid = true;
            }

            const rows = await this.databaseService.query(observer, `
                SELECT nick, email FROM users WHERE nick = $1 OR email = $2 LIMIT 2;
            `, [this.user.nick, this.user.email]).pipe(take(1)).toPromise();

            if(!rows) {
                return observer.complete();
            }

            if(rows.length) {
                const { email, nick } = this.user;
                this.valid = false;
                if(rows.length === 2 || (rows[0].email === email && rows[0].nick === nick)) {
                    this.validationError = 'Email and nick are alredy taken';
                } else {
                    this.validationError = rows[0].email === email ? 'Email is alredy taken' : 'Nick is alredy taken';
                }
            }

            observer.next(this.valid);
            return observer.complete();
            
        });
    }

    createErrorRaport() {
        return this.validationError;
    }

    save(): Observable<NewFullUserType> {
        return Observable.create(async observer => {

            bcrypt.hash(this.user.password, parseInt(process.env.BCRYPT_SALT))
                .then( async hash => {
                    let { email, name, surname, nick } = this.user;

                    const user = await this.databaseService.query(observer, `
                        INSERT INTO users
                        (email, password, name, surname, nick)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING user_id, email, name, surname, nick;
                    `, [email, hash, name, surname, nick]
                    ).pipe(
                        take(1),
                        map( rows => rows[0] )
                    ).toPromise();

                    if(!user) {
                        return observer.complete();
                    }

                    observer.next(user);
                    observer.complete();
                
            })
            .catch( () => observer.error(new ServerErrorFilter()));
        });
    }

}

export default NewUser;