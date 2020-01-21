import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { UserModule } from './user/user.module';
import { formatError } from './graphql/error';
import { TeamModule } from './teams/team.module';
import { NotificationModule } from './notifications/notification.module';
import { DatabaseService } from './shared/services/database.service';

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
		UserModule,
		TeamModule,
		NotificationModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule { }
