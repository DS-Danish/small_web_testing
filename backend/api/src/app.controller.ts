import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { AppService } from './app.service';

import {
  CreateVisitDto,
  PublishSiteDto,
} from './dto';

import {
  PersonDocument,
  SiteDocument,
  VisitDocument,
} from './models';

@Controller()
export class AppController {
  public constructor(
    private readonly service: AppService,
  ) {}

  @Get('people')
  public getPeople(): Promise<PersonDocument[]> {
    return this.service.getPeople();
  }

  @Get('sites')
  public getSites(): Promise<SiteDocument[]> {
    return this.service.getSites();
  }

  @Get('sites/search')
  public search(
    @Query('q') query: string,
  ): Promise<SiteDocument[]> {
    return this.service.searchSites(query ?? '');
  }

  @Get('sites/:address')
  public getSite(
    @Param('address') address: string,
  ): Promise<SiteDocument | null> {
    return this.service.getSite(address);
  }

  @Post('sites')
  public publish(
    @Body() dto: PublishSiteDto,
  ): Promise<SiteDocument> {
    return this.service.publishSite(dto);
  }

  @Post('visits')
  public createVisit(
    @Body() dto: CreateVisitDto,
  ): Promise<VisitDocument> {
    return this.service.createVisit(dto);
  }

  @Get('history/:personId')
  public history(
    @Param('personId') personId: string,
  ): Promise<VisitDocument[]> {
    return this.service.getHistory(personId);
  }
}