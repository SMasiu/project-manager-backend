import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { UserModule } from './user/user.module';
import { formatError } from './graphql/error';

@Module({
	imports: [
		GraphQLModule.forRoot({
			debug: true,
			playground: true,
			autoSchemaFile: 'schema.gql',
			formatError,
			context: ({req, res}) => ({req, res})
		}),
		UserModule
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule { }
