import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class User {
    @Field(type => ID)
    id: string;

    @Field()
    name: string;

    @Field()
    surname: string;

    @Field()
    nick: string;
}

@ObjectType()
export class Me extends User {
    
    @Field()
    email: string;
}