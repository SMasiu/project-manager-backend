import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { DatabaseServide } from 'src/shared/services/database.service';
import { AuthService } from 'src/shared/services/auth.service';
import { CookieService } from 'src/shared/services/cookie.service';

@Module({
	providers: [
        UserService,
        AuthService,
        UserResolver,
        DatabaseServide,
        CookieService
    ],
})
export class UserModule { }
