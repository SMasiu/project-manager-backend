import { NewUserType, NewFullUserType } from "./user.type";
import * as Joi from '@hapi/joi';
import { DatabaseService } from "src/shared/services/database.service";
import { Observable } from "rxjs";
import { ServerErrorFilter } from "src/shared/filters/error.filter";
import * as bcrypt from 'bcrypt';
import { take } from "rxjs/operators";

class NewUser {

    id: string;

    validationShema: Joi.ObjectSchema;
    valid: boolean = false;
    validationError: string;

    constructor (private user: NewUserType, private databaseService: DatabaseService) { }

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
        return Observable.create(observer => {
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

            this.databaseService.query(`
                SELECT nick, email FROM users WHERE nick = $1 OR email = $2 LIMIT 2;
            `, [this.user.nick, this.user.email]).pipe(take(1)).subscribe( rows => {
                
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
                
            }, () => new ServerErrorFilter());
        });
    }

    createErrorRaport() {
        return this.validationError;
    }

    save(): Observable<NewFullUserType> {
        return Observable.create(observer => {

            bcrypt.hash(this.user.password, parseInt(process.env.BCRYPT_SALT))
                .then( hash => {
                    const { email, name, surname, nick } = this.user;
                    this.databaseService.queryMany([
                        {
                            sql: `
                                INSERT INTO users
                                (email, password, name, surname, nick)
                                VALUES ($1, $2, $3, $4, $5);
                            `,
                            args: [email, hash, name, surname, nick]
                        },{
                            sql: `
                                SELECT currval('users_user_id_seq');
                            `
                        }
                    ]).subscribe( ([_, rows2]) => {
                        this.id = rows2[0].currval;
                        observer.next({...this.user, user_id: this.id});
                        observer.complete();
                }, err => observer.error(err));
            })
            .catch( () => observer.error(new ServerErrorFilter()));
        });
    }

}

export default NewUser;