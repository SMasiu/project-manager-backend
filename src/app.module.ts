import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { UserModule } from './user/user.module';
import { formatError } from './graphql/error';
import { TeamModule } from './teams/team.module';
import { NotificationModule } from './notifications/notification.module';
import { FriendsModule } from './friends/friends.module';
import { ProjectsModule } from './projects/projects.module';
import { ColumnModule } from './project-columns/columns.module';
import { TasksModule } from './tasks/tasks.module';
import { TaskUsersModule } from './task-users/task-users.module';

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
		FriendsModule,
		ProjectsModule,
		ColumnModule,
		TasksModule,
		TaskUsersModule
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule { }
