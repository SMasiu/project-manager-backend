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
			playground: {
				endpoint: '/graphql',
				settings: {
					"request.credentials": "same-origin",
				}
			},
			autoSchemaFile: 'schema.gql',
			formatError,
			context: ({req, res}) => ({req, res}),
			cors: {
                credentials: true,
                origin: true,
            },
		}),
		UserModule
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule { }
