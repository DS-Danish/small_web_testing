import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import {
  Person,
  PersonDocument,
  Site,
  SiteDocument,
  Visit,
  VisitDocument,
} from './models';

import {
  CreateVisitDto,
  PublishSiteDto,
} from './dto';

function normalizeAddress(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class AppService {
  public constructor(
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,

    @InjectModel(Site.name)
    private readonly siteModel: Model<SiteDocument>,

    @InjectModel(Visit.name)
    private readonly visitModel: Model<VisitDocument>,
  ) {}

  public async getPeople(): Promise<PersonDocument[]> {
    return this.personModel
      .find()
      .sort({ name: 1 })
      .exec();
  }

  public async getSites(): Promise<SiteDocument[]> {
    return this.siteModel
      .find()
      .sort({ address: 1 })
      .exec();
  }

  public async getSite(
    rawAddress: string,
  ): Promise<SiteDocument | null> {
    const address: string = normalizeAddress(rawAddress);

    return this.siteModel
      .findOne({ address })
      .exec();
  }

  public async publishSite(
    dto: PublishSiteDto,
  ): Promise<SiteDocument> {
    const address: string = normalizeAddress(dto.address);

    const existing: SiteDocument | null =
      await this.siteModel.findOne({ address }).exec();

    if (existing) {
      throw new ConflictException(
        'That address is already published.',
      );
    }

    const author: PersonDocument | null =
      await this.personModel.findById(dto.authorId).exec();

    if (!author) {
      throw new NotFoundException('Author not found.');
    }

    const site = new this.siteModel({
      address,
      title: dto.title.trim(),
      html: dto.html,
      textContent: extractText(dto.html),
      authorId: author.id,
      authorName: author.name,
    });

    return site.save();
  }

  public async searchSites(
    rawQuery: string,
  ): Promise<SiteDocument[]> {
    const query: string = rawQuery.trim();

    if (!query) {
      return [];
    }

    try {
      return await this.siteModel
        .find({
          $text: {
            $search: query,
          },
        })
        .select({
          score: {
            $meta: 'textScore',
          },
        })
        .sort({
          score: {
            $meta: 'textScore',
          },
        })
        .limit(25)
        .exec();
    } catch {
      const escaped: string = query.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );

      return this.siteModel
        .find({
          $or: [
            {
              title: {
                $regex: escaped,
                $options: 'i',
              },
            },
            {
              address: {
                $regex: escaped,
                $options: 'i',
              },
            },
            {
              textContent: {
                $regex: escaped,
                $options: 'i',
              },
            },
          ],
        })
        .limit(25)
        .exec();
    }
  }

  public async createVisit(
    dto: CreateVisitDto,
  ): Promise<VisitDocument> {
    const person: PersonDocument | null =
      await this.personModel.findById(dto.personId).exec();

    if (!person) {
      throw new NotFoundException('Person not found.');
    }

    const visit = new this.visitModel({
      personId: person.id,
      personName: person.name,
      address: normalizeAddress(dto.address),
      title: dto.title,
      method: dto.method,
      found: dto.found,
      visitedAt: new Date(),
    });

    return visit.save();
  }

  public async getHistory(
    personId: string,
  ): Promise<VisitDocument[]> {
    return this.visitModel
      .find({
        personId,
      })
      .sort({
        visitedAt: -1,
      })
      .limit(250)
      .exec();
  }
}