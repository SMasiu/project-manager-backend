import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { DatabaseServide } from 'src/shared/services/database.service';

@Module({
	providers: [
        UserService,
        UserResolver,
        DatabaseServide
    ],
})
export class UserModule { }
