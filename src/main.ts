import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import db from './database/client';
import * as dotenv from 'dotenv';
import Migration from './database/migration';
import { take } from 'rxjs/operators';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
	dotenv.config();

	db.connect().pipe(take(1)).subscribe(
		() => {
			const migration = new Migration();

			migration.migrate().pipe(take(1)).subscribe(
				() => console.log('Checking for table migration...'),
				err => { throw err },
				async () => {
					const app = await NestFactory.create(AppModule);
					
					app.enableCors({
						origin: 'http://localhost:4200',
						credentials: true
					});
				
					app.use(cookieParser());
					await app.listen(3000);
					console.log('Complete migration...')
				}
			);
		},
		err => { throw err; }
		
	);
}
bootstrap();
