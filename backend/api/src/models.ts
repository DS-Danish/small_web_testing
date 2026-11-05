import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PersonDocument = HydratedDocument<Person>;
export type SiteDocument = HydratedDocument<Site>;
export type VisitDocument = HydratedDocument<Visit>;

@Schema({
  timestamps: true,
})
export class Person {
  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  name!: string;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

@Schema({
  timestamps: true,
})
export class Site {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  address!: string;

  @Prop({
    required: true,
    trim: true,
  })
  title!: string;

  @Prop({
    required: true,
  })
  html!: string;

  @Prop({
    required: true,
  })
  textContent!: string;

  @Prop({
    required: true,
  })
  authorId!: string;

  @Prop({
    required: true,
  })
  authorName!: string;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

SiteSchema.index({
  title: 'text',
  address: 'text',
  textContent: 'text',
});

@Schema({
  timestamps: true,
})
export class Visit {
  @Prop({
    required: true,
    index: true,
  })
  personId!: string;

  @Prop({
    required: true,
  })
  personName!: string;

  @Prop({
    required: true,
    lowercase: true,
  })
  address!: string;

  @Prop()
  title?: string;

  @Prop({
    required: true,
  })
  method!: string;

  @Prop({
    required: true,
  })
  found!: boolean;

  @Prop({
    required: true,
    index: true,
  })
  visitedAt!: Date;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);

VisitSchema.index({
  personId: 1,
  visitedAt: -1,
});