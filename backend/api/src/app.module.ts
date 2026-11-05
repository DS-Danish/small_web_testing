import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import {
  Person,
  PersonSchema,
  Site,
  SiteSchema,
  Visit,
  VisitSchema,
} from './models';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ??
        'mongodb://localhost:27017/small-web',
    ),

    MongooseModule.forFeature([
      {
        name: Person.name,
        schema: PersonSchema,
      },
      {
        name: Site.name,
        schema: SiteSchema,
      },
      {
        name: Visit.name,
        schema: VisitSchema,
      },
    ]),
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}